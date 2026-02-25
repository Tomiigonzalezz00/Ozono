from django.shortcuts import render
from .models import Item, PuntoVerde, CalendarioAmbiental, Favorite, ChatSession, ChatMessage, EventoUsuario, PuntoVote
from rest_framework import viewsets
from .serializers import ItemSerializer, PuntoVerdeSerializer, CalendarioAmbientalSerializer, UserRegistrationSerializer, PasswordResetRequestSerializer, PasswordResetConfirmSerializer, FavoriteSerializer, ChatSessionSerializer, ChatMessageSerializer, EventoUsuarioSerializer
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework import filters
from rest_framework.authtoken.views import ObtainAuthToken
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
import google.generativeai as genai
import os
from django.http import JsonResponse
import math


 #Modelo de Gemini para el chatbot
MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

# ===============================
# CALCULO DE DISTANCIA 
# ===============================
def distancia_km(lat1, lon1, lat2, lon2):
    R = 6371  # radio tierra km

    lat1, lon1, lat2, lon2 = map(math.radians,
        [lat1, lon1, lat2, lon2])

    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = math.sin(dlat/2)**2 + \
        math.cos(lat1) * math.cos(lat2) * \
        math.sin(dlon/2)**2

    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c


def obtener_puntos_cercanos(user_lat, user_lng, limite=5):
    puntos = PuntoVerde.objects.exclude(latitud=None).exclude(longitud=None)

    resultados = []

    for p in puntos:
        dist = distancia_km(
            user_lat, user_lng,
            float(p.latitud),
            float(p.longitud)
        )
        resultados.append((dist, p))

    resultados.sort(key=lambda x: x[0])

    return [p[1] for p in resultados[:limite]]


def home(request):
    items = Item.objects.all()
    return render(request, 'myapp/home.html', {'items': items})


class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.all()
    serializer_class = ItemSerializer


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]  # Permite que cualquiera se registre

    def perform_create(self, serializer):
        # Guardamos el usuario
        user = serializer.save()

        # Lógica de envío de email de bienvenida
        if user.email:
            try:
                send_mail(
                    subject='¡Bienvenido a Ozono!',
                    message=f'Hola {user.username}, gracias por registrarte en Ozono. Juntos cuidamos el planeta.',
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=False,
                )
            except Exception as e:
                print(f"Error enviando email: {e}")

    def create(self, request, *args, **kwargs):
        # 1. Creamos el usuario normalmente
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        # 2. Recuperamos el usuario creado
        user = User.objects.get(username=serializer.data['username'])

        # 3. Creamos o recuperamos su token
        token, created = Token.objects.get_or_create(user=user)

        # 4. Devolvemos el Token y los datos (¡Auto-Login!)
        return Response({
            'token': token.key,
            'user_id': user.pk,
            'username': user.username,
            'email': user.email
        }, status=status.HTTP_201_CREATED)


# --- VISTA DE LOGIN ---
class CustomLoginView(ObtainAuthToken):
    # Esta vista nativa de DRF recibe username/password y devuelve el token
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(
            data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user_id': user.pk,
            'email': user.email
        })


# ---REINICIO DE CONTRASEÑA---
class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            try:
                user = User.objects.get(email=email)

                # Generamos token y uid
                token = default_token_generator.make_token(user)
                uid = urlsafe_base64_encode(force_bytes(user.pk))

                # Construimos el link al FRONTEND (React)
                # Ajusta localhost:3000 si tu frontend está en otro lado
                reset_link = f"http://localhost:3000/reset-password/{uid}/{token}"

                # Enviamos el email
                send_mail(
                    subject='Restablecer contraseña - Ozono',
                    message=f'Hola {user.username},\n\nUsa el siguiente enlace para cambiar tu contraseña:\n\n{reset_link}\n\nSi no lo solicitaste, ignora este mensaje.',
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[email],
                    fail_silently=False,
                )
            except User.DoesNotExist:
                # Por seguridad, no decimos si el usuario no existe
                pass

            return Response({"message": "Si el email existe, se ha enviado un enlace."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetConfirmView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = PasswordResetConfirmSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Contraseña restablecida con éxito."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def get_puntos_verdes(request):
    puntos = PuntoVerde.objects.all()
    serializer = PuntoVerdeSerializer(puntos, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def get_calendario_ambiental(request):
    calendario = CalendarioAmbiental.objects.all()
    serializer = CalendarioAmbientalSerializer(calendario, many=True)
    return Response(serializer.data)


# --- Puntos verdes Favoritos ---
class FavoriteToggleView(APIView):
    permission_classes = [IsAuthenticated]  # Solo usuarios logueados

    def post(self, request, punto_id):
        user = request.user
        try:
            punto = PuntoVerde.objects.get(id=punto_id)
        except PuntoVerde.DoesNotExist:
            return Response({"error": "Punto no encontrado"}, status=status.HTTP_404_NOT_FOUND)

        # Lógica Toggle: Si existe lo borramos, si no, lo creamos
        favorite_item, created = Favorite.objects.get_or_create(
            user=user, punto_verde=punto)

        if not created:
            favorite_item.delete()
            return Response({"status": "removed"}, status=status.HTTP_200_OK)

        return Response({"status": "added"}, status=status.HTTP_201_CREATED)


class UserFavoritesView(generics.ListAPIView):
    serializer_class = FavoriteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Favorite.objects.filter(user=self.request.user)


# --- Chatbot ---

# 1. Vista para listar y crear sesiones de chat (Solo logueados)
class ChatSessionView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ChatSessionSerializer

    def get_queryset(self):
        # Retorna solo los chats del usuario, ordenados del más reciente al más viejo
        return ChatSession.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# 2. Vista para ver detalles de una sesión o eliminarla (Solo logueados)
class ChatSessionDetailView(generics.RetrieveDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ChatSessionSerializer
    lookup_field = 'id'

    def get_queryset(self):
        return ChatSession.objects.filter(user=self.request.user)


# Configuración global de Gemini (Toma la API key del settings.py)
genai.configure(api_key=settings.GEMINI_API_KEY)



# 3. Vista principal del motor de IA (Para Logueados e Invitados)
@api_view(['POST'])
@permission_classes([AllowAny])
def chat_with_gemini(request):
    user_message_text = request.data.get('message')
    session_id = request.data.get('session_id')
    user_lat = request.data.get('lat')
    user_lng = request.data.get('lng')

    if not user_message_text:
        return Response({"error": "El mensaje es obligatorio"}, status=400)

    # --- 1. RECOPILAR DATOS DE LA BASE DE DATOS ---
    puntos = PuntoVerde.objects.all()
    puntos_texto = "\n\n--- BASE DE DATOS DE PUNTOS VERDES EN OZONO ---\n"

    if puntos.exists():
        for p in puntos:
            nombre = getattr(p, 'nombre', 'Sin nombre')
            direccion = getattr(p, 'direccion', 'Sin dirección')
            puntos_texto += f"- Punto: {nombre} | Dirección: {direccion}\n"
    else:
        puntos_texto += "Actualmente NO hay puntos verdes registrados en el sistema.\n"

# ===============================
# UBICACION + CONTEXTO CERCANO
# ===============================
    ubicacion_texto = ""
    contexto_puntos = ""

    if user_lat and user_lng:
        try:
            user_lat = float(user_lat)
            user_lng = float(user_lng)

            ubicacion_texto = (
                f"\n\n--- UBICACIÓN DEL USUARIO ---\n"
                f"Latitud: {user_lat}\nLongitud: {user_lng}\n"
            )

            puntos_cercanos = obtener_puntos_cercanos(user_lat, user_lng)

            if puntos_cercanos:
                contexto_puntos = (
                    "\n\n--- PUNTOS DE RECICLAJE CERCANOS ---\n"
                    "El usuario YA compartió su ubicación. "
                    "NO debes pedir ubicación nuevamente.\n"
                )

                for p in puntos_cercanos:
                    nombre = getattr(p, 'nombre', 'Sin nombre')
                    direccion = getattr(p, 'direccion', 'Sin dirección')
                    contexto_puntos += f"- {nombre} | {direccion}\n"

        except Exception as e:
            print("Error buscando puntos cercanos:", e)

    else:
        ubicacion_texto = (
            "\n\n--- UBICACIÓN DEL USUARIO ---\n"
            "El usuario NO compartió ubicación.\n"
        )
    
    # --- 3. INSTRUCCIÓN ESTRICTA (EL NUEVO CEREBRO DE OZZY) ---
    system_instruction = (
    "Eres Ozzy, el asistente experto en reciclaje del proyecto Ozono. "
    "REGLA DE ORO: NUNCA le digas al usuario que vaya a buscar al mapa o a la sección de puntos de la app. "
    "TÚ tienes la información del mapa y TÚ debes darle la respuesta directamente. "
    "Si existen puntos cercanos, recomienda esos primero y NO vuelvas a pedir ubicación. "
    f"{puntos_texto}{ubicacion_texto}{contexto_puntos}"
)

    # --- CAMINO A: USUARIO LOGUEADO ---
    if request.user.is_authenticated:
        if session_id:
            try:
                session = ChatSession.objects.get(id=session_id, user=request.user)
            except ChatSession.DoesNotExist:
                return Response({"error": "Sesión no encontrada"}, status=404)
        else:
            session = ChatSession.objects.create(user=request.user, title="Nuevo Chat")

        # 1. Cargar historial PREVIO (Aún no guardamos el mensaje nuevo)
        past_messages = session.messages.order_by('created_at')[:10]
        history_for_gemini = []

        for msg in past_messages:
            role = "user" if msg.sender == 'user' else "model"
        # Si por algún error pasado hay dos "user" juntos, saltamos uno.
            if history_for_gemini and history_for_gemini[-1]['role'] == role: 
                continue
            history_for_gemini.append({"role": role, "parts": [msg.text]})

        # Filtro extra: Si el historial termina en "user", lo sacamos porque 
        # send_message() ya va a enviar un rol "user" y chocarían.
        if history_for_gemini and history_for_gemini[-1]['role'] == 'user':
            history_for_gemini.pop()

        # 2. Llamar a la API de Gemini
        try:
            # Usamos el modelo más actualizado
            model = genai.GenerativeModel('gemini-2.5-flash', system_instruction=system_instruction)
            chat = model.start_chat(history=history_for_gemini)
            response = chat.send_message(user_message_text)
            ai_response_text = response.text

        #Solo si Gemini responde bien, guardamos AMBOS mensajes.
            ChatMessage.objects.create(session=session, sender='user', text=user_message_text)
            ChatMessage.objects.create(session=session, sender='bot', text=ai_response_text)

            # Actualizar título del chat
            if session.messages.count() <= 2:
                session.title = user_message_text[:30] + "..."
                session.save()

            return Response({
                "response": ai_response_text,
                "session_id": session.id,
                "session_title": session.title
            })

        except Exception as e:
            print(f"Error Gemini (Logueado): {e}")
            return Response({"error": str(e)}, status=500)

    # --- CAMINO B: USUARIO INVITADO ---
    else:
        try:
            model = genai.GenerativeModel('gemini-2.5-flash', system_instruction=system_instruction)
            response = model.generate_content(user_message_text)
            
            return Response({
                "response": response.text,
                "session_id": None,
                "session_title": None
            })

        except Exception as e:
            print(f"Error Gemini (Invitado): {e}")
            return Response({"error": str(e)}, status=500)
        
#Prueba Gemini
def test_gemini(request):
    api_key = os.getenv("GEMINI_API_KEY")

    genai.configure(api_key=api_key)

    model = genai.GenerativeModel("gemini-2.5-flash")

    response = model.generate_content("Decime hola en español")

    return JsonResponse({ "respuesta": response.text})


# --- Eventos del usuario ---
class EventoUsuarioViewSet(viewsets.ModelViewSet):
    serializer_class = EventoUsuarioSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return EventoUsuario.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print("Validation Errors:", serializer.errors)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class PuntoVerdeViewSet(viewsets.ModelViewSet):
    queryset = PuntoVerde.objects.all()
    serializer_class = PuntoVerdeSerializer

    def get_permissions(self):
        # Cualquiera puede ver, solo logueados pueden crear/editar/borrar
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        # AQUÍ OCURRE LA MAGIA:
        # Al guardar, asignamos automáticamente el usuario y marcamos el flag
        serializer.save(
            creator=self.request.user,
            is_user_generated=True
        )


# --- VISTA DE VOTACIÓN Y ELIMINACIÓN ---
class VotePuntoView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, punto_id):
        vote_type = request.data.get('vote_type')  # Espera 'valid' o 'invalid'

        try:
            punto = PuntoVerde.objects.get(id=punto_id)
        except PuntoVerde.DoesNotExist:
            return Response({"error": "Punto no encontrado"}, status=404)

        # Solo permitimos votar en puntos creados por usuarios
        if not punto.is_user_generated:
            return Response({"error": "Solo se pueden validar puntos de usuarios"}, status=400)

        user = request.user

        # 1. Lógica de Voto (Toggle)
        try:
            vote = PuntoVote.objects.get(user=user, punto=punto)
            if vote.vote_type == vote_type:
                # Si el usuario vota lo mismo que ya tenía, borramos el voto (deshacer)
                vote.delete()
            else:
                # Si cambia de opinión, actualizamos
                vote.vote_type = vote_type
                vote.save()
        except PuntoVote.DoesNotExist:
            # Voto nuevo
            PuntoVote.objects.create(
                user=user, punto=punto, vote_type=vote_type)

        # 2. Lógica de Eliminación Automática
        # Requisito: "Si la brecha no supera el 25% del total de números válidos, se elimina"

        valid_count = punto.votes.filter(vote_type='valid').count()
        invalid_count = punto.votes.filter(vote_type='invalid').count()

        # Ponemos un mínimo de votos (ej: 3) para no borrar un punto apenas se crea con 1 voto negativo
        if (valid_count + invalid_count) >= 3:

            diferencia = valid_count - invalid_count
            umbral = valid_count * 0.25  # El 25% de los válidos

            # Si hay más inválidos que válidos, la diferencia es negativa, así que se elimina seguro.
            # Si la diferencia es positiva pero muy pequeña (menor al 25%), también se elimina.
            if diferencia < umbral:
                punto.delete()
                return Response({
                    "status": "deleted",
                    "message": "Punto eliminado por la comunidad (exceso de votos inválidos)"
                }, status=200)

        return Response({"status": "ok"}, status=200)


  
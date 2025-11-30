from django.shortcuts import render
from .models import Item, PuntoVerde, Consejo, CalendarioAmbiental
from rest_framework import viewsets
from .serializers import ItemSerializer, PuntoVerdeSerializer, ConsejoSerializer, CalendarioAmbientalSerializer,PasswordResetRequestSerializer,PasswordResetConfirmSerializer
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny
from rest_framework.decorators import api_view
from rest_framework import generics
from rest_framework import filters

from .serializers import UserRegistrationSerializer
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth.models import User

from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes

def home(request):
    items = Item.objects.all()
    return render(request, 'myapp/home.html', {'items': items})

class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.all()
    serializer_class = ItemSerializer

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny] # Permite que cualquiera se registre

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
        serializer = self.serializer_class(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user_id': user.pk,
            'email': user.email
        })
    
  #---REINICIO DE CONTRASEÑA---
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
def get_consejos(request):
    categoria = request.query_params.get('categoria', None)
    consejos = Consejo.objects.all()
    if categoria:
        consejos = consejos.filter(categoria__icontains=categoria)
    serializer = ConsejoSerializer(consejos, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def get_calendario_ambiental(request):
    calendario = CalendarioAmbiental.objects.all()
    serializer = CalendarioAmbientalSerializer(calendario, many=True)
    return Response(serializer.data)
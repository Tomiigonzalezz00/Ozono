from django.shortcuts import render
from .models import Item, PuntoVerde, Consejo, CalendarioAmbiental
from rest_framework import viewsets
from .serializers import ItemSerializer, PuntoVerdeSerializer, ConsejoSerializer, CalendarioAmbientalSerializer
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

def home(request):
    items = Item.objects.all()
    return render(request, 'myapp/home.html', {'items': items})

class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.all()
    serializer_class = ItemSerializer

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer

    def perform_create(self, serializer):
        # Guardamos el usuario
        user = serializer.save()
        
        # Lógica de envío de email de bienvenida
        if user.email:
            try:
                send_mail(
                    subject='¡Bienvenido a Ozono!',
                    message=f'Hola {user.username}, gracias por registrarte en Ozono. Juntos cuidamos el planeta.',
                    from_email=settings.EMAIL_HOST_USER,
                    recipient_list=[user.email],
                    fail_silently=False,
                )
            except Exception as e:
                # Loguear el error si es necesario, pero no detener el registro
                print(f"Error enviando email: {e}")

    def create(self, request, *args, **kwargs):
        # Sobrescribimos create para devolver el token directamente al registrarse (opcional, pero recomendado)
        response = super().create(request, *args, **kwargs)
        
        # Si quieres devolver el token también al registrarse, descomenta esto:
        # user = User.objects.get(username=response.data['username'])
        # token, created = Token.objects.get_or_create(user=user)
        # return Response({'token': token.key, 'user': response.data}, status=status.HTTP_201_CREATED)
        
        return response


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
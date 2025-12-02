from rest_framework import serializers
from .models import Item, PuntoVerde, CalendarioAmbiental, Favorite, ChatSession, ChatMessage, EventoUsuario
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import force_str

class ItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Item
        fields ='_all_'


class PuntoVerdeSerializer(serializers.ModelSerializer):
    class Meta:
        model = PuntoVerde
        fields = '__all__'

class CalendarioAmbientalSerializer(serializers.ModelSerializer):
    class Meta:
        model = CalendarioAmbiental
        fields = ['id', 'evento', 'fecha', 'descripcion']

class UserRegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'email', 'password']
        extra_kwargs = {
            'password': {'write_only': True}  # La contraseña no se devuelve en el JSON
        }

    def create(self, validated_data):
        # Usamos create_user para hashear la contraseña automáticamente
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        return user

# Serializer para pedir el reseteo (recibe email)
class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        # Verificamos si el usuario existe, pero por seguridad no devolvemos error si no existe
        return value

# Serializer para confirmar el cambio (recibe token, uid y password)
class PasswordResetConfirmSerializer(serializers.Serializer):
    new_password = serializers.CharField(write_only=True, min_length=1)
    uid = serializers.CharField()
    token = serializers.CharField()

    def validate(self, data):
        # 1. Decodificar el ID del usuario
        try:
            uid = force_str(urlsafe_base64_decode(data['uid']))
            self.user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            raise serializers.ValidationError("Enlace inválido o usuario no encontrado.")

        # 2. Verificar que el token sea válido y no haya expirado
        if not default_token_generator.check_token(self.user, data['token']):
            raise serializers.ValidationError("El enlace de restablecimiento es inválido o ha expirado.")

        return data

    def save(self):
        # Establecer la nueva contraseña
        self.user.set_password(self.validated_data['new_password'])
        self.user.save()
        return self.user
 
#--- Puntos verdes Favoritos ---
class FavoriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Favorite
        fields = ['id', 'punto_verde', 'created_at']

#---Historial de chat---
class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ['id', 'sender', 'text', 'created_at']

class ChatSessionSerializer(serializers.ModelSerializer):
    # Incluimos el último mensaje como 'preview' 
    messages = ChatMessageSerializer(many=True, read_only=True)
    
    class Meta:
        model = ChatSession
        fields = ['id', 'title', 'created_at', 'messages']

class EventoUsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventoUsuario
        fields = ['id', 'fecha', 'titulo', 'descripcion']
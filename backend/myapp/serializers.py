from rest_framework import serializers
from .models import Item, PuntoVerde, Consejo, CalendarioAmbiental
from django.contrib.auth.models import User


class ItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Item
        fields ='_all_'


class PuntoVerdeSerializer(serializers.ModelSerializer):
    class Meta:
        model = PuntoVerde
        fields = '__all__'


class ConsejoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Consejo
        fields = ['id', 'titulo', 'categoria', 'descripcion']


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
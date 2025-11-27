from rest_framework import serializers
from .models import Item, PuntoVerde, Consejo, CalendarioAmbiental

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

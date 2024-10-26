from rest_framework import serializers
from .models import Item, PuntoVerde, ConsejosRRR, CalendarioAmbiental

class ItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Item
        fields ='_all_'


class PuntoVerdeSerializer(serializers.ModelSerializer):
    class Meta:
        model = PuntoVerde
        fields = '__all__'


class ConsejosRRRSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConsejosRRR
        fields = ['id', 'titulo', 'categoria', 'descripcion']


class CalendarioAmbientalSerializer(serializers.ModelSerializer):
    class Meta:
        model = CalendarioAmbiental
        fields = ['id', 'evento', 'fecha', 'descripcion']

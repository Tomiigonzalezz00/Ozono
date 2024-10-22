from rest_framework import serializers
from .models import Item, PuntoVerde

class ItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Item
        fields ='_all_'


class PuntoVerdeSerializer(serializers.ModelSerializer):
    class Meta:
        model = PuntoVerde
        fields = '__all__'
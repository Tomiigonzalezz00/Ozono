from django.shortcuts import render
from .models import Item, PuntoVerde, ConsejosRRR, CalendarioAmbiental
from rest_framework import viewsets
from .serializers import ItemSerializer, PuntoVerdeSerializer, ConsejosRRRSerializer, CalendarioAmbientalSerializer
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


def home(request):
    items = Item.objects.all()
    return render(request, 'myapp/home.html', {'items': items})

class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.all()
    serializer_class = ItemSerializer

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        if username is None or password is None:
            return Response({'error': 'Please provide both username and password'}, status=status.HTTP_400_BAD_REQUEST)
        user = User.objects.create_user(username=username, password=password)
        token,  = Token.objects.getor_create(user=user)
        return Response({'token': token.key}, status=status.HTTP_201_CREATED)

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)
        if user is None:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        token,  = Token.objects.get_or_create(user=user)
        return Response({'token': token.key}, status=status.HTTP_200_OK)
    

@api_view(['GET'])
def get_puntos_verdes(request):
    puntos = PuntoVerde.objects.all()
    serializer = PuntoVerdeSerializer(puntos, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def get_consejos_rrr(request):
    categoria = request.query_params.get('categoria', None)
    consejos = ConsejosRRR.objects.all()
    if categoria:
        consejos = consejos.filter(categoria__icontains=categoria)
    serializer = ConsejosRRRSerializer(consejos, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def get_calendario_ambiental(request):
    calendario = CalendarioAmbiental.objects.all()
    serializer = CalendarioAmbientalSerializer(calendario, many=True)
    return Response(serializer.data)
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views import ItemViewSet, RegisterView, CustomLoginView 


router = DefaultRouter()
router.register(r'items', ItemViewSet)

urlpatterns = [
    path('', views.home, name='home'),
    path('api/', include(router.urls)),
    
    # --- NUEVOS ENDPOINTS DE AUTENTICACIÓN ---
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/login/', CustomLoginView.as_view(), name='login'),
    
    # Tus endpoints existentes
    path('api/puntos-verdes/', views.get_puntos_verdes, name='get_puntos_verdes'),
    path('api/consejos/', views.get_consejos, name='get_consejos'),
    path('api/calendario-ambiental/', views.get_calendario_ambiental, name='get_calendario_ambiental'),
]
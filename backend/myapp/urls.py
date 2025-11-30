from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views import ItemViewSet, RegisterView, CustomLoginView, PasswordResetRequestView, PasswordResetConfirmView


router = DefaultRouter()
router.register(r'items', ItemViewSet)

urlpatterns = [
    path('', views.home, name='home'),
    path('api/', include(router.urls)),
    
    # --- ENDPOINTS DE AUTENTICACIÓN ---
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/login/', CustomLoginView.as_view(), name='login'),
    
    # --- ENDPOINTS DE REINICIO DE CONTRASEÑA ---
    path('api/password_reset/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('api/password_reset/confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    
    path('api/puntos-verdes/', views.get_puntos_verdes, name='get_puntos_verdes'),
    path('api/consejos/', views.get_consejos, name='get_consejos'),
    path('api/calendario-ambiental/', views.get_calendario_ambiental, name='get_calendario_ambiental'),
]
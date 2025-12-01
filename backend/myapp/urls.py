from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views import ItemViewSet, RegisterView, CustomLoginView, PasswordResetRequestView, PasswordResetConfirmView, FavoriteToggleView, UserFavoritesView, ChatSessionView, ChatMessageCreateView, ChatSessionDetailView


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
    
    # --- ENDPOINTS DE PUNTOS VERDES FAVORITOS ---
    path('api/favorites/toggle/<str:punto_id>/', FavoriteToggleView.as_view(), name='favorite_toggle'),
    path('api/favorites/', UserFavoritesView.as_view(), name='user_favorites'),

    #---ENDPOINTS DE HISTORIAL DE CHAT---
    path('api/chat/sessions/', ChatSessionView.as_view(), name='chat_sessions'),
    path('api/chat/sessions/<int:id>/', ChatSessionDetailView.as_view(), name='chat_session_detail'),
    path('api/chat/sessions/<int:session_id>/messages/', ChatMessageCreateView.as_view(), name='chat_message_create'),
    
    # --- ENDPOINTS DE PUNTOS VERDES Y CALENDARIO ---
    path('api/puntos-verdes/', views.get_puntos_verdes, name='get_puntos_verdes'),
    path('api/calendario-ambiental/', views.get_calendario_ambiental, name='get_calendario_ambiental'),
]
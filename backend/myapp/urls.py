from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views import ItemViewSet, RegisterView, CustomLoginView, PasswordResetRequestView, PasswordResetConfirmView, FavoriteToggleView, UserFavoritesView, ChatSessionView, ChatMessageCreateView, ChatSessionDetailView, EventoUsuarioViewSet, PuntoVerdeViewSet, VotePuntoView


router = DefaultRouter()
router.register(r'items', ItemViewSet)
router.register(r'eventos-usuario', EventoUsuarioViewSet, basename='eventousuario')
router.register(r'puntos-verdes', PuntoVerdeViewSet, basename='puntosverdes')

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
    
    # --- ENDPOINTS DE CALENDARIO ---
    path('api/calendario-ambiental/', views.get_calendario_ambiental, name='get_calendario_ambiental'),

    # --- ENDPOINTS DE PUNTO VERDE ---
    # Ruta específica para la acción de votar
    path('api/puntos-verdes/<int:punto_id>/vote/', VotePuntoView.as_view(), name='vote_punto'),

    # Rutas del router (Puntos Verdes CRUD)
    path('', include(router.urls)),
]
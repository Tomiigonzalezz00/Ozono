from django.urls import path
from . import views
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ItemViewSet, RegisterView, LoginView

router = DefaultRouter()
router.register(r'items', ItemViewSet)

urlpatterns = [
    path('', views.home, name='home'),  # Ruta para la página de inicio
    path('api/', include(router.urls)),
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('api/puntos-verdes/', views.get_puntos_verdes, name='get_puntos_verdes'),
]
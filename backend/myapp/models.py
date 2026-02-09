from django.db import models
from django.contrib.auth.models import User
import uuid


class Item(models.Model):
    """
    Modelo que representa un ítem genérico en el sistema.
    """
    name = models.CharField(max_length=100)
    description = models.TextField()

    def __str__(self):
        return str(self.name)


class PuntoVerde(models.Model):
    """
    Modelo que representa un Punto Verde en el sistema.
    Almacena información sobre ubicaciones de reciclaje y sus características.
    """
    id = models.CharField(max_length=10, primary_key=True)
    nombre = models.CharField(max_length=100)
    materiales = models.TextField()
    mas_info = models.TextField(
        blank=True, null=True, default="Creado por la comunidad")
    direccion = models.CharField(max_length=200, blank=True, null=True)
    dia_hora = models.CharField(max_length=100, blank=True, null=True)
    tipo = models.CharField(max_length=50)
    cooperativa = models.CharField(max_length=255, blank=True)
    barrio = models.CharField(max_length=100, blank=True, null=True)
    calle = models.CharField(max_length=100, blank=True, null=True)
    altura = models.IntegerField(null=True, blank=True)
    comuna = models.CharField(
        max_length=50, blank=True, null=True)  # No obligatorio
    calle2 = models.CharField(max_length=100, blank=True)
    longitud = models.FloatField()
    latitud = models.FloatField()
    id = models.CharField(max_length=50, primary_key=True,
                          editable=False)  # Aumenté a 50 por si acaso

    def save(self, *args, **kwargs):
        if not self.id:
            self.id = str(uuid.uuid4())  # Genera ID único automáticamente
        super().save(*args, **kwargs)


# Control de Usuario
    is_user_generated = models.BooleanField(default=False)
    creator = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True)

    objects = models.Manager()

    def __str__(self):
        return str(self.nombre)


class PuntoVote(models.Model):
    VOTE_CHOICES = [('valid', 'Validar'), ('invalid', 'Invalidar')]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    punto = models.ForeignKey(
        PuntoVerde, on_delete=models.CASCADE, related_name='votes')
    vote_type = models.CharField(max_length=10, choices=VOTE_CHOICES)

    class Meta:
        # Un usuario solo vota una vez por punto
        unique_together = ('user', 'punto')


class CalendarioAmbiental(models.Model):
    """
    Modelo que representa un calendario ambiental en el sistema.
    """
    id = models.CharField(max_length=10, primary_key=True)
    evento = models.CharField(max_length=100)
    fecha = models.DateField()
    descripcion = models.TextField()
    objects = models.Manager()

    def __str__(self):
        return str(self.evento)

# --- Puntos verdes Favoritos ---


class Favorite(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='favorites')
    punto_verde = models.ForeignKey(PuntoVerde, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Un usuario no puede favoritear 2 veces el mismo punto
        unique_together = ('user', 'punto_verde')

    def __str__(self):
        return f"{self.user.username} -> {self.punto_verde.nombre}"

# ---Historial del chatbot---


class ChatSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=100, default="Nueva conversación")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Chat {self.id} - {self.user.username}"


class ChatMessage(models.Model):
    session = models.ForeignKey(
        ChatSession, related_name='messages', on_delete=models.CASCADE)
    sender = models.CharField(max_length=10)  # 'user' o 'bot'
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sender}: {self.text[:20]}..."


class EventoUsuario(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='eventos')
    fecha = models.DateField()
    titulo = models.CharField(max_length=100)
    descripcion = models.TextField()

    def __str__(self):
        return f"{self.titulo} ({self.user.username})"

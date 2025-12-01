from django.contrib import admin
from .models import PuntoVerde, CalendarioAmbiental, Favorite, ChatSession, ChatMessage
# Register your models here.
admin.site.register(PuntoVerde)
admin.site.register(CalendarioAmbiental)
admin.site.register(Favorite)
admin.site.register(ChatSession)
admin.site.register(ChatMessage)
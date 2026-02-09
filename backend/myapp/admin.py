from django.contrib import admin
from .models import PuntoVerde, CalendarioAmbiental, Favorite, ChatSession, ChatMessage, EventoUsuario
# Register your models here.


class PuntoVerdeAdmin(admin.ModelAdmin):
    # Mostramos ID, Nombre y Dirección en las columnas
    list_display = ('id', 'nombre', 'direccion', 'is_user_generated')
    # Hacemos que al hacer click en el NOMBRE o el ID, se abra la edición
    list_display_links = ('id', 'nombre')


# Registro de modelos
admin.site.register(PuntoVerde, PuntoVerdeAdmin)
admin.site.register(CalendarioAmbiental)
admin.site.register(Favorite)
admin.site.register(ChatSession)
admin.site.register(ChatMessage)
admin.site.register(EventoUsuario)

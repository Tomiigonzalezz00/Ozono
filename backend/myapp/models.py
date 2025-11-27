from django.db import models

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
    direccion = models.CharField(max_length=200)
    materiales = models.TextField()
    mas_info = models.TextField()
    dia_hora = models.CharField(max_length=100)
    tipo = models.CharField(max_length=50)
    cooperativa = models.CharField(max_length=255, blank=True)
    calle = models.CharField(max_length=100)
    altura = models.IntegerField(null=True, blank=True)
    calle2 = models.CharField(max_length=100, blank=True)
    barrio = models.CharField(max_length=50)
    comuna = models.CharField(max_length=20)
    longitud = models.FloatField()
    latitud = models.FloatField()
    objects = models.Manager()
    def __str__(self):
        return str(self.nombre)
    
class Consejo(models.Model):
    """
    Modelo que representa un consejo en el sistema.
    """
    CATEGORIA_CHOICES = [
        ('reciclaje', 'Reciclaje'),
        ('reutilizacion', 'Reutilización'),
        ('reduccion', 'Reducción de Consumo'),
    ]

    id = models.CharField(max_length=10, primary_key=True) 
    titulo = models.CharField(max_length=100)  
    categoria = models.CharField(max_length=20, choices=CATEGORIA_CHOICES, default='reciclaje')
    descripcion = models.TextField()
    objects = models.Manager()

    def __str__(self):
        return str(self.titulo)

    class Meta:
        verbose_name = "Consejo"
        verbose_name_plural = "Consejos"

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
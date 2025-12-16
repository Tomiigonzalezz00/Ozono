import csv
import os
import re
from django.core.management.base import BaseCommand
from django.db import transaction
from django.conf import settings
from myapp.models import PuntoVerde

class Command(BaseCommand):
    help = 'Importa puntos verdes de Vicente Lopez desde CSV'

    def add_arguments(self, parser):
        parser.add_argument('csv_file', type=str, help='Nombre del archivo CSV en backend/myapp/data/')

    def handle(self, *args, **options):
        csv_file_name = options['csv_file']
        csv_file_path = os.path.join(settings.BASE_DIR, 'myapp', 'data', csv_file_name)

        if not os.path.exists(csv_file_path):
            self.stdout.write(self.style.ERROR(f'No se encontró el archivo: {csv_file_path}'))
            return

        self.stdout.write(f'Leyendo archivo: {csv_file_path}')

        with open(csv_file_path, newline='', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            count = 0
            for row in reader:
                try:
                    with transaction.atomic():
                        # Parsear WKT: POINT (-58.5257893 -34.5388946)
                        # Nota: WKT suele ser (LONG LAT)
                        wkt = row.get('WKT', '')
                        lat = 0.0
                        lon = 0.0
                        if wkt.startswith('POINT'):
                            parts = wkt.replace('POINT (', '').replace(')', '').split()
                            if len(parts) >= 2:
                                lon = float(parts[0]) # Primero es Longitud dada la muestra
                                lat = float(parts[1]) # Segundo es Latitud

                        # Parsear dirección para separar calle y altura
                        # Formato ejemplo: "Cornelio Saavedra 1901, Florida Oeste, Buenos Aires"
                        direccion_completa = row.get('direccion', '')
                        calle = direccion_completa.split(',')[0].strip()
                        altura = None
                        
                        # Intento burdo de extraer altura si la calle termina en números
                        match = re.search(r'(\d+)$', calle)
                        if match:
                            altura = int(match.group(1))
                            calle = calle[:match.start()].strip()

                        # Mapeo de campos
                        PuntoVerde.objects.create(
                            id=row['id'],
                            nombre=row['nombre'],
                            direccion=direccion_completa,
                            latitud=lat,
                            longitud=lon,
                            materiales=row.get('materiales', '') or 'Varios', # Default si vacío
                            mas_info=row.get('mas_info', ''),
                            dia_hora=row.get('dias_horarios', ''),
                            tipo='Punto Verde', # Valor por defecto razonable
                            cooperativa='', 
                            calle=calle,
                            altura=altura,
                            calle2='',
                            barrio=row.get('comuna', ''), # Usamos 'comuna' del CSV como Barrio
                            comuna='Vicente Lopez' # Hardcoded como pediste, importamos a tu DB
                        )
                        count += 1
                        self.stdout.write(self.style.SUCCESS(f'Importado: {row["id"]} - {row["nombre"]}'))

                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'Error al importar fila {row.get("id", "?")}: {str(e)}'))

            self.stdout.write(self.style.SUCCESS(f'Proceso finalizado. Total importados: {count}'))

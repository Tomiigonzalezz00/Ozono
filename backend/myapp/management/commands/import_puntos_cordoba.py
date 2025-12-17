import csv
import os
from django.core.management.base import BaseCommand
from django.db import transaction
from django.conf import settings
from myapp.models import PuntoVerde

class Command(BaseCommand):
    help = 'Importa puntos verdes de Cordoba desde CSV'

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
                        # Parsear WKT: POINT (-64.214156 -31.339885)
                        wkt = row.get('WKT', '')
                        lat = 0.0
                        lon = 0.0
                        if wkt.startswith('POINT'):
                            parts = wkt.replace('POINT (', '').replace(')', '').split()
                            if len(parts) >= 2:
                                lon = float(parts[0]) 
                                lat = float(parts[1]) 

                        # Mapeo directo ya que el CSV tiene las columnas separadas
                        altura_val = row.get('altura', '')
                        altura = int(altura_val) if altura_val and altura_val.isdigit() else None

                        PuntoVerde.objects.create(
                            id=row['id'],
                            nombre=row['nombre'],
                            direccion=row['direccion'],
                            latitud=lat,
                            longitud=lon,
                            materiales=row.get('materiales', '') or 'Varios',
                            mas_info=row.get('mas_info', ''),
                            dia_hora=row.get('dia_hora', ''), # Nota: columna es dia_hora aquí
                            tipo=row.get('tipo', 'Punto Verde'),
                            cooperativa=row.get('cooperativ', ''),
                            calle=row.get('calle', ''),
                            altura=altura,
                            calle2=row.get('calle2', ''),
                            barrio=row.get('barrio', ''),
                            comuna=row.get('comuna', 'Cordoba') # Default a Cordoba si falta
                        )
                        count += 1
                        self.stdout.write(self.style.SUCCESS(f'Importado: {row["id"]} - {row["nombre"]}'))

                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'Error al importar fila {row.get("id", "?")}: {str(e)}'))

            self.stdout.write(self.style.SUCCESS(f'Proceso finalizado. Total importados: {count}'))

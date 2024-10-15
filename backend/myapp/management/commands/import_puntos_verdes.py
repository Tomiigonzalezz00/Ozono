import csv
import os
from django.core.management.base import BaseCommand
from django.db import transaction
from django.conf import settings
from myapp.models import PuntoVerde


class Command(BaseCommand):
    help = 'Importa puntos verdes desde un archivo CSV'

    def add_arguments(self, parser):
        parser.add_argument('csv_file', type=str, help='Ruta al archivo CSV')

    def handle(self, *args, **options):
        csv_file_name = options['csv_file']
        csv_file_path = os.path.join(settings.BASE_DIR, 'myapp', 'data', csv_file_name)

        with open(csv_file_path, newline='', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                try:
                    with transaction.atomic():
                        PuntoVerde.objects.create(
                            id=row['id'],
                            nombre=row['nombre'],
                            direccion=row['direccion'],
                            latitud=float(row['WKT'].split()[1][1:]),
                            longitud=float(row['WKT'].split()[2][:-1]),
                            materiales=row['materiales'],
                            mas_info=row['mas_info'],
                            dia_hora=row['dia_hora'],
                            tipo=row['tipo'],
                            cooperativa=row.get('cooperativ', ''),  # Cambiado aquí
                            calle=row['calle'],
                            altura=row['altura'] if row['altura'] else None,  # Maneja altura vacía
                            calle2=row['calle2'],
                            barrio=row['barrio'],
                            comuna=row['comuna']
                        )
                except Exception as e:
                    self.stdout.write(f'Error al procesar fila: {row}. Error: {str(e)}')
                else:
                    self.stdout.write(f'Importado punto verde: {row["id"]}')

        self.stdout.write('Datos importados con éxito')
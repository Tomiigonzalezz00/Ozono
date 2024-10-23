import csv
import os
from django.core.management.base import BaseCommand
from django.conf import settings
from myapp.models import ConsejosRRR

class Command(BaseCommand):
    help = 'Importa consejos RRR desde un archivo CSV'

    def add_arguments(self, parser):
        parser.add_argument('csv_file', type=str, help='Nombre del archivo CSV', default='Consejos-RRR.csv')

    def handle(self, *args, **options):
        csv_file_name = options['csv_file']
        csv_file_path = os.path.join(settings.BASE_DIR, 'myapp', 'data', csv_file_name)

        with open(csv_file_path, newline='', encoding='latin-1') as csvfile:
            reader = csv.DictReader(csvfile, delimiter=';')
            for row in reader:
                try:
                    consejo, created = ConsejosRRR.objects.update_or_create(
                        id=str(ConsejosRRR.objects.count() + 1).zfill(10),  # Genera un ID único
                        defaults={
                            'titulo': row['Título'],
                            'categoria': row['Categoría (Reciclaje/Reutilización/Reducción)'].lower(),
                            'descripcion': row['Descripción']
                        }
                    )
                    if created:
                        self.stdout.write(f'Importado nuevo consejo: {consejo.titulo}')
                    else:
                        self.stdout.write(f'Actualizado consejo existente: {consejo.titulo}')
                except Exception as e:
                    self.stdout.write(f'Error al procesar fila: {row}. Error: {str(e)}')

        self.stdout.write('Datos importados con éxito')

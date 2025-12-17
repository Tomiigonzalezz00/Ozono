import csv
import os
import time
import requests
from django.core.management.base import BaseCommand
from django.conf import settings

class Command(BaseCommand):
    help = 'Actualiza las coordenadas del CSV de Cordoba usando OpenStreetMap (Nominatim)'

    def handle(self, *args, **options):
        csv_file_path = os.path.join(settings.BASE_DIR, 'myapp', 'data', 'puntos_verdes_cordoba.csv')
        temp_file_path = csv_file_path + '.tmp'

        if not os.path.exists(csv_file_path):
            self.stdout.write(self.style.ERROR(f'Archivo no encontrado: {csv_file_path}'))
            return

        updated_rows = []
        headers = []

        self.stdout.write('Iniciando geocodificación...')

        with open(csv_file_path, newline='', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            headers = reader.fieldnames
            
            for row in reader:
                calle = row.get('calle', '')
                altura = row.get('altura', '')
                
                if calle and altura:
                    address_query = f"{calle} {altura}, Cordoba, Argentina"
                    self.stdout.write(f"Buscando: {address_query}...")
                    
                    try:
                        # Nominatim API
                        url = "https://nominatim.openstreetmap.org/search"
                        params = {
                            'q': address_query,
                            'format': 'json',
                            'limit': 1
                        }
                        # User-Agent es requerido por política de Nominatim
                        headers_http = {'User-Agent': 'OzonoApp/1.0'}
                        
                        response = requests.get(url, params=params, headers=headers_http)
                        data = response.json()

                        if data:
                            lat = data[0]['lat']
                            lon = data[0]['lon']
                            # Actualizar WKT
                            row['WKT'] = f"POINT ({lon} {lat})"
                            self.stdout.write(self.style.SUCCESS(f" -> Encontrado: {lat}, {lon}"))
                        else:
                            self.stdout.write(self.style.WARNING(" -> No encontrado en OSM."))

                    except Exception as e:
                        self.stdout.write(self.style.ERROR(f" -> Error: {e}"))
                    
                    # Respetar politica de uso (1 segundo delay)
                    time.sleep(1.1)
                
                updated_rows.append(row)

        # Guardar cambios
        with open(temp_file_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=headers)
            writer.writeheader()
            writer.writerows(updated_rows)

        # Reemplazar archivo original
        os.replace(temp_file_path, csv_file_path)
        self.stdout.write(self.style.SUCCESS('Archivo CSV actualizado correctamente.'))

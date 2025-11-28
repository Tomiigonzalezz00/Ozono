from django.core.management.base import BaseCommand
from myapp.models import CalendarioAmbiental
from datetime import date
import uuid

class Command(BaseCommand):
    help = 'Migrate events from 2024 to 2025'

    def handle(self, *args, **kwargs):
        events_2024 = CalendarioAmbiental.objects.filter(fecha__year=2024)
        count = 0
        
        for event in events_2024:
            # Calculate new date
            try:
                new_date = event.fecha.replace(year=2025)
            except ValueError:
                # Handle leap year cases if any (e.g. Feb 29)
                # 2024 is a leap year, 2025 is not. Feb 29 becomes Mar 1 or Feb 28.
                # Let's default to Feb 28 for simplicity or skip.
                if event.fecha.month == 2 and event.fecha.day == 29:
                    new_date = date(2025, 2, 28)
                else:
                    continue

            # Check if event already exists to avoid duplicates if run multiple times
            if not CalendarioAmbiental.objects.filter(fecha=new_date, evento=event.evento).exists():
                # Create new ID (assuming ID is string based on models.py)
                # The model uses CharField for ID. Let's generate a short UUID or similar.
                # Existing IDs might be manual. Let's use a simple strategy.
                new_id = str(uuid.uuid4())[:10]
                
                CalendarioAmbiental.objects.create(
                    id=new_id,
                    evento=event.evento,
                    fecha=new_date,
                    descripcion=event.descripcion
                )
                count += 1
                self.stdout.write(self.style.SUCCESS(f'Migrated: {event.evento} to {new_date}'))
            else:
                self.stdout.write(self.style.WARNING(f'Skipped (already exists): {event.evento}'))

        self.stdout.write(self.style.SUCCESS(f'Successfully migrated {count} events.'))

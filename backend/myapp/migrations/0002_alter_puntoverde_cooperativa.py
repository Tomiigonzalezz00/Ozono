# Generated by Django 5.1 on 2024-10-15 20:31

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('myapp', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='puntoverde',
            name='cooperativa',
            field=models.CharField(blank=True, max_length=255),
        ),
    ]

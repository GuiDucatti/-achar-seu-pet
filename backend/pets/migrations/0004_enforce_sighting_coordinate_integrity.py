from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('pets', '0003_enforce_pet_coordinate_integrity'),
    ]

    operations = [
        migrations.AddConstraint(
            model_name='avistamento',
            constraint=models.CheckConstraint(
                condition=models.Q(latitude__gte=-90, latitude__lte=90),
                name='sighting_valid_latitude',
            ),
        ),
        migrations.AddConstraint(
            model_name='avistamento',
            constraint=models.CheckConstraint(
                condition=models.Q(longitude__gte=-180, longitude__lte=180),
                name='sighting_valid_longitude',
            ),
        ),
    ]

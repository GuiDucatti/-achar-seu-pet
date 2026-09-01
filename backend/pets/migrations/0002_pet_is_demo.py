from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('pets', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='pet',
            name='is_demo',
            field=models.BooleanField(default=False),
        ),
    ]

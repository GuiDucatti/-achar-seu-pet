from django.conf import settings
from django.db import models


class Pet(models.Model):
    ESPECIE_CACHORRO = 'cachorro'
    ESPECIE_GATO = 'gato'

    ESPECIE_CHOICES = [
        (ESPECIE_CACHORRO, 'Cachorro'),
        (ESPECIE_GATO, 'Gato'),
    ]

    SEXO_MACHO = 'macho'
    SEXO_FEMEA = 'femea'

    SEXO_CHOICES = [
        (SEXO_MACHO, 'Macho'),
        (SEXO_FEMEA, 'Femea'),
    ]

    STATUS_PERDIDO = 'P'
    STATUS_ENCONTRADO = 'E'

    STATUS_CHOICES = [
        (STATUS_PERDIDO, 'Perdido'),
        (STATUS_ENCONTRADO, 'Encontrado'),
    ]

    autor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='pets',
    )
    nome = models.CharField(max_length=100)
    foto = models.ImageField(upload_to='pets/')
    especie = models.CharField(max_length=20, choices=ESPECIE_CHOICES)
    raca = models.CharField(max_length=100)
    cor = models.CharField(max_length=100)
    sexo = models.CharField(max_length=10, choices=SEXO_CHOICES)
    caracteristicas = models.TextField()
    estado = models.CharField(max_length=2)
    cidade = models.CharField(max_length=100)
    endereco_texto = models.CharField(max_length=255)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    raio_area_metros = models.PositiveIntegerField(default=400)
    data_desaparecimento = models.DateField()
    descricao = models.TextField()
    contato = models.CharField(max_length=20)
    status = models.CharField(
        max_length=1,
        choices=STATUS_CHOICES,
        default=STATUS_PERDIDO,
    )
    is_demo = models.BooleanField(default=False)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-criado_em']

    def __str__(self):
        return f'{self.nome} - {self.cidade}/{self.estado}'


class Avistamento(models.Model):
    pet = models.ForeignKey(
        Pet,
        on_delete=models.CASCADE,
        related_name='avistamentos',
    )
    latitude = models.FloatField()
    longitude = models.FloatField()
    descricao = models.TextField(blank=True)
    contato_quem_viu = models.CharField(max_length=100, blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-criado_em']

    def __str__(self):
        return f'Avistamento de {self.pet.nome} em {self.criado_em:%d/%m/%Y %H:%M}'

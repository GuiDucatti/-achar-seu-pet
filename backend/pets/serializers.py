from pathlib import Path

from django.conf import settings
from rest_framework import serializers

from .models import Avistamento, Pet
from .proximity import proximity_result


class AvistamentoSerializer(serializers.ModelSerializer):
    pet = serializers.PrimaryKeyRelatedField(read_only=True)
    distancia_km = serializers.SerializerMethodField()
    proximo = serializers.SerializerMethodField()

    class Meta:
        model = Avistamento
        fields = [
            'id',
            'pet',
            'latitude',
            'longitude',
            'descricao',
            'contato_quem_viu',
            'criado_em',
            'distancia_km',
            'proximo',
        ]
        read_only_fields = ['id', 'pet', 'criado_em', 'distancia_km', 'proximo']

    def _proximity(self, obj):
        return proximity_result(
            obj.pet.latitude,
            obj.pet.longitude,
            obj.latitude,
            obj.longitude,
            threshold_km=settings.PROXIMITY_THRESHOLD_KM,
        )

    def get_distancia_km(self, obj):
        return self._proximity(obj)['distancia_km']

    def get_proximo(self, obj):
        return self._proximity(obj)['proximo']

    def validate_latitude(self, value):
        if not -90 <= value <= 90:
            raise serializers.ValidationError('A latitude deve estar entre -90 e 90.')
        return value

    def validate_longitude(self, value):
        if not -180 <= value <= 180:
            raise serializers.ValidationError('A longitude deve estar entre -180 e 180.')
        return value


class PetSerializer(serializers.ModelSerializer):
    autor = serializers.PrimaryKeyRelatedField(read_only=True)
    autor_username = serializers.CharField(source='autor.username', read_only=True)
    avistamentos = AvistamentoSerializer(many=True, read_only=True)

    class Meta:
        model = Pet
        fields = [
            'id',
            'autor',
            'autor_username',
            'nome',
            'foto',
            'especie',
            'raca',
            'cor',
            'sexo',
            'caracteristicas',
            'estado',
            'cidade',
            'endereco_texto',
            'latitude',
            'longitude',
            'raio_area_metros',
            'data_desaparecimento',
            'descricao',
            'contato',
            'status',
            'avistamentos',
            'criado_em',
            'atualizado_em',
        ]
        read_only_fields = [
            'id',
            'autor',
            'autor_username',
            'avistamentos',
            'criado_em',
            'atualizado_em',
        ]

    def validate_estado(self, value):
        return value.upper()

    def validate_foto(self, value):
        if value.size > settings.MAX_IMAGE_UPLOAD_SIZE:
            limite = settings.MAX_IMAGE_UPLOAD_SIZE_MB
            raise serializers.ValidationError(
                f'A foto deve ter no maximo {limite} MB.'
            )

        allowed_extensions = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.webp': 'image/webp',
            '.gif': 'image/gif',
        }
        extension = Path(value.name or '').suffix.lower()
        if (
            extension not in allowed_extensions
            or allowed_extensions[extension] not in settings.ALLOWED_IMAGE_CONTENT_TYPES
        ):
            formatos = ', '.join(settings.ALLOWED_IMAGE_CONTENT_TYPES)
            raise serializers.ValidationError(
                f'Formato de imagem nao permitido. Use: {formatos}.'
            )

        return value

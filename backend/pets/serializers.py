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
    distancia_km = serializers.SerializerMethodField()

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
            'is_demo',
            'distancia_km',
            'avistamentos',
            'criado_em',
            'atualizado_em',
        ]
        read_only_fields = [
            'id',
            'autor',
            'autor_username',
            'is_demo',
            'distancia_km',
            'avistamentos',
            'criado_em',
            'atualizado_em',
        ]

    def get_distancia_km(self, obj):
        distance = getattr(obj, 'distancia_km', None)
        return round(distance, 2) if distance is not None else None

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


class NearbyPetSearchSerializer(serializers.Serializer):
    latitude = serializers.FloatField(min_value=-90, max_value=90, required=False)
    longitude = serializers.FloatField(min_value=-180, max_value=180, required=False)
    cidade_origem = serializers.CharField(max_length=100, required=False, allow_blank=True)
    estado_origem = serializers.CharField(max_length=2, required=False, allow_blank=True)
    raio_km = serializers.ChoiceField(choices=(10, 25, 50, 100), default=50)
    status = serializers.ChoiceField(choices=Pet.STATUS_CHOICES, required=False)
    especie = serializers.ChoiceField(choices=Pet.ESPECIE_CHOICES, required=False)
    sexo = serializers.ChoiceField(choices=Pet.SEXO_CHOICES, required=False)
    data_desaparecimento = serializers.DateField(required=False)
    busca = serializers.CharField(max_length=255, required=False, allow_blank=True)

    def validate(self, attrs):
        has_latitude = 'latitude' in attrs
        has_longitude = 'longitude' in attrs

        if has_latitude != has_longitude:
            raise serializers.ValidationError(
                'Latitude e longitude devem ser informadas juntas.'
            )

        if has_latitude and has_longitude:
            return attrs

        city = attrs.get('cidade_origem', '').strip()
        state = attrs.get('estado_origem', '').strip()
        if not city or len(state) != 2:
            raise serializers.ValidationError(
                'Informe latitude e longitude ou uma cidade com UF.'
            )

        attrs['cidade_origem'] = city
        attrs['estado_origem'] = state.upper()
        return attrs

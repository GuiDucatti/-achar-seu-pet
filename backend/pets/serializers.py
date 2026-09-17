from pathlib import Path
from math import isfinite

from django.conf import settings
from rest_framework import serializers

from .images import sanitize_uploaded_image
from .models import Avistamento, Pet
from .proximity import build_public_location, proximity_result


class PublicSightingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Avistamento
        fields = ['id', 'criado_em']
        read_only_fields = fields


class OwnerSightingSerializer(serializers.ModelSerializer):
    distancia_km = serializers.SerializerMethodField()
    proximo = serializers.SerializerMethodField()

    class Meta:
        model = Avistamento
        fields = [
            'id',
            'latitude',
            'longitude',
            'descricao',
            'contato_quem_viu',
            'criado_em',
            'distancia_km',
            'proximo',
        ]
        read_only_fields = fields

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


class SightingWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Avistamento
        fields = ['latitude', 'longitude', 'descricao', 'contato_quem_viu']

    def validate_latitude(self, value):
        if not -90 <= value <= 90:
            raise serializers.ValidationError('A latitude deve estar entre -90 e 90.')
        return value

    def validate_longitude(self, value):
        if not -180 <= value <= 180:
            raise serializers.ValidationError('A longitude deve estar entre -180 e 180.')
        return value


class PublicPetListSerializer(serializers.ModelSerializer):
    distancia_aproximada_km = serializers.SerializerMethodField()

    class Meta:
        model = Pet
        fields = [
            'id',
            'nome',
            'foto',
            'estado',
            'cidade',
            'data_desaparecimento',
            'status',
            'is_demo',
            'distancia_aproximada_km',
        ]
        read_only_fields = fields

    def get_distancia_aproximada_km(self, obj):
        distance = getattr(obj, 'distancia_aproximada_km', None)
        return round(distance, 1) if distance is not None else None


class PublicPetDetailSerializer(serializers.ModelSerializer):
    avistamentos = PublicSightingSerializer(many=True, read_only=True)
    is_owner = serializers.SerializerMethodField()
    localizacao_publica = serializers.SerializerMethodField()

    class Meta:
        model = Pet
        fields = [
            'id',
            'nome',
            'foto',
            'especie',
            'raca',
            'cor',
            'sexo',
            'caracteristicas',
            'estado',
            'cidade',
            'localizacao_publica',
            'data_desaparecimento',
            'descricao',
            'contato',
            'status',
            'is_demo',
            'is_owner',
            'avistamentos',
            'criado_em',
            'atualizado_em',
        ]
        read_only_fields = fields

    def get_is_owner(self, obj):
        request = self.context.get('request')
        return bool(
            request
            and request.user.is_authenticated
            and request.user.pk == obj.autor_id
        )

    def get_localizacao_publica(self, obj):
        return build_public_location(
            obj.latitude,
            obj.longitude,
            obj.raio_area_metros,
        )


class OwnerPetDetailSerializer(PublicPetDetailSerializer):
    avistamentos = OwnerSightingSerializer(many=True, read_only=True)

    class Meta(PublicPetDetailSerializer.Meta):
        fields = PublicPetDetailSerializer.Meta.fields + [
            'endereco_texto',
            'latitude',
            'longitude',
            'raio_area_metros',
        ]
        read_only_fields = fields


class PetWriteSerializer(serializers.ModelSerializer):
    latitude = serializers.FloatField(
        allow_null=True,
        max_value=90,
        min_value=-90,
        required=False,
    )
    longitude = serializers.FloatField(
        allow_null=True,
        max_value=180,
        min_value=-180,
        required=False,
    )

    class Meta:
        model = Pet
        fields = [
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
        ]

    def validate_estado(self, value):
        return value.upper()

    def validate(self, attrs):
        has_latitude = 'latitude' in attrs
        has_longitude = 'longitude' in attrs

        if has_latitude != has_longitude:
            missing_field = 'longitude' if has_latitude else 'latitude'
            raise serializers.ValidationError(
                {missing_field: 'Latitude e longitude devem ser informadas juntas.'}
            )

        if has_latitude and ((attrs['latitude'] is None) != (attrs['longitude'] is None)):
            raise serializers.ValidationError(
                {'coordinates': 'Latitude e longitude devem ser ambas válidas ou ambas nulas.'}
            )

        if (
            has_latitude
            and attrs['latitude'] is not None
            and not all(isfinite(value) for value in (attrs['latitude'], attrs['longitude']))
        ):
            raise serializers.ValidationError(
                {'coordinates': 'Latitude e longitude devem ser valores finitos.'}
            )

        return attrs

    def update(self, instance, validated_data):
        location_changed = any(
            field in validated_data and validated_data[field] != getattr(instance, field)
            for field in ('endereco_texto', 'cidade', 'estado')
        )
        coordinates_received = (
            'latitude' in validated_data and 'longitude' in validated_data
        )

        if location_changed and not coordinates_received:
            validated_data['latitude'] = None
            validated_data['longitude'] = None

        return super().update(instance, validated_data)

    def validate_foto(self, value):
        if value.size > settings.MAX_IMAGE_UPLOAD_SIZE:
            limite = settings.MAX_IMAGE_UPLOAD_SIZE_MB
            raise serializers.ValidationError(
                f'A foto deve ter no máximo {limite} MB.'
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
                f'Formato de imagem não permitido. Use: {formatos}.'
            )

        try:
            return sanitize_uploaded_image(
                value,
                settings.ALLOWED_IMAGE_CONTENT_TYPES,
                allowed_extensions[extension],
            )
        except (KeyError, OSError, ValueError):
            raise serializers.ValidationError('O arquivo enviado não é uma imagem válida.')


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

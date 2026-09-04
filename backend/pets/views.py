from hashlib import sha256

from django.core.cache import cache
from django.db.models import Q
from django.utils.text import slugify
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .geocoding import geocode_address, search_addresses
from .models import Pet
from .permissions import PetPermission
from .proximity import build_public_location, bounding_box, haversine_distance_km
from .serializers import (
    NearbyPetSearchSerializer,
    OwnerPetDetailSerializer,
    OwnerSightingSerializer,
    PetWriteSerializer,
    PublicPetDetailSerializer,
    PublicPetListSerializer,
    PublicSightingSerializer,
    SightingWriteSerializer,
)


class PetViewSet(viewsets.ModelViewSet):
    serializer_class = PublicPetListSerializer
    permission_classes = [PetPermission]

    def get_queryset(self):
        queryset = Pet.objects.select_related('autor').prefetch_related('avistamentos')
        return self._apply_filters(queryset, self.request.query_params)

    def _is_owner(self, pet):
        return bool(
            self.request.user.is_authenticated
            and self.request.user.pk == pet.autor_id
        )

    def create(self, request, *args, **kwargs):
        serializer = PetWriteSerializer(
            data=request.data,
            context=self.get_serializer_context(),
        )
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        response_serializer = OwnerPetDetailSerializer(
            serializer.instance,
            context=self.get_serializer_context(),
        )
        headers = self.get_success_headers(response_serializer.data)
        return Response(
            response_serializer.data,
            status=status.HTTP_201_CREATED,
            headers=headers,
        )

    def retrieve(self, request, *args, **kwargs):
        pet = self.get_object()
        serializer_class = (
            OwnerPetDetailSerializer if self._is_owner(pet) else PublicPetDetailSerializer
        )
        serializer = serializer_class(pet, context=self.get_serializer_context())
        return Response(serializer.data)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        pet = self.get_object()
        serializer = PetWriteSerializer(
            pet,
            data=request.data,
            partial=partial,
            context=self.get_serializer_context(),
        )
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        if getattr(pet, '_prefetched_objects_cache', None):
            pet._prefetched_objects_cache = {}

        response_serializer = OwnerPetDetailSerializer(
            serializer.instance,
            context=self.get_serializer_context(),
        )
        return Response(response_serializer.data)

    @action(detail=False, methods=['get'], url_path='sugestoes-endereco')
    def sugestoes_endereco(self, request):
        query = request.query_params.get('q', '').strip()
        if len(query) < 3:
            return Response([])

        query_hash = sha256(query.casefold().encode('utf-8')).hexdigest()[:24]
        cache_key = f'address-suggestions:{query_hash}'
        suggestions = cache.get(cache_key)
        if suggestions is None:
            suggestions = search_addresses(query)
            cache.set(cache_key, suggestions, timeout=86400)

        return Response(suggestions)

    @staticmethod
    def _apply_filters(queryset, source):
        estado = source.get('estado')
        cidade = source.get('cidade')
        status_pet = source.get('status')
        especie = source.get('especie')
        sexo = source.get('sexo')
        data_desaparecimento = source.get('data_desaparecimento')
        busca = source.get('busca')

        if estado:
            queryset = queryset.filter(estado__iexact=estado)

        if cidade:
            queryset = queryset.filter(cidade__icontains=cidade)

        if status_pet:
            queryset = queryset.filter(status=status_pet)

        if especie:
            queryset = queryset.filter(especie=especie)

        if sexo:
            queryset = queryset.filter(sexo=sexo)

        if data_desaparecimento:
            queryset = queryset.filter(data_desaparecimento=data_desaparecimento)

        if busca:
            queryset = queryset.filter(
                Q(nome__icontains=busca)
                | Q(raca__icontains=busca)
                | Q(caracteristicas__icontains=busca)
            )

        return queryset

    @action(detail=False, methods=['post'], url_path='proximos')
    def proximos(self, request):
        search = NearbyPetSearchSerializer(data=request.data)
        search.is_valid(raise_exception=True)
        data = search.validated_data

        if 'latitude' in data:
            latitude = round(data['latitude'], 3)
            longitude = round(data['longitude'], 3)
            origin_type = 'localizacao'
            origin_label = 'Sua localizacao'
        else:
            city = data['cidade_origem']
            state_code = data['estado_origem']
            cache_key = f"pet-region:{slugify(city)}:{state_code.casefold()}"
            coordinates = cache.get(cache_key)
            if coordinates is None:
                coordinates = geocode_address('', city, state_code)
                if coordinates:
                    cache.set(cache_key, coordinates, timeout=86400)

            if not coordinates:
                return Response(
                    {
                        'codigo': 'regiao_nao_encontrada',
                        'detail': 'Nao foi possivel localizar a cidade informada.',
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            latitude = coordinates['latitude']
            longitude = coordinates['longitude']
            origin_type = 'cidade'
            origin_label = f'{city}, {state_code}'

        radius = int(data['raio_km'])
        bounds = bounding_box(latitude, longitude, radius)
        queryset = Pet.objects.select_related('autor').prefetch_related('avistamentos')
        queryset = self._apply_filters(queryset, data).filter(
            latitude__isnull=False,
            longitude__isnull=False,
            latitude__range=(bounds['latitude_min'], bounds['latitude_max']),
            longitude__range=(bounds['longitude_min'], bounds['longitude_max']),
        )

        nearby_pets = []
        for pet in queryset:
            pet.distancia_km = haversine_distance_km(
                latitude,
                longitude,
                pet.latitude,
                pet.longitude,
            )
            if pet.distancia_km <= radius:
                public_location = build_public_location(
                    pet.latitude,
                    pet.longitude,
                    pet.raio_area_metros,
                )
                pet.distancia_aproximada_km = haversine_distance_km(
                    latitude,
                    longitude,
                    public_location['latitude'],
                    public_location['longitude'],
                )
                nearby_pets.append(pet)

        nearby_pets.sort(
            key=lambda pet: (pet.distancia_km, -pet.criado_em.timestamp())
        )
        results = PublicPetListSerializer(
            nearby_pets,
            many=True,
            context={'request': request},
        ).data

        return Response(
            {
                'origem': {
                    'tipo': origin_type,
                    'rotulo': origin_label,
                    'raio_km': radius,
                },
                'resultados': results,
            }
        )

    def perform_create(self, serializer):
        coordinates_received = (
            'latitude' in serializer.validated_data
            and 'longitude' in serializer.validated_data
        )
        pet = serializer.save(autor=self.request.user)
        if not coordinates_received and (pet.latitude is None or pet.longitude is None):
            self._geocode_pet(pet)

    def perform_update(self, serializer):
        current_pet = serializer.instance
        location_changed = any(
            field in serializer.validated_data
            and serializer.validated_data[field] != getattr(current_pet, field)
            for field in ('endereco_texto', 'cidade', 'estado', 'latitude', 'longitude')
        )
        pet = serializer.save()
        coordinates_received = (
            'latitude' in serializer.validated_data
            and 'longitude' in serializer.validated_data
        )
        if location_changed and not coordinates_received:
            self._geocode_pet(pet)

    @staticmethod
    def _geocode_pet(pet):
        coordinates = geocode_address(
            pet.endereco_texto,
            pet.cidade,
            pet.estado,
        )
        if coordinates:
            Pet.objects.filter(pk=pet.pk).update(**coordinates)
            pet.latitude = coordinates['latitude']
            pet.longitude = coordinates['longitude']

    @action(detail=True, methods=['get', 'post'], url_path='avistamentos')
    def avistamentos(self, request, pk=None):
        pet = self.get_object()

        if request.method == 'GET':
            serializer_class = (
                OwnerSightingSerializer if self._is_owner(pet) else PublicSightingSerializer
            )
            serializer = serializer_class(
                pet.avistamentos.all(),
                many=True,
                context=self.get_serializer_context(),
            )
            return Response(serializer.data)

        write_serializer = SightingWriteSerializer(
            data=request.data,
            context=self.get_serializer_context(),
        )
        write_serializer.is_valid(raise_exception=True)
        sighting = write_serializer.save(pet=pet)
        response_serializer_class = (
            OwnerSightingSerializer if self._is_owner(pet) else PublicSightingSerializer
        )
        response_serializer = response_serializer_class(
            sighting,
            context=self.get_serializer_context(),
        )
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

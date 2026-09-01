from django.core.cache import cache
from django.db.models import Q
from django.utils.text import slugify
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .geocoding import geocode_address
from .models import Pet
from .permissions import PetPermission
from .proximity import bounding_box, haversine_distance_km
from .serializers import (
    AvistamentoSerializer,
    NearbyPetSearchSerializer,
    PetSerializer,
)


class PetViewSet(viewsets.ModelViewSet):
    serializer_class = PetSerializer
    permission_classes = [PetPermission]

    def get_queryset(self):
        queryset = Pet.objects.select_related('autor').prefetch_related('avistamentos')
        return self._apply_filters(queryset, self.request.query_params)

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
                nearby_pets.append(pet)

        nearby_pets.sort(
            key=lambda pet: (pet.distancia_km, -pet.criado_em.timestamp())
        )
        results = PetSerializer(
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
        pet = serializer.save(autor=self.request.user)
        self._geocode_pet(pet)

    def perform_update(self, serializer):
        current_pet = self.get_object()
        location_changed = any(
            field in serializer.validated_data
            and serializer.validated_data[field] != getattr(current_pet, field)
            for field in ('endereco_texto', 'cidade', 'estado')
        )
        pet = serializer.save()
        if location_changed:
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
            serializer = AvistamentoSerializer(pet.avistamentos.all(), many=True)
            return Response(serializer.data)

        serializer = AvistamentoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(pet=pet)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

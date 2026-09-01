from django.db.models import Q
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .geocoding import geocode_address
from .models import Pet
from .permissions import PetPermission
from .serializers import AvistamentoSerializer, PetSerializer


class PetViewSet(viewsets.ModelViewSet):
    serializer_class = PetSerializer
    permission_classes = [PetPermission]

    def get_queryset(self):
        queryset = Pet.objects.select_related('autor').prefetch_related('avistamentos')

        estado = self.request.query_params.get('estado')
        cidade = self.request.query_params.get('cidade')
        status_pet = self.request.query_params.get('status')
        especie = self.request.query_params.get('especie')
        sexo = self.request.query_params.get('sexo')
        data_desaparecimento = self.request.query_params.get('data_desaparecimento')
        busca = self.request.query_params.get('busca')

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

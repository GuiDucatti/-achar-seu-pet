from math import isclose
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.test import APIClient

from .models import Pet
from .proximity import haversine_distance_km


class PetUploadTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(
            username='upload-test',
            email='upload-test@example.com',
            password='senha-forte-123',
        )
        self.client.force_authenticate(self.user)

    def tearDown(self):
        for pet in Pet.objects.all():
            if pet.foto:
                pet.foto.delete(save=False)

    @staticmethod
    def image_file(filename='pet.gif', content_type='image/gif'):
        content = (
            b'GIF89a\x01\x00\x01\x00\x80\x00\x00\x00\x00\x00'
            b'\xff\xff\xff!\xf9\x04\x01\x00\x00\x00\x00'
            b',\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;'
        )
        return SimpleUploadedFile(filename, content, content_type=content_type)

    def pet_payload(self, foto=None):
        return {
            'nome': 'Rex',
            'foto': foto or self.image_file(),
            'especie': 'cachorro',
            'raca': 'Vira-lata',
            'cor': 'Caramelo',
            'sexo': 'macho',
            'caracteristicas': 'Coleira azul',
            'estado': 'SP',
            'cidade': 'Sao Paulo',
            'endereco_texto': 'Regiao central',
            'data_desaparecimento': '2026-08-01',
            'descricao': 'Teste de upload',
            'contato': '11999999999',
            'status': 'P',
        }

    @patch(
        'pets.views.geocode_address',
        return_value={'latitude': -23.5505, 'longitude': -46.6333},
    )
    def test_uploads_valid_image_and_saves_coordinates(self, geocode_mock):
        response = self.client.post('/api/pets/', self.pet_payload(), format='multipart')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        pet = Pet.objects.get(nome='Rex')
        self.assertTrue(pet.foto.name.startswith('pets/'))
        self.assertTrue(pet.foto.storage.exists(pet.foto.name))
        self.assertEqual(pet.latitude, -23.5505)
        self.assertEqual(pet.longitude, -46.6333)
        geocode_mock.assert_called_once_with('Regiao central', 'Sao Paulo', 'SP')

    @patch('pets.views.geocode_address', return_value=None)
    def test_does_not_geocode_when_location_is_unchanged(self, geocode_mock):
        response = self.client.post('/api/pets/', self.pet_payload(), format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        geocode_mock.reset_mock()

        response = self.client.patch(
            f"/api/pets/{response.data['id']}/",
            {'status': 'E'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        geocode_mock.assert_not_called()

    @override_settings(MAX_IMAGE_UPLOAD_SIZE=10, MAX_IMAGE_UPLOAD_SIZE_MB=1)
    def test_rejects_image_above_configured_limit(self):
        response = self.client.post('/api/pets/', self.pet_payload(), format='multipart')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('maximo', str(response.data['foto']).lower())

    def test_rejects_disallowed_image_extension(self):
        response = self.client.post(
            '/api/pets/',
            self.pet_payload(
                foto=self.image_file('pet.svg', content_type='image/svg+xml')
            ),
            format='multipart',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('svg', str(response.data['foto']).lower())


class PetSightingTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(
            username='sighting-test',
            email='sighting-test@example.com',
            password='senha-forte-123',
        )
        self.pet = Pet.objects.create(
            autor=self.user,
            nome='Luna',
            foto='pets/luna.gif',
            especie='gato',
            raca='Vira-lata',
            cor='Branca',
            sexo='femea',
            caracteristicas='Mancha na pata',
            estado='SP',
            cidade='Campinas',
            endereco_texto='Cambuí',
            latitude=-22.9056,
            longitude=-47.0608,
            data_desaparecimento='2026-08-01',
            descricao='Gata desaparecida',
            contato='19999999999',
        )

    def test_creates_sighting_for_pet_from_url(self):
        response = self.client.post(
            f'/api/pets/{self.pet.id}/avistamentos/',
            {
                'latitude': -22.9056,
                'longitude': -47.0608,
                'descricao': 'Visto perto da praça',
                'contato_quem_viu': '19988888888',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['pet'], self.pet.id)
        self.assertEqual(self.pet.avistamentos.count(), 1)
        self.assertTrue(response.data['proximo'])
        self.assertTrue(isclose(response.data['distancia_km'], 0, abs_tol=0.01))

    def test_marks_distant_sighting_as_not_nearby(self):
        response = self.client.post(
            f'/api/pets/{self.pet.id}/avistamentos/',
            {'latitude': -23.5505, 'longitude': -46.6333},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertFalse(response.data['proximo'])
        self.assertGreater(response.data['distancia_km'], 3)

    def test_rejects_coordinates_outside_valid_range(self):
        response = self.client.post(
            f'/api/pets/{self.pet.id}/avistamentos/',
            {'latitude': 95, 'longitude': -47},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('latitude', response.data)


class ProximityTests(TestCase):
    def test_haversine_returns_expected_distance(self):
        distance = haversine_distance_km(-23.5505, -46.6333, -22.9068, -47.0616)

        self.assertTrue(isclose(distance, 83.9, abs_tol=1))


class PetFilterTests(TestCase):
    def setUp(self):
        user = get_user_model().objects.create_user(
            username='filter-test',
            email='filter-test@example.com',
            password='senha-forte-123',
        )
        Pet.objects.create(
            autor=user,
            nome='Lobinha',
            foto='pets/lobinha.gif',
            especie='cachorro',
            raca='Vira-lata',
            cor='Caramelo e branca',
            sexo='femea',
            caracteristicas='Olhos azuis',
            estado='SP',
            cidade='Campinas',
            endereco_texto='Centro',
            data_desaparecimento='2026-08-01',
            descricao='Pet para filtrar',
            contato='19999999999',
        )
        Pet.objects.create(
            autor=user,
            nome='Toby',
            foto='pets/toby.gif',
            especie='gato',
            raca='Siames',
            cor='Branco',
            sexo='macho',
            caracteristicas='Coleira vermelha',
            estado='RJ',
            cidade='Niteroi',
            endereco_texto='Icarai',
            data_desaparecimento='2026-08-02',
            descricao='Outro pet para filtrar',
            contato='21999999999',
        )

    def test_filters_by_species_sex_and_text(self):
        response = APIClient().get(
            '/api/pets/?especie=cachorro&sexo=femea&busca=azuis'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['nome'], 'Lobinha')

    def test_filters_by_exact_disappearance_date(self):
        response = APIClient().get('/api/pets/?data_desaparecimento=2026-08-02')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['nome'], 'Toby')


class PetPermissionTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.owner = get_user_model().objects.create_user(
            username='pet-owner',
            email='pet-owner@example.com',
            password='senha-forte-123',
        )
        self.other_user = get_user_model().objects.create_user(
            username='other-user',
            email='other-user@example.com',
            password='senha-forte-123',
        )
        self.pet = Pet.objects.create(
            autor=self.owner,
            nome='Lobinha',
            foto='pets/lobinha.gif',
            especie='cachorro',
            raca='Vira-lata',
            cor='Caramelo e branca',
            sexo='femea',
            caracteristicas='Olhos azuis',
            estado='SP',
            cidade='Campinas',
            endereco_texto='Centro',
            data_desaparecimento='2026-08-01',
            descricao='Pet para validar permissoes',
            contato='19999999999',
        )

    def test_owner_can_edit_their_pet(self):
        self.client.force_authenticate(self.owner)

        response = self.client.patch(
            f'/api/pets/{self.pet.id}/',
            {'nome': 'Lobinha atualizada'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.pet.refresh_from_db()
        self.assertEqual(self.pet.nome, 'Lobinha atualizada')

    def test_user_cannot_edit_another_users_pet(self):
        self.client.force_authenticate(self.other_user)

        response = self.client.patch(
            f'/api/pets/{self.pet.id}/',
            {'nome': 'Alteracao indevida'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.pet.refresh_from_db()
        self.assertEqual(self.pet.nome, 'Lobinha')

    def test_anonymous_user_cannot_create_pet(self):
        response = self.client.post('/api/pets/', {}, format='json')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

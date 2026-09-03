from math import isclose
from tempfile import TemporaryDirectory
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.test import APIClient

from .models import Pet
from .geocoding import search_addresses
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

    @patch('pets.views.geocode_address')
    def test_keeps_coordinates_selected_from_address_suggestion(self, geocode_mock):
        payload = self.pet_payload()
        payload.update({'latitude': -21.2886, 'longitude': -50.3404})

        response = self.client.post('/api/pets/', payload, format='multipart')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        pet = Pet.objects.get(pk=response.data['id'])
        self.assertEqual(pet.latitude, -21.2886)
        self.assertEqual(pet.longitude, -50.3404)
        geocode_mock.assert_not_called()


class AddressSuggestionTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()

    @patch(
        'pets.views.search_addresses',
        return_value=[
            {
                'rotulo': 'Rua das Flores - Birigui, SP',
                'endereco': 'Rua das Flores',
                'cidade': 'Birigui',
                'estado': 'SP',
                'latitude': -21.2886,
                'longitude': -50.3404,
            }
        ],
    )
    def test_anonymous_user_can_search_address_suggestions(self, search_mock):
        response = self.client.get(
            '/api/pets/sugestoes-endereco/',
            {'q': 'Rua das Flores Birigui'},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]['cidade'], 'Birigui')
        search_mock.assert_called_once_with('Rua das Flores Birigui')

    @patch('pets.views.search_addresses')
    def test_short_query_returns_empty_without_external_request(self, search_mock):
        response = self.client.get('/api/pets/sugestoes-endereco/', {'q': 'Ru'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])
        search_mock.assert_not_called()

    @patch(
        'pets.geocoding._load_suggestion_features',
        return_value=[
            {
                'properties': {
                    'type': 'house',
                    'name': 'Clinica Veterinaria Amiga',
                    'street': 'Rua Saudades',
                    'housenumber': '32',
                    'district': 'Jardim Morumbi',
                    'city': 'Birigui',
                    'state': 'Sao Paulo',
                    'countrycode': 'BR',
                },
                'geometry': {
                    'coordinates': [-50.3433886, -21.2868583],
                },
            }
        ],
    )
    def test_suggestions_use_photon_and_omit_house_number(self, photon_mock):
        suggestions = search_addresses('Rua Saudades Birigui')

        self.assertEqual(len(suggestions), 1)
        self.assertEqual(suggestions[0]['cidade'], 'Birigui')
        self.assertEqual(suggestions[0]['estado'], 'SP')
        self.assertNotIn('32', suggestions[0]['endereco'])
        photon_mock.assert_called_once_with('Rua Saudades Birigui', 5)


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


class NearbyPetSearchTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(
            username='nearby-test',
            email='nearby-test@example.com',
            password='senha-forte-123',
        )
        self.near_pet = self.create_pet(
            nome='Perto',
            latitude=-21.2886,
            longitude=-50.3404,
            especie='cachorro',
            sexo='macho',
            caracteristicas='Coleira azul',
        )
        self.middle_pet = self.create_pet(
            nome='Vizinha',
            latitude=-21.2089,
            longitude=-50.4328,
            especie='gato',
            sexo='femea',
            caracteristicas='Mancha branca',
        )
        self.far_pet = self.create_pet(
            nome='Distante',
            latitude=-23.5505,
            longitude=-46.6333,
            especie='cachorro',
            sexo='femea',
            caracteristicas='Coleira vermelha',
        )

    def create_pet(self, **overrides):
        data = {
            'autor': self.user,
            'nome': 'Pet',
            'foto': 'pets/test.gif',
            'especie': 'cachorro',
            'raca': 'Sem raca definida',
            'cor': 'Caramelo',
            'sexo': 'macho',
            'caracteristicas': 'Sem detalhes',
            'estado': 'SP',
            'cidade': 'Birigui',
            'endereco_texto': 'Centro',
            'latitude': -21.2886,
            'longitude': -50.3404,
            'data_desaparecimento': '2026-08-01',
            'descricao': 'Pet para busca regional',
            'contato': 'Nao disponivel',
            'status': Pet.STATUS_PERDIDO,
        }
        data.update(overrides)
        return Pet.objects.create(**data)

    def test_anonymous_search_returns_only_pets_in_radius_ordered_by_distance(self):
        response = self.client.post(
            '/api/pets/proximos/',
            {'latitude': -21.289, 'longitude': -50.340, 'raio_km': 25},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            [pet['nome'] for pet in response.data['resultados']],
            ['Perto', 'Vizinha'],
        )
        self.assertEqual(response.data['origem']['tipo'], 'localizacao')
        self.assertIsNotNone(response.data['resultados'][0]['distancia_km'])

    def test_combines_proximity_with_existing_filters(self):
        response = self.client.post(
            '/api/pets/proximos/',
            {
                'latitude': -21.289,
                'longitude': -50.340,
                'raio_km': 25,
                'especie': 'gato',
                'sexo': 'femea',
                'busca': 'branca',
                'status': 'P',
                'data_desaparecimento': '2026-08-01',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual([pet['nome'] for pet in response.data['resultados']], ['Vizinha'])

    def test_rejects_invalid_radius_and_incomplete_coordinates(self):
        invalid_radius = self.client.post(
            '/api/pets/proximos/',
            {'latitude': -21.289, 'longitude': -50.340, 'raio_km': 30},
            format='json',
        )
        incomplete = self.client.post(
            '/api/pets/proximos/',
            {'latitude': -21.289, 'raio_km': 50},
            format='json',
        )

        self.assertEqual(invalid_radius.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(incomplete.status_code, status.HTTP_400_BAD_REQUEST)

    @patch(
        'pets.views.geocode_address',
        return_value={'latitude': -21.2886, 'longitude': -50.3404},
    )
    def test_resolves_city_and_state_for_regional_search(self, geocode_mock):
        response = self.client.post(
            '/api/pets/proximos/',
            {'cidade_origem': 'Birigui', 'estado_origem': 'sp', 'raio_km': 10},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['origem']['rotulo'], 'Birigui, SP')
        geocode_mock.assert_called_once_with('', 'Birigui', 'SP')

    @patch('pets.views.geocode_address', return_value=None)
    def test_returns_known_code_when_city_cannot_be_resolved(self, geocode_mock):
        response = self.client.post(
            '/api/pets/proximos/',
            {'cidade_origem': 'Cidade inexistente', 'estado_origem': 'SP'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['codigo'], 'regiao_nao_encontrada')

    def test_regular_listing_keeps_stable_demo_and_distance_fields(self):
        response = self.client.get(f'/api/pets/{self.near_pet.id}/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['is_demo'])
        self.assertIsNone(response.data['distancia_km'])


class DemoPetSeedTests(TestCase):
    def test_seed_is_idempotent_and_has_expected_status_counts(self):
        with TemporaryDirectory() as media_root, override_settings(MEDIA_ROOT=media_root):
            call_command('seed_demo_pets', verbosity=0)
            call_command('seed_demo_pets', verbosity=0)

            demo_pets = Pet.objects.filter(is_demo=True)
            self.assertEqual(demo_pets.count(), 10)
            self.assertEqual(demo_pets.filter(status=Pet.STATUS_PERDIDO).count(), 6)
            self.assertEqual(demo_pets.filter(status=Pet.STATUS_ENCONTRADO).count(), 4)
            self.assertEqual(demo_pets.values('nome').distinct().count(), 10)
            self.assertFalse(demo_pets.filter(contato__regex=r'\d').exists())


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

from io import BytesIO
from math import ceil, isclose
from tempfile import TemporaryDirectory
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from django.db import IntegrityError, transaction
from django.test import TestCase, override_settings
from PIL import ExifTags, Image
from rest_framework import status
from rest_framework.test import APIClient

from .models import Avistamento, Pet
from .geocoding import search_addresses
from .proximity import build_public_location, haversine_distance_km
from .serializers import PetWriteSerializer


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

    @staticmethod
    def jpeg_with_gps_exif():
        image = Image.new('RGB', (10, 20), 'red')
        exif = Image.Exif()
        exif[ExifTags.Base.Orientation] = 6
        exif[ExifTags.IFD.GPSInfo] = {
            ExifTags.GPS.GPSLatitudeRef: 'S',
            ExifTags.GPS.GPSLatitude: (21.0, 17.0, 19.0),
            ExifTags.GPS.GPSLongitudeRef: 'W',
            ExifTags.GPS.GPSLongitude: (50.0, 20.0, 25.0),
        }
        content = BytesIO()
        image.save(content, format='JPEG', exif=exif)
        return SimpleUploadedFile(
            'pet-com-gps.jpg',
            content.getvalue(),
            content_type='image/jpeg',
        )

    @staticmethod
    def gif_with_sensitive_comment():
        image = Image.new('P', (8, 8), 1)
        content = BytesIO()
        image.save(
            content,
            format='GIF',
            comment=b'GPS:-21.2886,-50.3404',
        )
        return SimpleUploadedFile(
            'pet-com-comentario.gif',
            content.getvalue(),
            content_type='image/gif',
        )

    @staticmethod
    def animated_webp_with_orientation():
        first = Image.new('RGB', (10, 20), 'red')
        second = Image.new('RGB', (10, 20), 'blue')
        exif = Image.Exif()
        exif[ExifTags.Base.Orientation] = 6
        content = BytesIO()
        first.save(
            content,
            format='WEBP',
            save_all=True,
            append_images=[second],
            duration=[100, 100],
            loop=0,
            exif=exif,
        )
        return SimpleUploadedFile(
            'pet-animado.webp',
            content.getvalue(),
            content_type='image/webp',
        )

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
        self.assertIn('máximo', str(response.data['foto']).lower())

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

    def test_rejects_image_when_extension_does_not_match_real_format(self):
        response = self.client.post(
            '/api/pets/',
            self.pet_payload(
                foto=self.image_file('pet.jpg', content_type='image/jpeg')
            ),
            format='multipart',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('imagem válida', str(response.data['foto']).lower())

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

    @patch('pets.views.geocode_address')
    def test_create_respects_explicit_null_coordinate_pair(self, geocode_mock):
        payload = self.pet_payload()
        payload.update({'latitude': '', 'longitude': ''})

        response = self.client.post('/api/pets/', payload, format='multipart')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        pet = Pet.objects.get(pk=response.data['id'])
        self.assertEqual((pet.latitude, pet.longitude), (None, None))
        geocode_mock.assert_not_called()

    @patch('pets.views.geocode_address', return_value=None)
    def test_removes_gps_exif_from_public_photo(self, _geocode_mock):
        response = self.client.post(
            '/api/pets/',
            self.pet_payload(foto=self.jpeg_with_gps_exif()),
            format='multipart',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        pet = Pet.objects.get(pk=response.data['id'])
        with pet.foto.open('rb') as stored_photo:
            stored_image = Image.open(stored_photo)
            gps_data = stored_image.getexif().get_ifd(ExifTags.IFD.GPSInfo)
            stored_size = stored_image.size

        self.assertEqual(gps_data, {})
        self.assertEqual(stored_size, (20, 10))

    @patch('pets.views.geocode_address', return_value=None)
    def test_removes_sensitive_comment_from_gif(self, _geocode_mock):
        response = self.client.post(
            '/api/pets/',
            self.pet_payload(foto=self.gif_with_sensitive_comment()),
            format='multipart',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        pet = Pet.objects.get(pk=response.data['id'])
        with pet.foto.open('rb') as stored_photo:
            stored_image = Image.open(stored_photo)
            comment = stored_image.info.get('comment')

        self.assertIsNone(comment)

    @patch('pets.views.geocode_address', return_value=None)
    def test_preserves_orientation_for_animated_image(self, _geocode_mock):
        response = self.client.post(
            '/api/pets/',
            self.pet_payload(foto=self.animated_webp_with_orientation()),
            format='multipart',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        pet = Pet.objects.get(pk=response.data['id'])
        with pet.foto.open('rb') as stored_photo:
            stored_image = Image.open(stored_photo)
            stored_size = stored_image.size
            frame_count = stored_image.n_frames

        self.assertEqual(stored_size, (20, 10))
        self.assertEqual(frame_count, 2)

    @patch('pets.images.MAX_DECODED_IMAGE_PIXELS', 100)
    def test_rejects_image_that_exceeds_decoded_pixel_limit(self):
        response = self.client.post(
            '/api/pets/',
            self.pet_payload(foto=self.jpeg_with_gps_exif()),
            format='multipart',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('imagem válida', str(response.data['foto']).lower())


class PetLocationIntegrityTests(TestCase):
    def setUp(self):
        self.media_directory = TemporaryDirectory()
        self.media_override = override_settings(MEDIA_ROOT=self.media_directory.name)
        self.media_override.enable()
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(
            username='location-integrity-test',
            email='location-integrity@example.com',
            password='senha-forte-123',
        )
        self.client.force_authenticate(self.user)
        self.pet = Pet.objects.create(
            autor=self.user,
            nome='Luna',
            foto='pets/luna.gif',
            especie='gato',
            raca='Vira-lata',
            cor='Branca',
            sexo='femea',
            caracteristicas='Coleira azul',
            estado='SP',
            cidade='Birigui',
            endereco_texto='Endereco A',
            latitude=-21.2886,
            longitude=-50.3404,
            data_desaparecimento='2026-09-01',
            descricao='Pet para testar integridade de localizacao',
            contato='11999999999',
            status=Pet.STATUS_PERDIDO,
        )

    def tearDown(self):
        self.media_override.disable()
        self.media_directory.cleanup()

    @staticmethod
    def image_file():
        content = (
            b'GIF89a\x01\x00\x01\x00\x80\x00\x00\x00\x00\x00'
            b'\xff\xff\xff!\xf9\x04\x01\x00\x00\x00\x00'
            b',\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;'
        )
        return SimpleUploadedFile('pet.gif', content, content_type='image/gif')

    def full_update_payload(self):
        return {
            'nome': self.pet.nome,
            'foto': self.image_file(),
            'especie': self.pet.especie,
            'raca': self.pet.raca,
            'cor': self.pet.cor,
            'sexo': self.pet.sexo,
            'caracteristicas': self.pet.caracteristicas,
            'estado': self.pet.estado,
            'cidade': self.pet.cidade,
            'endereco_texto': 'Endereco B',
            'data_desaparecimento': '2026-09-01',
            'descricao': self.pet.descricao,
            'contato': self.pet.contato,
            'status': self.pet.status,
        }

    @patch(
        'pets.views.geocode_address',
        return_value={'latitude': -22.1, 'longitude': -49.2},
    )
    def test_patch_replaces_coordinates_when_new_address_is_geocoded(self, geocode_mock):
        response = self.client.patch(
            f'/api/pets/{self.pet.pk}/',
            {'endereco_texto': 'Endereco B'},
            format='json',
        )

        self.pet.refresh_from_db()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual((self.pet.latitude, self.pet.longitude), (-22.1, -49.2))
        geocode_mock.assert_called_once_with('Endereco B', 'Birigui', 'SP')

    @patch('pets.views.geocode_address', return_value=None)
    def test_patch_clears_old_coordinates_when_new_address_cannot_be_geocoded(
        self,
        geocode_mock,
    ):
        response = self.client.patch(
            f'/api/pets/{self.pet.pk}/',
            {'endereco_texto': 'Endereco B'},
            format='json',
        )

        self.pet.refresh_from_db()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual((self.pet.latitude, self.pet.longitude), (None, None))
        geocode_mock.assert_called_once_with('Endereco B', 'Birigui', 'SP')

    @patch('pets.views.geocode_address', return_value=None)
    def test_patch_clears_old_coordinates_when_city_or_state_changes(self, geocode_mock):
        for payload in ({'cidade': 'Aracatuba'}, {'estado': 'RJ'}):
            with self.subTest(payload=payload):
                self.pet.cidade = 'Birigui'
                self.pet.estado = 'SP'
                self.pet.latitude = -21.2886
                self.pet.longitude = -50.3404
                self.pet.save(
                    update_fields=['cidade', 'estado', 'latitude', 'longitude']
                )

                response = self.client.patch(
                    f'/api/pets/{self.pet.pk}/',
                    payload,
                    format='json',
                )

                self.pet.refresh_from_db()
                self.assertEqual(response.status_code, status.HTTP_200_OK)
                self.assertEqual((self.pet.latitude, self.pet.longitude), (None, None))

        self.assertEqual(geocode_mock.call_count, 2)

    @patch(
        'pets.views.geocode_address',
        return_value={'latitude': -22.1, 'longitude': -49.2},
    )
    def test_put_replaces_coordinates_when_new_address_is_geocoded(self, geocode_mock):
        response = self.client.put(
            f'/api/pets/{self.pet.pk}/',
            self.full_update_payload(),
            format='multipart',
        )

        self.pet.refresh_from_db()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual((self.pet.latitude, self.pet.longitude), (-22.1, -49.2))
        geocode_mock.assert_called_once_with('Endereco B', 'Birigui', 'SP')

    @patch('pets.views.geocode_address', return_value=None)
    def test_put_clears_old_coordinates_when_new_address_cannot_be_geocoded(
        self,
        geocode_mock,
    ):
        response = self.client.put(
            f'/api/pets/{self.pet.pk}/',
            self.full_update_payload(),
            format='multipart',
        )

        self.pet.refresh_from_db()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual((self.pet.latitude, self.pet.longitude), (None, None))
        geocode_mock.assert_called_once_with('Endereco B', 'Birigui', 'SP')

    @patch('pets.views.geocode_address')
    def test_address_update_uses_explicit_new_coordinate_pair(self, geocode_mock):
        response = self.client.patch(
            f'/api/pets/{self.pet.pk}/',
            {
                'endereco_texto': 'Endereco B',
                'latitude': -22.1,
                'longitude': -49.2,
            },
            format='json',
        )

        self.pet.refresh_from_db()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual((self.pet.latitude, self.pet.longitude), (-22.1, -49.2))
        geocode_mock.assert_not_called()

    def test_rejects_coordinate_fields_sent_without_their_pair(self):
        for payload, expected_field in (
            ({'latitude': -21.2}, 'longitude'),
            ({'longitude': -50.2}, 'latitude'),
        ):
            with self.subTest(payload=payload):
                response = self.client.patch(
                    f'/api/pets/{self.pet.pk}/',
                    payload,
                    format='json',
                )

                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
                self.assertIn(expected_field, response.data)

    def test_accepts_coordinate_boundaries(self):
        for latitude, longitude in ((-90, -180), (90, 180)):
            with self.subTest(latitude=latitude, longitude=longitude):
                response = self.client.patch(
                    f'/api/pets/{self.pet.pk}/',
                    {'latitude': latitude, 'longitude': longitude},
                    format='json',
                )

                self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_rejects_coordinates_outside_boundaries(self):
        for payload, expected_field in (
            ({'latitude': -90.1, 'longitude': 0}, 'latitude'),
            ({'latitude': 90.1, 'longitude': 0}, 'latitude'),
            ({'latitude': 0, 'longitude': -180.1}, 'longitude'),
            ({'latitude': 0, 'longitude': 180.1}, 'longitude'),
        ):
            with self.subTest(payload=payload):
                response = self.client.patch(
                    f'/api/pets/{self.pet.pk}/',
                    payload,
                    format='json',
                )

                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
                self.assertIn(expected_field, response.data)

    def test_rejects_non_finite_coordinate_values(self):
        for value in ('NaN', 'Infinity', '-Infinity'):
            with self.subTest(value=value):
                serializer = PetWriteSerializer(
                    self.pet,
                    data={'latitude': value, 'longitude': value},
                    partial=True,
                )

                self.assertFalse(serializer.is_valid())
                self.assertTrue(serializer.errors)

    @patch('pets.views.geocode_address')
    def test_accepts_explicit_null_coordinate_pair_without_geocoding(self, geocode_mock):
        response = self.client.patch(
            f'/api/pets/{self.pet.pk}/',
            {
                'endereco_texto': 'Endereco B',
                'latitude': None,
                'longitude': None,
            },
            format='json',
        )

        self.pet.refresh_from_db()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(self.pet.endereco_texto, 'Endereco B')
        self.assertEqual((self.pet.latitude, self.pet.longitude), (None, None))
        geocode_mock.assert_not_called()

    def test_database_rejects_partial_coordinate_pair(self):
        with self.assertRaises(IntegrityError), transaction.atomic():
            Pet.objects.filter(pk=self.pet.pk).update(latitude=None)

    def test_database_rejects_coordinates_outside_boundaries(self):
        for latitude, longitude in ((-90.1, 0), (90.1, 0), (0, -180.1), (0, 180.1)):
            with self.subTest(latitude=latitude, longitude=longitude):
                with self.assertRaises(IntegrityError), transaction.atomic():
                    Pet.objects.filter(pk=self.pet.pk).update(
                        latitude=latitude,
                        longitude=longitude,
                    )


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

    @override_settings(GEOCODING_ENABLED=True)
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
        self.assertEqual(set(response.data), {'id', 'criado_em'})
        self.assertEqual(self.pet.avistamentos.count(), 1)
        self.client.force_authenticate(self.user)
        owner_response = self.client.get(f'/api/pets/{self.pet.id}/avistamentos/')
        self.assertTrue(owner_response.data[0]['proximo'])
        self.assertTrue(isclose(owner_response.data[0]['distancia_km'], 0, abs_tol=0.01))

    def test_marks_distant_sighting_as_not_nearby(self):
        response = self.client.post(
            f'/api/pets/{self.pet.id}/avistamentos/',
            {'latitude': -23.5505, 'longitude': -46.6333},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.client.force_authenticate(self.user)
        owner_response = self.client.get(f'/api/pets/{self.pet.id}/avistamentos/')
        self.assertFalse(owner_response.data[0]['proximo'])
        self.assertGreater(owner_response.data[0]['distancia_km'], 3)

    def test_rejects_coordinates_outside_valid_range(self):
        response = self.client.post(
            f'/api/pets/{self.pet.id}/avistamentos/',
            {'latitude': 95, 'longitude': -47},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('latitude', response.data)


class PetPrivacyTests(TestCase):
    PUBLIC_LIST_FIELDS = {
        'id',
        'nome',
        'foto',
        'estado',
        'cidade',
        'data_desaparecimento',
        'status',
        'is_demo',
        'distancia_aproximada_km',
    }
    PUBLIC_DETAIL_FIELDS = {
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
    }
    PUBLIC_SIGHTING_FIELDS = {'id', 'criado_em'}
    PET_PRIVATE_FIELDS = {
        'autor',
        'autor_username',
        'endereco_texto',
        'latitude',
        'longitude',
        'raio_area_metros',
    }
    SIGHTING_PRIVATE_FIELDS = {
        'pet',
        'latitude',
        'longitude',
        'descricao',
        'contato_quem_viu',
        'distancia_km',
        'proximo',
    }

    def setUp(self):
        self.client = APIClient()
        self.owner = get_user_model().objects.create_user(
            username='privacy-owner',
            email='privacy-owner@example.com',
            password='senha-forte-123',
        )
        self.other_user = get_user_model().objects.create_user(
            username='privacy-other',
            email='privacy-other@example.com',
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
            cidade='Birigui',
            endereco_texto='Rua Privada, 123',
            latitude=-21.288612,
            longitude=-50.340412,
            raio_area_metros=400,
            data_desaparecimento='2026-09-01',
            descricao='Pet para validar privacidade',
            contato='18999999999',
        )
        self.sighting = Avistamento.objects.create(
            pet=self.pet,
            latitude=-21.287901,
            longitude=-50.341102,
            descricao='Vi na Rua Particular, perto do numero 45',
            contato_quem_viu='18988888888',
        )

    def assert_public_pet(self, data, *, detail):
        self.assertTrue(self.PET_PRIVATE_FIELDS.isdisjoint(data))
        if detail:
            self.assertEqual(set(data), self.PUBLIC_DETAIL_FIELDS)
            self.assertFalse(data['is_owner'])
            self.assertEqual(data['contato'], self.pet.contato)
            self.assertEqual(
                data['localizacao_publica']['latitude'],
                round(self.pet.latitude, 2),
            )
            self.assertEqual(
                data['localizacao_publica']['longitude'],
                round(self.pet.longitude, 2),
            )
            for sighting in data['avistamentos']:
                self.assertEqual(set(sighting), self.PUBLIC_SIGHTING_FIELDS)
                self.assertTrue(self.SIGHTING_PRIVATE_FIELDS.isdisjoint(sighting))
        else:
            self.assertEqual(set(data), self.PUBLIC_LIST_FIELDS)
            self.assertNotIn('avistamentos', data)
            self.assertNotIn('localizacao_publica', data)

    def test_anonymous_list_has_compact_public_contract(self):
        responses = [self.client.get('/api/pets/')]
        for user in (self.other_user, self.owner):
            self.client.force_authenticate(user)
            responses.append(self.client.get('/api/pets/'))

        for response in responses:
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assert_public_pet(response.data[0], detail=False)

    def test_anonymous_and_non_owner_receive_only_public_pet_detail(self):
        anonymous = self.client.get(f'/api/pets/{self.pet.id}/')
        self.client.force_authenticate(self.other_user)
        non_owner = self.client.get(f'/api/pets/{self.pet.id}/')

        self.assertEqual(anonymous.status_code, status.HTTP_200_OK)
        self.assertEqual(non_owner.status_code, status.HTTP_200_OK)
        self.assert_public_pet(anonymous.data, detail=True)
        self.assert_public_pet(non_owner.data, detail=True)

    def test_owner_receives_private_pet_and_sighting_fields(self):
        self.client.force_authenticate(self.owner)

        response = self.client.get(f'/api/pets/{self.pet.id}/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['is_owner'])
        self.assertEqual(response.data['endereco_texto'], self.pet.endereco_texto)
        self.assertEqual(response.data['latitude'], self.pet.latitude)
        self.assertEqual(response.data['longitude'], self.pet.longitude)
        sighting = response.data['avistamentos'][0]
        self.assertEqual(sighting['contato_quem_viu'], self.sighting.contato_quem_viu)
        self.assertEqual(sighting['descricao'], self.sighting.descricao)
        self.assertEqual(sighting['latitude'], self.sighting.latitude)
        self.assertEqual(sighting['longitude'], self.sighting.longitude)

    def test_sighting_list_contract_depends_on_pet_ownership(self):
        endpoint = f'/api/pets/{self.pet.id}/avistamentos/'
        anonymous = self.client.get(endpoint)
        self.client.force_authenticate(self.other_user)
        non_owner = self.client.get(endpoint)
        self.client.force_authenticate(self.owner)
        owner = self.client.get(endpoint)

        self.assertTrue(self.SIGHTING_PRIVATE_FIELDS.isdisjoint(anonymous.data[0]))
        self.assertTrue(self.SIGHTING_PRIVATE_FIELDS.isdisjoint(non_owner.data[0]))
        self.assertEqual(set(anonymous.data[0]), self.PUBLIC_SIGHTING_FIELDS)
        self.assertEqual(set(non_owner.data[0]), self.PUBLIC_SIGHTING_FIELDS)
        self.assertEqual(owner.data[0]['contato_quem_viu'], self.sighting.contato_quem_viu)
        self.assertEqual(owner.data[0]['latitude'], self.sighting.latitude)

    def test_anonymous_sighting_post_stores_private_data_without_echoing_it(self):
        response = self.client.post(
            f'/api/pets/{self.pet.id}/avistamentos/',
            {
                'latitude': -21.286,
                'longitude': -50.342,
                'descricao': 'Relato privado',
                'contato_quem_viu': '18977777777',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(self.SIGHTING_PRIVATE_FIELDS.isdisjoint(response.data))
        stored = self.pet.avistamentos.get(descricao='Relato privado')
        self.assertEqual(stored.latitude, -21.286)
        self.assertEqual(stored.contato_quem_viu, '18977777777')

    def test_sighting_post_contract_depends_on_pet_ownership(self):
        endpoint = f'/api/pets/{self.pet.id}/avistamentos/'
        payload = {
            'latitude': -21.286,
            'longitude': -50.342,
            'descricao': 'Relato privado',
            'contato_quem_viu': '18977777777',
        }

        self.client.force_authenticate(self.other_user)
        non_owner = self.client.post(endpoint, payload, format='json')
        self.client.force_authenticate(self.owner)
        owner = self.client.post(endpoint, payload, format='json')

        self.assertEqual(set(non_owner.data), self.PUBLIC_SIGHTING_FIELDS)
        self.assertTrue(self.SIGHTING_PRIVATE_FIELDS.isdisjoint(non_owner.data))
        self.assertEqual(owner.data['descricao'], payload['descricao'])
        self.assertEqual(owner.data['contato_quem_viu'], payload['contato_quem_viu'])
        self.assertEqual(owner.data['latitude'], payload['latitude'])

    def test_nearby_search_uses_compact_public_contract(self):
        responses = []
        for user in (None, self.other_user, self.owner):
            self.client.force_authenticate(user)
            responses.append(
                self.client.post(
                    '/api/pets/proximos/',
                    {'latitude': -21.289, 'longitude': -50.340, 'raio_km': 10},
                    format='json',
                )
            )

        for response in responses:
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            result = response.data['resultados'][0]
            self.assert_public_pet(result, detail=False)
            self.assertNotIn('distancia_km', result)
            self.assertIn('distancia_aproximada_km', result)


class ProximityTests(TestCase):
    def test_haversine_returns_expected_distance(self):
        distance = haversine_distance_km(-23.5505, -46.6333, -22.9068, -47.0616)

        self.assertTrue(isclose(distance, 83.9, abs_tol=1))

    def test_public_location_is_deterministic_and_uses_two_decimal_cell(self):
        first = build_public_location(-21.288612, -50.340412, 400)
        second = build_public_location(-21.288612, -50.340412, 400)

        self.assertEqual(first, second)
        self.assertEqual(first['latitude'], -21.29)
        self.assertEqual(first['longitude'], -50.34)

    def test_public_radius_covers_generalization_offset_and_private_area(self):
        latitude = -0.004999
        longitude = -50.004999
        private_radius = 900
        location = build_public_location(latitude, longitude, private_radius)
        offset_meters = haversine_distance_km(
            latitude,
            longitude,
            location['latitude'],
            location['longitude'],
        ) * 1000

        self.assertLess(offset_meters, 788)
        self.assertGreaterEqual(
            location['raio_metros'],
            offset_meters + private_radius,
        )

    def test_public_radius_does_not_apply_city_sized_minimum(self):
        latitude = -21.2886
        longitude = -50.3404
        private_radius = 400
        location = build_public_location(latitude, longitude, private_radius)
        offset_meters = haversine_distance_km(
            latitude,
            longitude,
            location['latitude'],
            location['longitude'],
        ) * 1000

        self.assertEqual(
            location['raio_metros'],
            ceil(offset_meters + private_radius),
        )
        self.assertLess(location['raio_metros'], 1500)

    def test_public_location_handles_missing_coordinates(self):
        self.assertIsNone(build_public_location(None, -50.34, 400))
        self.assertIsNone(build_public_location(-21.29, None, 400))

    def test_public_location_rejects_invalid_coordinates(self):
        for latitude, longitude in (
            (float('nan'), -50.34),
            (-21.29, float('inf')),
            (-90.1, -50.34),
            (90.1, -50.34),
            (-21.29, -180.1),
            (-21.29, 180.1),
        ):
            with self.subTest(latitude=latitude, longitude=longitude):
                self.assertIsNone(build_public_location(latitude, longitude, 400))


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
        self.assertIsNotNone(
            response.data['resultados'][0]['distancia_aproximada_km']
        )

    def test_ignores_pet_without_coordinate_pair(self):
        without_coordinates = self.create_pet(
            nome='Sem localizacao',
            latitude=None,
            longitude=None,
        )

        response = self.client.post(
            '/api/pets/proximos/',
            {'latitude': -21.289, 'longitude': -50.340, 'raio_km': 25},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn(
            without_coordinates.pk,
            [pet['id'] for pet in response.data['resultados']],
        )

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

    def test_regular_detail_keeps_demo_and_public_location_fields(self):
        response = self.client.get(f'/api/pets/{self.near_pet.id}/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['is_demo'])
        self.assertEqual(response.data['localizacao_publica']['latitude'], -21.29)
        self.assertNotIn('distancia_km', response.data)


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


class MyPetsTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.owner = get_user_model().objects.create_user(
            username='my-pets-owner',
            email='my-pets-owner@example.com',
            password='senha-forte-123',
        )
        self.other_user = get_user_model().objects.create_user(
            username='my-pets-other',
            email='my-pets-other@example.com',
            password='senha-forte-123',
        )
        self.owner_pet = self.create_pet(self.owner, 'Lobinha')
        self.other_pet = self.create_pet(self.other_user, 'Toby')

    @staticmethod
    def create_pet(owner, name):
        return Pet.objects.create(
            autor=owner,
            nome=name,
            foto=f'pets/{name.lower()}.gif',
            especie='cachorro',
            raca='Vira-lata',
            cor='Caramelo',
            sexo='femea',
            caracteristicas='Coleira azul',
            estado='SP',
            cidade='Campinas',
            endereco_texto='Endereco privado',
            latitude=-22.91,
            longitude=-47.06,
            data_desaparecimento='2026-08-01',
            descricao='Pet para testar a listagem da conta',
            contato='19999999999',
        )

    def test_anonymous_user_cannot_list_my_pets(self):
        response = self.client.get('/api/pets/meus/')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_my_pets_returns_only_authenticated_owners_pets(self):
        self.client.force_authenticate(self.owner)

        response = self.client.get('/api/pets/meus/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], self.owner_pet.id)
        self.assertEqual(response.data[0]['nome'], 'Lobinha')
        self.assertNotEqual(response.data[0]['id'], self.other_pet.id)

    def test_list_my_pets_uses_compact_contract_without_private_fields(self):
        self.client.force_authenticate(self.owner)

        response = self.client.get('/api/pets/meus/')

        self.assertEqual(
            set(response.data[0]),
            {
                'id',
                'nome',
                'foto',
                'estado',
                'cidade',
                'data_desaparecimento',
                'status',
                'is_demo',
                'distancia_aproximada_km',
            },
        )
        for private_field in (
            'autor',
            'endereco_texto',
            'latitude',
            'longitude',
            'contato',
            'avistamentos',
        ):
            self.assertNotIn(private_field, response.data[0])

from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient


class AuthenticationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user_data = {
            'username': 'auth-test',
            'email': 'auth-test@example.com',
            'password': 'senha-forte-123',
        }

    def test_user_can_register_with_hashed_password(self):
        response = self.client.post(
            '/api/auth/register/',
            self.user_data,
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertNotIn('password', response.data)
        user = get_user_model().objects.get(username='auth-test')
        self.assertTrue(user.check_password(self.user_data['password']))

    def test_registration_rejects_common_password(self):
        response = self.client.post(
            '/api/auth/register/',
            {**self.user_data, 'password': 'password123'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)

    def test_database_rejects_case_insensitive_duplicate_email(self):
        get_user_model().objects.create_user(**self.user_data)

        with self.assertRaises(IntegrityError), transaction.atomic():
            get_user_model().objects.create_user(
                username='auth-test-duplicate',
                email='AUTH-TEST@EXAMPLE.COM',
                password='outra-senha-forte-456',
            )

    def test_registration_rejects_case_insensitive_duplicate_email(self):
        get_user_model().objects.create_user(**self.user_data)

        response = self.client.post(
            '/api/auth/register/',
            {
                'username': 'auth-test-duplicate',
                'email': 'AUTH-TEST@EXAMPLE.COM',
                'password': 'outra-senha-forte-456',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_user_can_obtain_jwt_with_username(self):
        get_user_model().objects.create_user(**self.user_data)

        response = self.client.post(
            '/api/auth/token/',
            {
                'username': self.user_data['username'],
                'password': self.user_data['password'],
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_user_can_obtain_jwt_with_email(self):
        get_user_model().objects.create_user(**self.user_data)

        response = self.client.post(
            '/api/auth/token/',
            {
                'username': self.user_data['email'],
                'password': self.user_data['password'],
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

    def test_me_requires_authentication(self):
        response = self.client.get('/api/auth/me/')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_jwt_access_token_can_open_me(self):
        user = get_user_model().objects.create_user(**self.user_data)
        token_response = self.client.post(
            '/api/auth/token/',
            {
                'username': self.user_data['username'],
                'password': self.user_data['password'],
            },
            format='json',
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {token_response.data['access']}"
        )

        response = self.client.get('/api/auth/me/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], user.id)
        self.assertEqual(response.data['email'], self.user_data['email'])

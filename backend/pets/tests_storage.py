from django.core.exceptions import ImproperlyConfigured
from django.test import SimpleTestCase

from config.media_storage import (
    LOCAL_STORAGE_BACKEND,
    R2_STORAGE_BACKEND,
    build_media_storage_settings,
)


class MediaStorageConfigurationTests(SimpleTestCase):
    r2_environment = {
        'MEDIA_STORAGE_BACKEND': 'r2',
        'R2_ACCESS_KEY_ID': 'test-access-key',
        'R2_SECRET_ACCESS_KEY': 'test-secret-key',
        'R2_BUCKET_NAME': 'achar-seu-pet-test',
        'R2_ENDPOINT_URL': 'https://account-id.r2.cloudflarestorage.com',
        'R2_PUBLIC_BASE_URL': 'https://media.example.com',
    }

    def test_debug_defaults_to_local_storage(self):
        config = build_media_storage_settings({}, debug=True)

        self.assertEqual(config['backend'], 'local')
        self.assertEqual(
            config['storages']['default']['BACKEND'],
            LOCAL_STORAGE_BACKEND,
        )
        self.assertEqual(config['media_url'], '/media/')

    def test_production_defaults_to_r2_and_requires_credentials(self):
        with self.assertRaisesMessage(
            ImproperlyConfigured,
            'R2_ACCESS_KEY_ID precisa estar definida',
        ):
            build_media_storage_settings({}, debug=False)

    def test_r2_uses_public_https_urls_without_signed_query_strings(self):
        config = build_media_storage_settings(self.r2_environment, debug=False)
        options = config['storages']['default']['OPTIONS']

        self.assertEqual(config['backend'], 'r2')
        self.assertEqual(
            config['storages']['default']['BACKEND'],
            R2_STORAGE_BACKEND,
        )
        self.assertEqual(config['media_url'], 'https://media.example.com/')
        self.assertEqual(options['custom_domain'], 'media.example.com')
        self.assertFalse(options['querystring_auth'])
        self.assertFalse(options['file_overwrite'])

    def test_r2_rejects_non_https_public_url(self):
        environment = {
            **self.r2_environment,
            'R2_PUBLIC_BASE_URL': 'http://media.example.com',
        }

        with self.assertRaisesMessage(
            ImproperlyConfigured,
            'R2_PUBLIC_BASE_URL precisa ser uma origem HTTPS',
        ):
            build_media_storage_settings(environment, debug=False)

    def test_unknown_backend_is_rejected(self):
        with self.assertRaisesMessage(
            ImproperlyConfigured,
            'MEDIA_STORAGE_BACKEND deve ser "local" ou "r2"',
        ):
            build_media_storage_settings(
                {'MEDIA_STORAGE_BACKEND': 'unknown'},
                debug=True,
            )

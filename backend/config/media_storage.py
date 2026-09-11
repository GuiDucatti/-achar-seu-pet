from urllib.parse import urlsplit

from django.core.exceptions import ImproperlyConfigured


LOCAL_STORAGE_BACKEND = 'django.core.files.storage.FileSystemStorage'
R2_STORAGE_BACKEND = 'storages.backends.s3.S3Storage'
STATIC_STORAGE_BACKEND = 'django.contrib.staticfiles.storage.StaticFilesStorage'


def _required_value(environ, name):
    value = environ.get(name, '').strip()
    if not value:
        raise ImproperlyConfigured(
            f'{name} precisa estar definida quando MEDIA_STORAGE_BACKEND=r2.'
        )
    return value


def _https_origin(value, name):
    parsed = urlsplit(value)
    if (
        parsed.scheme != 'https'
        or not parsed.netloc
        or parsed.path not in ('', '/')
        or parsed.query
        or parsed.fragment
    ):
        raise ImproperlyConfigured(
            f'{name} precisa ser uma origem HTTPS sem caminho, query ou fragmento.'
        )
    return parsed


def build_media_storage_settings(environ, debug):
    default_backend = 'local' if debug else 'r2'
    selected_backend = environ.get(
        'MEDIA_STORAGE_BACKEND',
        default_backend,
    ).strip().lower()

    if selected_backend == 'local':
        return {
            'backend': selected_backend,
            'media_url': '/media/',
            'storages': {
                'default': {'BACKEND': LOCAL_STORAGE_BACKEND},
                'staticfiles': {'BACKEND': STATIC_STORAGE_BACKEND},
            },
        }

    if selected_backend != 'r2':
        raise ImproperlyConfigured(
            'MEDIA_STORAGE_BACKEND deve ser "local" ou "r2".'
        )

    access_key = _required_value(environ, 'R2_ACCESS_KEY_ID')
    secret_key = _required_value(environ, 'R2_SECRET_ACCESS_KEY')
    bucket_name = _required_value(environ, 'R2_BUCKET_NAME')
    endpoint_url = _required_value(environ, 'R2_ENDPOINT_URL').rstrip('/')
    public_base_url = _required_value(environ, 'R2_PUBLIC_BASE_URL').rstrip('/')

    _https_origin(endpoint_url, 'R2_ENDPOINT_URL')
    public_origin = _https_origin(public_base_url, 'R2_PUBLIC_BASE_URL')

    return {
        'backend': selected_backend,
        'media_url': f'{public_base_url}/',
        'storages': {
            'default': {
                'BACKEND': R2_STORAGE_BACKEND,
                'OPTIONS': {
                    'access_key': access_key,
                    'secret_key': secret_key,
                    'bucket_name': bucket_name,
                    'endpoint_url': endpoint_url,
                    'region_name': 'auto',
                    'default_acl': None,
                    'querystring_auth': False,
                    'file_overwrite': False,
                    'custom_domain': public_origin.netloc,
                    'url_protocol': 'https:',
                },
            },
            'staticfiles': {'BACKEND': STATIC_STORAGE_BACKEND},
        },
    }

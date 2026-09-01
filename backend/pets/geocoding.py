import json
import logging
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from django.conf import settings


logger = logging.getLogger(__name__)


def build_search_text(endereco_texto, cidade, estado):
    parts = [endereco_texto, cidade, estado, 'Brasil']
    return ', '.join(str(part).strip() for part in parts if str(part).strip())


def geocode_address(endereco_texto, cidade, estado):
    if not settings.GEOCODING_ENABLED:
        return None

    search_text = build_search_text(endereco_texto, cidade, estado)
    if not search_text:
        return None

    query = urlencode(
        {
            'q': search_text,
            'format': 'jsonv2',
            'limit': 1,
            'countrycodes': 'br',
        }
    )
    request = Request(
        f'{settings.NOMINATIM_URL}?{query}',
        headers={
            'Accept': 'application/json',
            'Accept-Language': 'pt-BR',
            'User-Agent': settings.NOMINATIM_USER_AGENT,
        },
    )

    try:
        with urlopen(request, timeout=settings.GEOCODING_TIMEOUT_SECONDS) as response:
            results = json.load(response)
    except Exception:
        logger.warning('Falha ao consultar o geocoding para %s', search_text, exc_info=True)
        return None

    if not results:
        return None

    try:
        latitude = float(results[0]['lat'])
        longitude = float(results[0]['lon'])
    except (KeyError, TypeError, ValueError):
        logger.warning('Resposta invalida do geocoding para %s', search_text)
        return None

    if not -90 <= latitude <= 90 or not -180 <= longitude <= 180:
        logger.warning('Coordenadas fora do intervalo para %s', search_text)
        return None

    return {'latitude': latitude, 'longitude': longitude}

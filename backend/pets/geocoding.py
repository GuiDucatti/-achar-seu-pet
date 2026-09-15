import json
import logging
import unicodedata
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from django.conf import settings


logger = logging.getLogger(__name__)

STATE_CODES = {
    'acre': 'AC',
    'alagoas': 'AL',
    'amapa': 'AP',
    'amazonas': 'AM',
    'bahia': 'BA',
    'ceara': 'CE',
    'distrito federal': 'DF',
    'espirito santo': 'ES',
    'goias': 'GO',
    'maranhao': 'MA',
    'mato grosso': 'MT',
    'mato grosso do sul': 'MS',
    'minas gerais': 'MG',
    'para': 'PA',
    'paraiba': 'PB',
    'parana': 'PR',
    'pernambuco': 'PE',
    'piaui': 'PI',
    'rio de janeiro': 'RJ',
    'rio grande do norte': 'RN',
    'rio grande do sul': 'RS',
    'rondonia': 'RO',
    'roraima': 'RR',
    'santa catarina': 'SC',
    'sao paulo': 'SP',
    'sergipe': 'SE',
    'tocantins': 'TO',
}


def build_search_text(endereco_texto, cidade, estado):
    parts = [endereco_texto, cidade, estado, 'Brasil']
    return ', '.join(str(part).strip() for part in parts if str(part).strip())


def _load_results(search_text, limit=1, address_details=False):
    query_data = {
        'q': search_text,
        'format': 'jsonv2',
        'limit': limit,
        'countrycodes': 'br',
    }
    if address_details:
        query_data['addressdetails'] = 1

    query = urlencode(query_data)
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
            return json.load(response)
    except Exception:
        logger.warning('Falha ao consultar o geocoding para %s', search_text, exc_info=True)
        return []


def _load_suggestion_features(search_text, limit):
    query = urlencode(
        {
            'q': search_text,
            'limit': max(1, min(int(limit), 5)),
        }
    )
    request = Request(
        f'{settings.ADDRESS_SUGGESTION_URL}?{query}',
        headers={
            'Accept': 'application/json',
            'User-Agent': settings.NOMINATIM_USER_AGENT,
        },
    )

    try:
        with urlopen(request, timeout=settings.GEOCODING_TIMEOUT_SECONDS) as response:
            payload = json.load(response)
            return payload.get('features', [])
    except Exception:
        logger.warning(
            'Falha ao consultar sugestões de endereço para %s',
            search_text,
            exc_info=True,
        )
        return []


def _plain_text(value):
    normalized = unicodedata.normalize('NFKD', str(value or ''))
    return ''.join(character for character in normalized if not unicodedata.combining(character)).casefold()


def _state_code(address):
    iso_code = address.get('ISO3166-2-lvl4') or address.get('ISO3166-2-lvl3')
    if iso_code and '-' in iso_code:
        return iso_code.rsplit('-', 1)[-1].upper()

    state = _plain_text(address.get('state'))
    return STATE_CODES.get(state, '')


def search_addresses(search_text, limit=5):
    search_text = str(search_text or '').strip()
    if not settings.GEOCODING_ENABLED or len(search_text) < 3:
        return []

    results = _load_suggestion_features(search_text, limit)
    suggestions = []
    seen = set()

    for result in results:
        address = result.get('properties') or {}
        if str(address.get('countrycode', '')).upper() != 'BR':
            continue

        place_name = address.get('name') or ''
        road = address.get('street') or (
            place_name if address.get('type') == 'street' else ''
        )
        neighbourhood = address.get('district') or address.get('locality') or ''
        city = (
            address.get('city')
            or address.get('county')
            or ''
        )
        state_code = _state_code(address)

        public_parts = []
        if place_name and address.get('type') != 'street':
            public_parts.append(place_name)
        if road and road.casefold() != place_name.casefold():
            public_parts.append(road)
        elif road:
            public_parts.append(road)
        if neighbourhood and neighbourhood.casefold() != road.casefold():
            public_parts.append(neighbourhood)
        public_address = ', '.join(part for part in public_parts if part)

        try:
            longitude, latitude = result['geometry']['coordinates'][:2]
            latitude = float(latitude)
            longitude = float(longitude)
        except (KeyError, TypeError, ValueError, IndexError):
            continue

        if not public_address or not city or not state_code:
            continue
        if not -90 <= latitude <= 90 or not -180 <= longitude <= 180:
            continue

        key = (public_address.casefold(), city.casefold(), state_code)
        if key in seen:
            continue
        seen.add(key)

        suggestions.append(
            {
                'rotulo': f'{public_address} - {city}, {state_code}',
                'endereco': public_address,
                'cidade': city,
                'estado': state_code,
                'latitude': round(latitude, 6),
                'longitude': round(longitude, 6),
            }
        )

    return suggestions


def geocode_address(endereco_texto, cidade, estado):
    if not settings.GEOCODING_ENABLED:
        return None

    search_text = build_search_text(endereco_texto, cidade, estado)
    if not search_text:
        return None

    results = _load_results(search_text)

    if not results:
        return None

    try:
        latitude = float(results[0]['lat'])
        longitude = float(results[0]['lon'])
    except (KeyError, TypeError, ValueError):
        logger.warning('Resposta inválida do geocoding para %s', search_text)
        return None

    if not -90 <= latitude <= 90 or not -180 <= longitude <= 180:
        logger.warning('Coordenadas fora do intervalo para %s', search_text)
        return None

    return {'latitude': latitude, 'longitude': longitude}

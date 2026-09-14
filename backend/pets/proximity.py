from math import asin, ceil, cos, degrees, isfinite, radians, sin, sqrt


EARTH_RADIUS_KM = 6371.0
PUBLIC_LOCATION_DECIMAL_PLACES = 2


def bounding_box(latitude, longitude, radius_km):
    """Return a coarse latitude/longitude box around an origin."""
    latitude_delta = degrees(radius_km / EARTH_RADIUS_KM)
    latitude_cosine = abs(cos(radians(latitude)))
    longitude_delta = (
        180
        if latitude_cosine < 0.000001
        else latitude_delta / latitude_cosine
    )

    return {
        'latitude_min': max(-90, latitude - latitude_delta),
        'latitude_max': min(90, latitude + latitude_delta),
        'longitude_min': max(-180, longitude - longitude_delta),
        'longitude_max': min(180, longitude + longitude_delta),
    }


def haversine_distance_km(latitude_one, longitude_one, latitude_two, longitude_two):
    """Return the great-circle distance between two points in kilometers."""
    coordinates = (latitude_one, longitude_one, latitude_two, longitude_two)
    if any(value is None for value in coordinates):
        return None

    latitude_delta = radians(latitude_two - latitude_one)
    longitude_delta = radians(longitude_two - longitude_one)
    latitude_one = radians(latitude_one)
    latitude_two = radians(latitude_two)

    haversine = (
        sin(latitude_delta / 2) ** 2
        + cos(latitude_one) * cos(latitude_two) * sin(longitude_delta / 2) ** 2
    )
    return 2 * EARTH_RADIUS_KM * asin(sqrt(min(1, haversine)))


def build_public_location(latitude, longitude, private_radius_meters=0):
    if (
        latitude is None
        or longitude is None
        or not isinstance(latitude, (int, float))
        or not isinstance(longitude, (int, float))
        or not isfinite(latitude)
        or not isfinite(longitude)
        or not -90 <= latitude <= 90
        or not -180 <= longitude <= 180
    ):
        return None

    public_latitude = round(latitude, PUBLIC_LOCATION_DECIMAL_PLACES)
    public_longitude = round(longitude, PUBLIC_LOCATION_DECIMAL_PLACES)
    offset_meters = haversine_distance_km(
        latitude,
        longitude,
        public_latitude,
        public_longitude,
    ) * 1000
    private_radius_meters = max(0, int(private_radius_meters or 0))
    radius_meters = ceil(offset_meters + private_radius_meters)

    return {
        'latitude': public_latitude,
        'longitude': public_longitude,
        'raio_metros': radius_meters,
    }


def proximity_result(
    latitude_one,
    longitude_one,
    latitude_two,
    longitude_two,
    threshold_km=3,
):
    distance = haversine_distance_km(
        latitude_one,
        longitude_one,
        latitude_two,
        longitude_two,
    )
    if distance is None:
        return {'distancia_km': None, 'proximo': False}

    return {
        'distancia_km': round(distance, 2),
        'proximo': distance <= threshold_km,
    }

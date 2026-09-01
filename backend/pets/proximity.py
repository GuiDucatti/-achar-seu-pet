from math import asin, cos, degrees, radians, sin, sqrt


EARTH_RADIUS_KM = 6371.0


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

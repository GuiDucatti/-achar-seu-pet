from math import asin, cos, radians, sin, sqrt


EARTH_RADIUS_KM = 6371.0


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

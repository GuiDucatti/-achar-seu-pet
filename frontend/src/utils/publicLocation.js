function parseBoundedNumber(value, minimum, maximum) {
  if (value === null || value === undefined) return null

  let parsedValue
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return null
    parsedValue = value
  } else if (typeof value === 'string') {
    const normalizedValue = value.trim()
    if (!normalizedValue) return null
    parsedValue = Number(normalizedValue)
  } else {
    return null
  }

  if (!Number.isFinite(parsedValue) || parsedValue < minimum || parsedValue > maximum) {
    return null
  }

  return parsedValue
}

export function parseCoordinatePair(latitudeValue, longitudeValue) {
  const latitude = parseBoundedNumber(latitudeValue, -90, 90)
  const longitude = parseBoundedNumber(longitudeValue, -180, 180)

  if (latitude === null || longitude === null) return null
  return { latitude, longitude }
}

export function parsePublicLocation(location) {
  if (!location || typeof location !== 'object') return null

  const coordinates = parseCoordinatePair(location.latitude, location.longitude)
  const radius = parseBoundedNumber(location.raio_metros, 0, Number.MAX_SAFE_INTEGER)

  if (!coordinates || radius === null || radius <= 0) return null
  return { ...coordinates, radius }
}

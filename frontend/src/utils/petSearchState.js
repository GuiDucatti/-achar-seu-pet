const STORAGE_PREFIX = 'acharSeuPet.search.'

const emptyFilters = {
  estado: '',
  cidade: '',
  especie: '',
  sexo: '',
  data_desaparecimento: '',
  busca: '',
}

function normalizeFilters(filters) {
  return Object.fromEntries(
    Object.keys(emptyFilters).map((key) => [
      key,
      typeof filters?.[key] === 'string' ? filters[key] : '',
    ]),
  )
}

function normalizeRegion(region) {
  if (region?.type === 'city' && typeof region.city === 'string' && typeof region.state === 'string') {
    return { type: 'city', city: region.city, state: region.state }
  }

  if (
    region?.type === 'gps'
    && Number.isFinite(region.latitude)
    && Number.isFinite(region.longitude)
  ) {
    return { type: 'gps', latitude: region.latitude, longitude: region.longitude }
  }

  return null
}

export function readPetSearchState(status, storage = window.sessionStorage) {
  try {
    const saved = JSON.parse(storage.getItem(`${STORAGE_PREFIX}${status}`))
    const filters = normalizeFilters(saved?.filters)

    return {
      filters,
      activeFilters: normalizeFilters(saved?.activeFilters ?? filters),
      activeRegion: normalizeRegion(saved?.activeRegion),
      isAdvancedOpen: Boolean(saved?.isAdvancedOpen),
      radius: [10, 25, 50, 100].includes(saved?.radius) ? saved.radius : 50,
      resolvedOrigin: saved?.resolvedOrigin && typeof saved.resolvedOrigin === 'object'
        ? saved.resolvedOrigin
        : null,
    }
  } catch {
    return {
      filters: { ...emptyFilters },
      activeFilters: { ...emptyFilters },
      activeRegion: null,
      isAdvancedOpen: false,
      radius: 50,
      resolvedOrigin: null,
    }
  }
}

export function storePetSearchState(status, state, storage = window.sessionStorage) {
  try {
    storage.setItem(`${STORAGE_PREFIX}${status}`, JSON.stringify(state))
  } catch {
    // Search remains usable when browser storage is unavailable.
  }
}

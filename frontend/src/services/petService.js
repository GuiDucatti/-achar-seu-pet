import api from '../api/api.js'

function buildPetFormData(data) {
  const formData = new FormData()

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      formData.append(key, value)
    }
  })

  return formData
}

function normalizePetPage(data, itemsKey = 'results') {
  const items = data?.[itemsKey] ?? []
  return {
    count: data?.count ?? items.length,
    hasNext: Boolean(data?.next),
    items,
  }
}

export async function listPets(params = {}) {
  const response = await api.get('/pets/', { params })
  return normalizePetPage(response.data)
}

export async function listMyPets() {
  const response = await api.get('/pets/meus/')
  return response.data
}

export async function listNearbyPets(data, page = 1) {
  const response = await api.post('/pets/proximos/', data, { params: { page } })
  return {
    ...normalizePetPage(response.data, 'resultados'),
    origem: response.data.origem,
  }
}

export async function suggestAddresses(query, signal) {
  const response = await api.get('/pets/sugestoes-endereco/', {
    params: { q: query },
    signal,
  })
  return response.data
}

export async function getPet(id) {
  const response = await api.get(`/pets/${id}/`)
  return response.data
}

export async function createPet(data) {
  const response = await api.post('/pets/', buildPetFormData(data), {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

export async function updatePet(id, data) {
  const response = await api.patch(`/pets/${id}/`, buildPetFormData(data), {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

export async function deletePet(id) {
  await api.delete(`/pets/${id}/`)
}

export async function createSighting(id, data) {
  const response = await api.post(`/pets/${id}/avistamentos/`, data)
  return response.data
}

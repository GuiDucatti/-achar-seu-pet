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

export async function listPets(params = {}) {
  const response = await api.get('/pets/', { params })
  return response.data
}

export async function listNearbyPets(data) {
  const response = await api.post('/pets/proximos/', data)
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

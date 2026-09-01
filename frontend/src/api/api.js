import axios from 'axios'
import { clearAuthTokens, getStoredAccessToken } from '../utils/authStorage.js'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

api.interceptors.request.use((config) => {
  const token = getStoredAccessToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuthTokens()

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth:expired'))
      }
    }

    return Promise.reject(error)
  },
)

export default api

import axios from 'axios'
import {
  clearAuthTokens,
  getStoredAccessToken,
  getStoredRefreshToken,
  storeAccessToken,
  storeAuthTokens,
} from '../utils/authStorage.js'

const AUTH_ENDPOINTS = ['/auth/token/', '/auth/token/refresh/']

function isAuthenticationRequest(config) {
  return AUTH_ENDPOINTS.some((endpoint) => config.url?.endsWith(endpoint))
}

function isDefinitiveRefreshRejection(error) {
  return [400, 401, 403].includes(error.response?.status)
}

export function createApiClient({
  baseURL = import.meta.env?.VITE_API_URL,
  adapter,
} = {}) {
  const clientOptions = adapter ? { baseURL, adapter } : { baseURL }
  const api = axios.create(clientOptions)
  const refreshApi = axios.create(clientOptions)
  let refreshPromise = null
  let expirationEventDispatched = false

  function expireSession() {
    clearAuthTokens()

    if (expirationEventDispatched) return

    expirationEventDispatched = true

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('auth:expired'))
    }
  }

  function refreshAccessToken() {
    if (refreshPromise) return refreshPromise

    const refreshToken = getStoredRefreshToken()

    if (!refreshToken) {
      expireSession()
      return Promise.reject(new Error('Refresh token indisponível.'))
    }

    refreshPromise = refreshApi
      .post('/auth/token/refresh/', { refresh: refreshToken })
      .then((response) => {
        const accessToken = response.data?.access

        if (!accessToken) {
          throw new Error('Resposta de renovação sem access token.')
        }

        if (getStoredRefreshToken() !== refreshToken) {
          throw new Error('A sessão mudou durante a renovação.')
        }

        if (response.data.refresh) {
          storeAuthTokens({ access: accessToken, refresh: response.data.refresh })
        } else {
          storeAccessToken(accessToken)
        }

        expirationEventDispatched = false

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('auth:refreshed'))
        }

        return accessToken
      })
      .catch((error) => {
        if (
          getStoredRefreshToken() === refreshToken &&
          isDefinitiveRefreshRejection(error)
        ) {
          expireSession()
        }

        throw error
      })
      .finally(() => {
        refreshPromise = null
      })

    return refreshPromise
  }

  api.interceptors.request.use((config) => {
    const token = getStoredAccessToken()
    config._authAccessToken = token
    config._authRefreshToken = getStoredRefreshToken()

    if (token) {
      expirationEventDispatched = false
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  })

  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config

      if (error.response?.status !== 401 || !originalRequest) {
        return Promise.reject(error)
      }

      if (isAuthenticationRequest(originalRequest)) {
        return Promise.reject(error)
      }

      if (originalRequest._retry) {
        const requestStillBelongsToCurrentSession =
          getStoredAccessToken() === originalRequest._authAccessToken &&
          getStoredRefreshToken() === originalRequest._authRefreshToken

        if (requestStillBelongsToCurrentSession) {
          expireSession()
        }

        return Promise.reject(error)
      }

      originalRequest._retry = true

      const currentAccessToken = getStoredAccessToken()

      if (currentAccessToken && currentAccessToken !== originalRequest._authAccessToken) {
        if (getStoredRefreshToken() !== originalRequest._authRefreshToken) {
          return Promise.reject(error)
        }

        originalRequest.headers.Authorization = `Bearer ${currentAccessToken}`
        return api(originalRequest)
      }

      try {
        const accessToken = await refreshAccessToken()
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return api(originalRequest)
      } catch {
        return Promise.reject(error)
      }
    },
  )

  return api
}

const api = createApiClient()

export default api

import { useEffect, useMemo, useState } from 'react'
import api from '../api/api.js'
import {
  clearAuthTokens,
  getStoredAccessToken,
  getStoredRefreshToken,
  storeAuthTokens,
} from '../utils/authStorage.js'
import AuthContext from './authContext.js'

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(() => getStoredAccessToken())
  const [refreshToken, setRefreshToken] = useState(() => getStoredRefreshToken())
  const [user, setUser] = useState(null)
  const [isLoadingUser, setIsLoadingUser] = useState(Boolean(accessToken))
  const isAuthenticated = Boolean(accessToken)

  function storeTokens(tokens) {
    storeAuthTokens(tokens)
    setAccessToken(tokens.access)
    setRefreshToken(tokens.refresh)
  }

  function clearSession() {
    clearAuthTokens()
    setAccessToken(null)
    setRefreshToken(null)
    setUser(null)
  }

  async function fetchCurrentUser() {
    const response = await api.get('/auth/me/')
    setUser(response.data)
    return response.data
  }

  async function login(credentials) {
    const response = await api.post('/auth/token/', credentials)
    storeTokens(response.data)
    return fetchCurrentUser()
  }

  async function register(data) {
    await api.post('/auth/register/', data)
    return login({
      username: data.email || data.username,
      password: data.password,
    })
  }

  function logout() {
    clearSession()
  }

  useEffect(() => {
    function handleAuthExpired() {
      clearSession()
    }

    function handleAuthRefreshed() {
      setAccessToken(getStoredAccessToken())
      setRefreshToken(getStoredRefreshToken())
    }

    window.addEventListener('auth:expired', handleAuthExpired)
    window.addEventListener('auth:refreshed', handleAuthRefreshed)

    return () => {
      window.removeEventListener('auth:expired', handleAuthExpired)
      window.removeEventListener('auth:refreshed', handleAuthRefreshed)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    let isMounted = true

    async function loadUser() {
      try {
        setIsLoadingUser(true)
        const response = await api.get('/auth/me/')

        if (isMounted) {
          setUser(response.data)
        }
      } catch (err) {
        console.error(err)

        if (isMounted) {
          clearSession()
        }
      } finally {
        if (isMounted) {
          setIsLoadingUser(false)
        }
      }
    }

    loadUser()

    return () => {
      isMounted = false
    }
  }, [isAuthenticated])

  const value = useMemo(
    () => ({
      accessToken,
      refreshToken,
      user,
      isAuthenticated,
      isLoadingUser,
      login,
      logout,
      register,
    }),
    [accessToken, refreshToken, user, isAuthenticated, isLoadingUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

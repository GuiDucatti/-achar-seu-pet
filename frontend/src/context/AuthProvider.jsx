import { useEffect, useMemo, useRef, useState } from 'react'
import api from '../api/api.js'
import {
  clearAuthTokens,
  getStoredAccessToken,
  getStoredRefreshToken,
  isAuthStorageKey,
  storeAuthTokens,
} from '../utils/authStorage.js'
import AuthContext from './authContext.js'

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(() => getStoredAccessToken())
  const [refreshToken, setRefreshToken] = useState(() => getStoredRefreshToken())
  const [user, setUser] = useState(null)
  const [isLoadingUser, setIsLoadingUser] = useState(Boolean(accessToken))
  const [externalSessionVersion, setExternalSessionVersion] = useState(0)
  const accessTokenRef = useRef(accessToken)
  const skipUserLoadForAccessTokenRef = useRef(null)
  const isAuthenticated = Boolean(accessToken)

  function storeTokens(tokens) {
    storeAuthTokens(tokens)
    accessTokenRef.current = tokens.access
    setAccessToken(tokens.access)
    setRefreshToken(tokens.refresh)
  }

  function clearSession() {
    clearAuthTokens()
    accessTokenRef.current = null
    skipUserLoadForAccessTokenRef.current = null
    setAccessToken(null)
    setRefreshToken(null)
    setUser(null)
    setIsLoadingUser(false)
  }

  async function fetchCurrentUser(expectedRefreshToken) {
    const response = await api.get('/auth/me/')

    if (expectedRefreshToken && getStoredRefreshToken() !== expectedRefreshToken) {
      return null
    }

    setUser(response.data)
    return response.data
  }

  async function login(credentials) {
    const response = await api.post('/auth/token/', credentials)
    skipUserLoadForAccessTokenRef.current = response.data.access
    storeTokens(response.data)

    try {
      return await fetchCurrentUser(response.data.refresh)
    } catch (error) {
      if (
        getStoredRefreshToken() === response.data.refresh &&
        [401, 403].includes(error.response?.status)
      ) {
        clearSession()
      }

      throw error
    }
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
    function syncStoredSession({ reloadUser = false } = {}) {
      const nextAccessToken = getStoredAccessToken()
      const accessTokenChanged = nextAccessToken !== accessTokenRef.current
      accessTokenRef.current = nextAccessToken
      setAccessToken(nextAccessToken)
      setRefreshToken(getStoredRefreshToken())

      if (!nextAccessToken) {
        setUser(null)
        setIsLoadingUser(false)
      } else if (reloadUser && accessTokenChanged) {
        skipUserLoadForAccessTokenRef.current = null
        setUser(null)
        setIsLoadingUser(true)
        setExternalSessionVersion((current) => current + 1)
      }
    }

    function handleAuthExpired() {
      clearSession()
    }

    function handleAuthRefreshed() {
      syncStoredSession()
    }

    function handleStorage(event) {
      if (!isAuthStorageKey(event.key)) return
      if (event.storageArea && event.storageArea !== window.localStorage) return

      syncStoredSession({ reloadUser: true })
    }

    window.addEventListener('auth:expired', handleAuthExpired)
    window.addEventListener('auth:refreshed', handleAuthRefreshed)
    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener('auth:expired', handleAuthExpired)
      window.removeEventListener('auth:refreshed', handleAuthRefreshed)
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    if (skipUserLoadForAccessTokenRef.current === getStoredAccessToken()) {
      skipUserLoadForAccessTokenRef.current = null
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

        if (isMounted && [401, 403].includes(err.response?.status)) {
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
  }, [externalSessionVersion, isAuthenticated])

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

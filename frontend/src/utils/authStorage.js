const ACCESS_TOKEN_KEY = 'acharSeuPet.accessToken'
const REFRESH_TOKEN_KEY = 'acharSeuPet.refreshToken'

export function getStoredAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getStoredRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function storeAuthTokens(tokens) {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access)
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh)
}

export function clearAuthTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

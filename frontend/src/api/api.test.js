import assert from 'node:assert/strict'
import test from 'node:test'
import { createApiClient } from './api.js'
import {
  getStoredAccessToken,
  getStoredRefreshToken,
  storeAuthTokens,
} from '../utils/authStorage.js'

function installBrowserStorage() {
  const values = new Map()
  globalThis.localStorage = {
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, String(value)),
  }
  globalThis.window = new EventTarget()
}

function unauthorized(config) {
  return Promise.reject({
    config,
    response: { status: 401 },
  })
}

test.beforeEach(() => {
  installBrowserStorage()
})

test('shares one refresh request and retries concurrent requests with the new token', async () => {
  storeAuthTokens({ access: 'expired-access', refresh: 'valid-refresh' })
  let refreshCalls = 0
  let protectedCalls = 0

  const api = createApiClient({
    adapter: async (config) => {
      if (config.url === '/auth/token/refresh/') {
        refreshCalls += 1
        await new Promise((resolve) => setTimeout(resolve, 5))
        return { config, data: { access: 'renewed-access' }, headers: {}, status: 200 }
      }

      protectedCalls += 1
      if (config.headers.Authorization !== 'Bearer renewed-access') {
        return unauthorized(config)
      }

      return { config, data: { ok: true }, headers: {}, status: 200 }
    },
  })

  const responses = await Promise.all([api.get('/protected/one'), api.get('/protected/two')])

  assert.equal(refreshCalls, 1)
  assert.equal(protectedCalls, 4)
  assert.equal(getStoredAccessToken(), 'renewed-access')
  assert.deepEqual(responses.map((response) => response.data), [{ ok: true }, { ok: true }])
})

test('clears the session once when refresh fails', async () => {
  storeAuthTokens({ access: 'expired-access', refresh: 'invalid-refresh' })
  let expirationEvents = 0
  window.addEventListener('auth:expired', () => {
    expirationEvents += 1
  })

  const api = createApiClient({
    adapter: (config) => unauthorized(config),
  })

  await assert.rejects(api.get('/protected/'))

  assert.equal(getStoredAccessToken(), null)
  assert.equal(getStoredRefreshToken(), null)
  assert.equal(expirationEvents, 1)
})

test('does not try to refresh a rejected login request', async () => {
  storeAuthTokens({ access: 'old-access', refresh: 'old-refresh' })
  let refreshCalls = 0

  const api = createApiClient({
    adapter: (config) => {
      if (config.url === '/auth/token/refresh/') refreshCalls += 1
      return unauthorized(config)
    },
  })

  await assert.rejects(api.post('/auth/token/', { username: 'wrong', password: 'wrong' }))

  assert.equal(refreshCalls, 0)
  assert.equal(getStoredRefreshToken(), 'old-refresh')
})

test('does not restore a session that was cleared during refresh', async () => {
  storeAuthTokens({ access: 'expired-access', refresh: 'valid-refresh' })
  let releaseRefresh

  const api = createApiClient({
    adapter: (config) => {
      if (config.url === '/auth/token/refresh/') {
        return new Promise((resolve) => {
          releaseRefresh = () =>
            resolve({ config, data: { access: 'renewed-access' }, headers: {}, status: 200 })
        })
      }

      return unauthorized(config)
    },
  })

  const request = api.get('/protected/')
  await new Promise((resolve) => setTimeout(resolve, 0))
  localStorage.clear?.()
  localStorage.removeItem('acharSeuPet.accessToken')
  localStorage.removeItem('acharSeuPet.refreshToken')
  releaseRefresh()

  await assert.rejects(request)
  assert.equal(getStoredAccessToken(), null)
  assert.equal(getStoredRefreshToken(), null)
})

test('expires the session when a retried request is still unauthorized', async () => {
  storeAuthTokens({ access: 'expired-access', refresh: 'valid-refresh' })
  let refreshCalls = 0
  let expirationEvents = 0
  window.addEventListener('auth:expired', () => {
    expirationEvents += 1
  })

  const api = createApiClient({
    adapter: (config) => {
      if (config.url === '/auth/token/refresh/') {
        refreshCalls += 1
        return Promise.resolve({
          config,
          data: { access: 'renewed-but-rejected' },
          headers: {},
          status: 200,
        })
      }

      return unauthorized(config)
    },
  })

  await assert.rejects(api.get('/protected/'))

  assert.equal(refreshCalls, 1)
  assert.equal(expirationEvents, 1)
  assert.equal(getStoredAccessToken(), null)
  assert.equal(getStoredRefreshToken(), null)
})

test('retries a delayed 401 with the token already refreshed by another request', async () => {
  storeAuthTokens({ access: 'expired-access', refresh: 'valid-refresh' })
  let refreshCalls = 0
  let delayedRequestCalls = 0

  const api = createApiClient({
    adapter: async (config) => {
      if (config.url === '/auth/token/refresh/') {
        refreshCalls += 1
        return { config, data: { access: 'renewed-access' }, headers: {}, status: 200 }
      }

      if (config.url === '/protected/delayed') {
        delayedRequestCalls += 1

        if (delayedRequestCalls === 1) {
          await new Promise((resolve) => setTimeout(resolve, 20))
          return unauthorized(config)
        }
      }

      if (config.headers.Authorization !== 'Bearer renewed-access') {
        return unauthorized(config)
      }

      return { config, data: { ok: true }, headers: {}, status: 200 }
    },
  })

  const responses = await Promise.all([
    api.get('/protected/immediate'),
    api.get('/protected/delayed'),
  ])

  assert.equal(refreshCalls, 1)
  assert.equal(delayedRequestCalls, 2)
  assert.deepEqual(responses.map((response) => response.data), [{ ok: true }, { ok: true }])
})

test('does not clear a newer session after an old retry receives a late 401', async () => {
  storeAuthTokens({ access: 'expired-access', refresh: 'old-refresh' })
  let releaseRetry
  let retryStarted
  const retryIsPending = new Promise((resolve) => {
    retryStarted = resolve
  })

  const api = createApiClient({
    adapter: (config) => {
      if (config.url === '/auth/token/refresh/') {
        return Promise.resolve({
          config,
          data: { access: 'renewed-old-access' },
          headers: {},
          status: 200,
        })
      }

      if (config.headers.Authorization === 'Bearer renewed-old-access') {
        retryStarted()
        return new Promise((resolve, reject) => {
          releaseRetry = () => reject({ config, response: { status: 401 } })
        })
      }

      return unauthorized(config)
    },
  })

  const request = api.get('/protected/')
  await retryIsPending
  storeAuthTokens({ access: 'new-session-access', refresh: 'new-session-refresh' })
  releaseRetry()

  await assert.rejects(request)
  assert.equal(getStoredAccessToken(), 'new-session-access')
  assert.equal(getStoredRefreshToken(), 'new-session-refresh')
})

test('does not replay an old mutation as a newly authenticated user', async () => {
  storeAuthTokens({ access: 'old-access', refresh: 'old-refresh' })
  let releaseOldRequest
  let oldRequestStarted
  let mutationCalls = 0
  const requestIsPending = new Promise((resolve) => {
    oldRequestStarted = resolve
  })

  const api = createApiClient({
    adapter: (config) => {
      mutationCalls += 1

      if (config.headers.Authorization === 'Bearer old-access') {
        oldRequestStarted()
        return new Promise((resolve, reject) => {
          releaseOldRequest = () => reject({ config, response: { status: 401 } })
        })
      }

      return Promise.resolve({ config, data: { changed: true }, headers: {}, status: 200 })
    },
  })

  const request = api.post('/pets/123/action/', { status: 'encontrado' })
  await requestIsPending
  storeAuthTokens({ access: 'new-access', refresh: 'new-refresh' })
  releaseOldRequest()

  await assert.rejects(request)
  assert.equal(mutationCalls, 1)
  assert.equal(getStoredAccessToken(), 'new-access')
  assert.equal(getStoredRefreshToken(), 'new-refresh')
})

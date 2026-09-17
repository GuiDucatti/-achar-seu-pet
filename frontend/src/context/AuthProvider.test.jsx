import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../api/api.js'
import { useAuth } from '../hooks/useAuth.js'
import { AuthProvider } from './AuthProvider.jsx'

vi.mock('../api/api.js', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

function AuthState() {
  const { isAuthenticated, isLoadingUser, user } = useAuth()

  if (isLoadingUser) return <p>Carregando sessao</p>

  return <p>{isAuthenticated ? `Autenticado: ${user?.username || 'carregando'}` : 'Visitante'}</p>
}

function LoginTrigger() {
  const { login } = useAuth()
  return (
    <button onClick={() => login({ username: 'gui', password: 'senha' })} type="button">
      Entrar
    </button>
  )
}

function dispatchStorageChange(key) {
  const event = new Event('storage')
  Object.defineProperty(event, 'key', { value: key })
  window.dispatchEvent(event)
}

function installBrowserStorage() {
  const values = new Map()
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      clear: () => values.clear(),
      getItem: (key) => values.get(key) ?? null,
      removeItem: (key) => values.delete(key),
      setItem: (key, value) => values.set(key, String(value)),
    },
  })
}

beforeEach(() => {
  installBrowserStorage()
  window.localStorage.clear()
  api.get.mockResolvedValue({ data: { id: 1, username: 'gui' } })
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  window.localStorage.clear()
})

describe('AuthProvider entre abas', () => {
  it('encerra o estado local quando outra aba remove os tokens', async () => {
    window.localStorage.setItem('acharSeuPet.accessToken', 'access-token')
    window.localStorage.setItem('acharSeuPet.refreshToken', 'refresh-token')
    render(
      <AuthProvider>
        <AuthState />
      </AuthProvider>,
    )

    await screen.findByText('Autenticado: gui')

    act(() => {
      window.localStorage.clear()
      dispatchStorageChange(null)
    })

    expect(screen.getByText('Visitante')).toBeTruthy()
  })

  it('carrega o usuario quando outra aba inicia uma sessao', async () => {
    render(
      <AuthProvider>
        <AuthState />
      </AuthProvider>,
    )
    expect(screen.getByText('Visitante')).toBeTruthy()

    act(() => {
      window.localStorage.setItem('acharSeuPet.accessToken', 'new-access-token')
      window.localStorage.setItem('acharSeuPet.refreshToken', 'new-refresh-token')
      dispatchStorageChange('acharSeuPet.accessToken')
    })

    await waitFor(() => expect(screen.getByText('Autenticado: gui')).toBeTruthy())
    expect(api.get).toHaveBeenCalledTimes(1)
    expect(api.get).toHaveBeenCalledWith('/auth/me/')
  })

  it('preserva a sessao quando o carregamento do usuario falha pela rede', async () => {
    window.localStorage.setItem('acharSeuPet.accessToken', 'access-token')
    window.localStorage.setItem('acharSeuPet.refreshToken', 'refresh-token')
    api.get.mockRejectedValue({ code: 'ERR_NETWORK' })

    render(
      <AuthProvider>
        <AuthState />
      </AuthProvider>,
    )

    await screen.findByText('Autenticado: carregando')
    expect(window.localStorage.getItem('acharSeuPet.accessToken')).toBe('access-token')
    expect(window.localStorage.getItem('acharSeuPet.refreshToken')).toBe('refresh-token')
  })

  it('substitui os dados do usuario quando outra aba troca de conta', async () => {
    window.localStorage.setItem('acharSeuPet.accessToken', 'account-a-access')
    window.localStorage.setItem('acharSeuPet.refreshToken', 'account-a-refresh')
    api.get
      .mockResolvedValueOnce({ data: { id: 1, username: 'conta-a' } })
      .mockResolvedValueOnce({ data: { id: 2, username: 'conta-b' } })
    render(
      <AuthProvider>
        <AuthState />
      </AuthProvider>,
    )

    await screen.findByText('Autenticado: conta-a')

    act(() => {
      window.localStorage.setItem('acharSeuPet.accessToken', 'account-b-access')
      window.localStorage.setItem('acharSeuPet.refreshToken', 'account-b-refresh')
      dispatchStorageChange('acharSeuPet.accessToken')
    })

    await screen.findByText('Autenticado: conta-b')
    expect(api.get).toHaveBeenCalledTimes(2)
  })

  it('sai do carregamento quando outra aba encerra uma sessao pendente', async () => {
    window.localStorage.setItem('acharSeuPet.accessToken', 'pending-access')
    window.localStorage.setItem('acharSeuPet.refreshToken', 'pending-refresh')
    api.get.mockReturnValue(new Promise(() => {}))
    render(
      <AuthProvider>
        <AuthState />
      </AuthProvider>,
    )

    await screen.findByText('Carregando sessao')

    act(() => {
      window.localStorage.clear()
      dispatchStorageChange(null)
    })

    expect(screen.getByText('Visitante')).toBeTruthy()
  })

  it('consulta o usuario uma unica vez durante login local', async () => {
    api.post.mockResolvedValue({
      data: { access: 'login-access', refresh: 'login-refresh' },
    })
    render(
      <AuthProvider>
        <LoginTrigger />
        <AuthState />
      </AuthProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    await screen.findByText('Autenticado: gui')
    expect(api.get).toHaveBeenCalledTimes(1)
  })

  it('ignora a resposta do login antigo depois de uma troca externa de conta', async () => {
    let resolveOldUser
    api.post.mockResolvedValue({
      data: { access: 'old-login-access', refresh: 'old-login-refresh' },
    })
    api.get
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveOldUser = resolve
          }),
      )
      .mockResolvedValueOnce({ data: { id: 2, username: 'conta-nova' } })
    render(
      <AuthProvider>
        <LoginTrigger />
        <AuthState />
      </AuthProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(1))

    act(() => {
      window.localStorage.setItem('acharSeuPet.accessToken', 'new-account-access')
      window.localStorage.setItem('acharSeuPet.refreshToken', 'new-account-refresh')
      dispatchStorageChange('acharSeuPet.accessToken')
    })

    await screen.findByText('Autenticado: conta-nova')

    await act(async () => {
      resolveOldUser({ data: { id: 1, username: 'conta-antiga' } })
    })

    expect(screen.getByText('Autenticado: conta-nova')).toBeTruthy()
    expect(screen.queryByText('Autenticado: conta-antiga')).toBeNull()
  })
})

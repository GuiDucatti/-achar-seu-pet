import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import ProtectedRoute from './ProtectedRoute.jsx'

vi.mock('../hooks/useAuth.js', () => ({
  useAuth: vi.fn(),
}))

function LoginDestination() {
  const location = useLocation()
  return <p>Login vindo de {location.state?.from?.pathname || 'origem desconhecida'}</p>
}

function renderProtectedRoute(authState) {
  useAuth.mockReturnValue(authState)

  return render(
    <MemoryRouter initialEntries={['/minha-conta']}>
      <Routes>
        <Route path="/login" element={<LoginDestination />} />
        <Route
          path="/minha-conta"
          element={
            <ProtectedRoute>
              <p>Conteudo privado</p>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>,
  )
}

afterEach(() => {
  cleanup()
})

describe('ProtectedRoute', () => {
  it('mantem o conteudo protegido oculto enquanto verifica a sessao', () => {
    renderProtectedRoute({ isAuthenticated: false, isLoadingUser: true })

    expect(screen.getByText('Verificando sessão...')).toBeTruthy()
    expect(screen.queryByText('Conteudo privado')).toBeNull()
  })

  it('redireciona visitante para login preservando a pagina de origem', () => {
    renderProtectedRoute({ isAuthenticated: false, isLoadingUser: false })

    expect(screen.getByText('Login vindo de /minha-conta')).toBeTruthy()
    expect(screen.queryByText('Conteudo privado')).toBeNull()
  })

  it('renderiza o conteudo para usuario autenticado', () => {
    renderProtectedRoute({ isAuthenticated: true, isLoadingUser: false })

    expect(screen.getByText('Conteudo privado')).toBeTruthy()
  })
})

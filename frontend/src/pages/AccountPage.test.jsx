import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { listMyPets } from '../services/petService.js'
import AccountPage from './AccountPage.jsx'

vi.mock('../hooks/useAuth.js', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../services/petService.js', () => ({
  listMyPets: vi.fn(),
}))

const pet = {
  id: 7,
  nome: 'Lobinha',
  foto: '/media/pets/lobinha.webp',
  estado: 'SP',
  cidade: 'Campinas',
  data_desaparecimento: '2026-08-01',
  status: 'P',
  is_demo: false,
  distancia_aproximada_km: null,
}

function renderPage() {
  useAuth.mockReturnValue({
    user: { username: 'gui', email: 'gui@example.com' },
  })

  return render(
    <MemoryRouter>
      <AccountPage />
    </MemoryRouter>,
  )
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('AccountPage', () => {
  it('carrega os pets publicados e leva ao cadastro completo', async () => {
    listMyPets.mockResolvedValue([pet])

    renderPage()

    expect(screen.getByText('Carregando seus pets...')).toBeTruthy()
    expect(await screen.findByText('Lobinha')).toBeTruthy()
    expect(screen.getByRole('link', { name: /ver cadastro/i }).getAttribute('href')).toBe('/pets/7')
  })

  it('mostra uma acao de cadastro quando o usuario ainda nao publicou pets', async () => {
    listMyPets.mockResolvedValue([])

    renderPage()

    expect(await screen.findByText('Você ainda não cadastrou nenhum pet.')).toBeTruthy()
    expect(screen.getByRole('link', { name: /cadastrar meu primeiro pet/i }).getAttribute('href')).toBe('/cadastrar-pet')
  })

  it('permite tentar novamente depois de uma falha', async () => {
    const user = userEvent.setup()
    listMyPets
      .mockRejectedValueOnce({ response: { status: 500 } })
      .mockResolvedValueOnce([pet])

    renderPage()

    expect(await screen.findByRole('alert')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: /tentar novamente/i }))

    await waitFor(() => expect(listMyPets).toHaveBeenCalledTimes(2))
    expect(await screen.findByText('Lobinha')).toBeTruthy()
  })
})

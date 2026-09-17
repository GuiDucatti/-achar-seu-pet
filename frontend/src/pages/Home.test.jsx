import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { listPets } from '../services/petService.js'
import Home from './Home.jsx'

vi.mock('../services/petService.js', () => ({
  listPets: vi.fn(),
}))

vi.mock('../components/PetCard.jsx', () => ({
  default: ({ pet }) => <article>{pet.nome}</article>,
}))

vi.mock('gsap', () => ({
  gsap: {
    context: () => ({ revert: vi.fn() }),
    registerPlugin: vi.fn(),
  },
}))

vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: {},
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('Home', () => {
  it('exibe os pets recentes da resposta paginada', async () => {
    listPets.mockResolvedValue({
      count: 1,
      hasNext: false,
      items: [{ id: 1, nome: 'Lobinha' }],
    })

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    )

    expect(await screen.findByText('Lobinha')).toBeTruthy()
    expect(screen.queryByText('Não foi possível carregar os pets recentes.')).toBeNull()
  })
})

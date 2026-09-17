import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../api/api.js'
import { listNearbyPets, listPets } from './petService.js'

vi.mock('../api/api.js', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('paginação de pets', () => {
  it('normaliza a resposta paginada da listagem', async () => {
    api.get.mockResolvedValue({
      data: {
        count: 30,
        next: 'http://api.test/pets/?page=2',
        previous: null,
        results: [{ id: 1 }],
      },
    })

    await expect(listPets({ page: 1 })).resolves.toEqual({
      count: 30,
      hasNext: true,
      items: [{ id: 1 }],
    })
  })

  it('envia a página separadamente na busca regional', async () => {
    api.post.mockResolvedValue({
      data: {
        count: 25,
        next: null,
        origem: { rotulo: 'Sua localização' },
        resultados: [{ id: 2 }],
      },
    })

    await expect(listNearbyPets({ raio_km: 10 }, 2)).resolves.toEqual({
      count: 25,
      hasNext: false,
      items: [{ id: 2 }],
      origem: { rotulo: 'Sua localização' },
    })
    expect(api.post).toHaveBeenCalledWith(
      '/pets/proximos/',
      { raio_km: 10 },
      { params: { page: 2 } },
    )
  })
})

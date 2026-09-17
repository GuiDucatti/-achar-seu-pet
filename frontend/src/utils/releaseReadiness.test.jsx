import { describe, expect, it } from 'vitest'
import { getApiFieldErrors } from './apiErrors.js'
import { formatDateTime } from './formatters.js'
import { getReturnPath } from './navigation.js'
import { readPetSearchState, storePetSearchState } from './petSearchState.js'

function createStorage() {
  const values = new Map()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  }
}

describe('utilitários de prontidão para publicação', () => {
  it('preserva filtros e região da busca na sessão atual', () => {
    const storage = createStorage()
    const state = {
      filters: { cidade: 'Braúna', estado: 'SP', busca: 'coleira azul' },
      activeFilters: { cidade: 'Braúna', estado: 'SP', busca: 'coleira azul' },
      activeRegion: { type: 'city', city: 'Braúna', state: 'SP' },
      isAdvancedOpen: true,
      radius: 25,
      resolvedOrigin: { rotulo: 'Braúna/SP' },
    }

    storePetSearchState('P', state, storage)

    expect(readPetSearchState('P', storage)).toMatchObject(state)
  })

  it('ignora estado de busca inválido', () => {
    const storage = createStorage()
    storage.setItem('acharSeuPet.search.P', '{invalido')

    expect(readPetSearchState('P', storage)).toMatchObject({
      activeRegion: null,
      radius: 50,
      filters: { cidade: '', estado: '' },
    })
  })

  it('preserva caminho, query e hash no retorno da autenticação', () => {
    expect(getReturnPath({ pathname: '/pets/12', search: '?origem=conta', hash: '#mapa' })).toBe(
      '/pets/12?origem=conta#mapa',
    )
    expect(getReturnPath({ pathname: '//site-externo.test' })).toBe('/minha-conta')
  })

  it('extrai mensagens de validação por campo', () => {
    const error = {
      response: {
        data: {
          contato: ['Certifique-se de que este campo não tenha mais de 20 caracteres.'],
          detail: 'Erro geral',
        },
      },
    }

    expect(getApiFieldErrors(error)).toEqual({
      contato: 'Certifique-se de que este campo não tenha mais de 20 caracteres.',
    })
  })

  it('formata data e hora no fuso local do navegador', () => {
    const value = '2026-09-17T15:30:00Z'
    const expected = new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(value))

    expect(formatDateTime(value)).toBe(expected)
  })
})

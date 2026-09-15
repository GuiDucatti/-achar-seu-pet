import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useState } from 'react'
import { suggestAddresses } from '../services/petService.js'
import AddressAutocomplete from './AddressAutocomplete.jsx'

vi.mock('../services/petService.js', () => ({
  suggestAddresses: vi.fn(),
}))

function AutocompleteHarness({ onSelect = () => {} }) {
  const [value, setValue] = useState('')

  return (
    <AddressAutocomplete
      id="local"
      label="Local"
      onChange={setValue}
      onSelect={(suggestion) => {
        setValue(suggestion.rotulo)
        onSelect(suggestion)
      }}
      placeholder="Digite um endereco"
      value={value}
    />
  )
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  vi.useRealTimers()
})

describe('AddressAutocomplete', () => {
  it('nao consulta o servico antes de tres caracteres', async () => {
    vi.useFakeTimers()
    render(<AutocompleteHarness />)

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Ru' } })
    await act(() => vi.advanceTimersByTimeAsync(500))

    expect(suggestAddresses).not.toHaveBeenCalled()
  })

  it('reinicia o debounce quando o texto muda antes de 450 ms', async () => {
    vi.useFakeTimers()
    suggestAddresses.mockResolvedValue([])
    render(<AutocompleteHarness />)
    const input = screen.getByRole('combobox')

    fireEvent.change(input, { target: { value: 'Rua A' } })
    await act(() => vi.advanceTimersByTimeAsync(300))
    fireEvent.change(input, { target: { value: 'Rua B' } })
    await act(() => vi.advanceTimersByTimeAsync(449))

    expect(suggestAddresses).not.toHaveBeenCalled()

    await act(() => vi.advanceTimersByTimeAsync(1))
    expect(suggestAddresses).toHaveBeenCalledTimes(1)
    expect(suggestAddresses).toHaveBeenCalledWith('Rua B', expect.any(AbortSignal))
  })

  it('cancela a busca anterior quando o texto muda', async () => {
    vi.useFakeTimers()
    let firstSignal

    suggestAddresses
      .mockImplementationOnce((query, signal) => {
        firstSignal = signal
        return new Promise((resolve, reject) => {
          signal.addEventListener('abort', () => {
            const error = new Error('cancelado')
            error.code = 'ERR_CANCELED'
            reject(error)
          })
        })
      })
      .mockResolvedValueOnce([])

    render(<AutocompleteHarness />)
    const input = screen.getByRole('combobox')

    fireEvent.change(input, { target: { value: 'Rua A' } })
    await act(() => vi.advanceTimersByTimeAsync(450))
    fireEvent.change(input, { target: { value: 'Rua AB' } })

    expect(firstSignal.aborted).toBe(true)

    await act(() => vi.advanceTimersByTimeAsync(450))
    expect(suggestAddresses).toHaveBeenCalledTimes(2)
    expect(suggestAddresses).toHaveBeenLastCalledWith('Rua AB', expect.any(AbortSignal))
  })

  it('mostra uma falha do servico sem perder o valor digitado', async () => {
    vi.useFakeTimers()
    const requestError = new Error('indisponivel')
    requestError.code = 'ERR_NETWORK'
    suggestAddresses.mockRejectedValue(requestError)
    render(<AutocompleteHarness />)

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Rua Central' } })
    await act(() => vi.advanceTimersByTimeAsync(450))

    expect(screen.getByRole('combobox').value).toBe('Rua Central')
    expect(screen.getByText('Não foi possível buscar endereços agora. Tente novamente.')).toBeTruthy()
  })

  it('permite escolher uma sugestao usando o teclado', async () => {
    const suggestion = {
      cidade: 'Bauru',
      estado: 'SP',
      latitude: -22.31,
      longitude: -49.06,
      rotulo: 'Rua das Flores, Bauru, SP',
    }
    const onSelect = vi.fn()
    const user = userEvent.setup()
    suggestAddresses.mockResolvedValue([suggestion])
    render(<AutocompleteHarness onSelect={onSelect} />)

    const input = screen.getByRole('combobox')
    await user.type(input, 'Rua das Flores')
    await waitFor(() => expect(screen.getByRole('option')).toBeTruthy(), { timeout: 1000 })
    await user.keyboard('{ArrowDown}{Enter}')

    expect(onSelect).toHaveBeenCalledWith(suggestion)
    expect(input.value).toBe(suggestion.rotulo)
  })
})

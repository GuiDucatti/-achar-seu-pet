import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import SightingForm from './SightingForm.jsx'

const pet = {
  contato: '(18) 99999-9999',
  foto: '/foto.webp',
  nome: 'Lobinha',
}

afterEach(cleanup)

describe('SightingForm', () => {
  it('leva o foco para a localização quando nenhuma sugestão foi escolhida', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()

    render(
      <SightingForm
        error=""
        isSubmitting={false}
        onClose={vi.fn()}
        onSubmit={onSubmit}
        pet={pet}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Registrar avistamento' }))

    expect(document.activeElement?.id).toBe('sighting-location')
    expect(screen.getByText('Digite o local e escolha uma das sugestões da cidade correta.')).toBeTruthy()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('limita o contato ao mesmo tamanho aceito pelo backend', () => {
    render(
      <SightingForm
        error=""
        isSubmitting={false}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        pet={pet}
      />,
    )

    expect(
      screen.getByPlaceholderText('Telefone ou WhatsApp para o responsável retornar').maxLength,
    ).toBe(100)
  })
})

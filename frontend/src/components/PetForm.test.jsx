import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import PetForm from './PetForm.jsx'

const validPet = {
  nome: 'Juremar',
  foto: 'http://127.0.0.1:8000/media/pets/juremar.jpg',
  especie: 'cachorro',
  raca: 'Sem raça definida',
  cor: 'Marrom',
  sexo: 'macho',
  caracteristicas: 'Coleira azul',
  endereco_texto: 'Rua Central, Braúna',
  cidade: 'Braúna',
  estado: 'SP',
  latitude: -21.5,
  longitude: -50.3,
  data_desaparecimento: '2026-09-16',
  descricao: 'Saiu pelo portão durante a tarde.',
  contato: 'Não disponível',
  status: 'P',
}

afterEach(cleanup)

describe('PetForm', () => {
  it('abre a etapa de contato sem enviar o formulário antecipadamente', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()

    render(
      <PetForm
        initialValues={validPet}
        isSubmitting={false}
        onSubmit={onSubmit}
        submitLabel="Salvar alterações"
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    await user.click(screen.getByRole('button', { name: 'Continuar' }))

    expect(screen.getByLabelText('Como entrar em contato')).toBeTruthy()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('leva o usuário ao campo rejeitado pelo backend', async () => {
    render(
      <PetForm
        initialValues={validPet}
        isSubmitting={false}
        onSubmit={vi.fn()}
        serverErrors={{ contato: 'O contato deve ter no máximo 20 caracteres.' }}
        submitLabel="Salvar alterações"
      />,
    )

    expect(
      (await screen.findByRole('textbox', { name: 'Como entrar em contato' })).getAttribute(
        'aria-invalid',
      ),
    ).toBe('true')
    expect(screen.getByText('O contato deve ter no máximo 20 caracteres.')).toBeTruthy()
  })
})

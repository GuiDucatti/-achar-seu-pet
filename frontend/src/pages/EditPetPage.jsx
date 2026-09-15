import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { HeartHandshake } from 'lucide-react'
import PetForm from '../components/PetForm.jsx'
import { getPet, updatePet } from '../services/petService.js'
import { getApiErrorMessage } from '../utils/apiErrors.js'

function EditPetPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [pet, setPet] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadPet() {
      try {
        setIsLoading(true)
        setPet(await getPet(id))
      } catch (err) {
        console.error(err)
        setError(getApiErrorMessage(err, 'Não foi possível carregar este cadastro.'))
      } finally {
        setIsLoading(false)
      }
    }

    loadPet()
  }, [id])

  async function handleSubmit(data) {
    try {
      setError('')
      setIsSubmitting(true)
      const updatedPet = await updatePet(id, data)
      navigate(`/pets/${updatedPet.id}`)
    } catch (err) {
      console.error(err)
      setError(getApiErrorMessage(err, 'Não foi possível salvar as alterações.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <p className="feedback">Carregando cadastro...</p>
  }

  if (error && !pet) {
    return <p className="feedback error">{error}</p>
  }

  return (
    <section className="form-view">
      <div className="page-heading form-heading">
        <h1>Cuide da história de {pet.nome}.</h1>
        <p>Atualize o que mudou e mantenha a rede acompanhando cada passo da busca.</p>
      </div>

      {error && <p className="feedback error">{error}</p>}

      <div className="form-layout">
        <div className="form-main">
          <PetForm
            initialValues={pet}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            submitLabel="Salvar alterações"
          />
        </div>
        <aside className="form-side-note edit-side-note">
          <img alt={`Foto atual de ${pet.nome}`} loading="lazy" src={pet.foto} />
          <div>
            <HeartHandshake aria-hidden="true" size={22} />
            <strong>Cada atualização ajuda.</strong>
            <p>
              Mudou a região, surgiu uma pista ou ele voltou? Atualize o cadastro para ninguém
              seguir uma informação antiga.
            </p>
          </div>
        </aside>
      </div>
    </section>
  )
}

export default EditPetPage

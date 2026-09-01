import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HeartHandshake } from 'lucide-react'
import petsRunningHero from '../assets/pets-running-hero.jpg'
import PetForm from '../components/PetForm.jsx'
import { createPet } from '../services/petService.js'
import { getApiErrorMessage } from '../utils/apiErrors.js'

function CreatePetPage() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(data) {
    try {
      setError('')
      setIsSubmitting(true)
      const pet = await createPet(data)
      navigate(`/pets/${pet.id}`)
    } catch (err) {
      console.error(err)
      setError(getApiErrorMessage(err, 'Nao foi possivel cadastrar o pet. Confira os campos.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="form-view">
      <div className="page-heading form-heading">
        <h1>Vamos ajudar esse pet a voltar para casa.</h1>
        <p>Conte a historia com calma. Quanto mais detalhes a rede tiver, mais facil fica reconhecer.</p>
      </div>

      {error && <p className="feedback error">{error}</p>}

      <div className="form-layout">
        <div className="form-main">
          <PetForm isSubmitting={isSubmitting} onSubmit={handleSubmit} submitLabel="Publicar busca" />
        </div>
        <aside className="form-side-note">
          <img alt="Cachorro e gato correndo juntos" src={petsRunningHero} />
          <div>
            <HeartHandshake aria-hidden="true" size={22} />
            <strong>Uma boa descricao vira reconhecimento.</strong>
            <p>A regiao sera mostrada de forma aproximada para manter todos seguros.</p>
          </div>
        </aside>
      </div>
    </section>
  )
}

export default CreatePetPage

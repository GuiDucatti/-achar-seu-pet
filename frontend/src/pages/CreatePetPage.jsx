import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HeartHandshake } from 'lucide-react'
import createPetImage from '../assets/editorial/create-pet.webp'
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
      setError(getApiErrorMessage(err, 'Não foi possível cadastrar o pet. Confira os campos.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="form-view">
      <div className="page-heading form-heading">
        <h1>Vamos ajudar esse pet a voltar para casa.</h1>
        <p>Conte a história com calma. Quanto mais detalhes a rede tiver, mais fácil fica reconhecer.</p>
      </div>

      {error && <p className="feedback error">{error}</p>}

      <div className="form-layout">
        <div className="form-main">
          <PetForm isSubmitting={isSubmitting} onSubmit={handleSubmit} submitLabel="Publicar busca" />
        </div>
        <aside className="form-side-note create-side-note">
          <img
            alt="Tutora acolhendo seu cachorro em uma rua residencial"
            decoding="async"
            height="800"
            loading="lazy"
            src={createPetImage}
            width="1200"
          />
          <div>
            <HeartHandshake aria-hidden="true" size={22} />
            <strong>Comece pela imagem que alguém reconheceria na rua.</strong>
            <p>Rosto, cor do pelo e marcas diferentes ajudam mais do que uma fotografia distante.</p>
          </div>
        </aside>
      </div>
    </section>
  )
}

export default CreatePetPage

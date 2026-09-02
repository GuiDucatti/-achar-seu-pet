import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { CheckCircle2, HeartHandshake, MapPin, Share2, Trash2 } from 'lucide-react'
import SightingForm from '../components/SightingForm.jsx'
import SightingTimeline from '../components/SightingTimeline.jsx'
import { useAuth } from '../hooks/useAuth.js'
import PetMap from '../components/PetMap.jsx'
import { createSighting, deletePet, getPet, updatePet } from '../services/petService.js'
import { getApiErrorMessage } from '../utils/apiErrors.js'
import { formatDate } from '../utils/formatters.js'

function PetDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [pet, setPet] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSightingOpen, setIsSightingOpen] = useState(false)
  const [isSubmittingSighting, setIsSubmittingSighting] = useState(false)
  const [sightingError, setSightingError] = useState('')
  const [sightingSuccess, setSightingSuccess] = useState('')
  const [sightings, setSightings] = useState([])
  const reduceMotion = useReducedMotion()

  const isOwner = user && pet && user.id === pet.autor
  const shareMessage = pet
    ? pet.status === 'P'
      ? `Ajude a encontrar o ${pet.nome}!\nDesapareceu em ${pet.cidade} - ${pet.estado}.\nVeja mais informacoes:\n${window.location.href}`
      : `${pet.nome} foi marcado como encontrado.\nConheca esta historia:\n${window.location.href}`
    : ''
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`

  useEffect(() => {
    let isMounted = true

    async function loadPet() {
      try {
        setIsLoading(true)
        const data = await getPet(id)

        if (isMounted) {
          setPet(data)
          setSightings(data.avistamentos || [])
          setError('')
        }
      } catch (err) {
        console.error(err)

        if (isMounted) {
          setError(getApiErrorMessage(err, 'Pet nao encontrado ou indisponivel.'))
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadPet()

    return () => {
      isMounted = false
    }
  }, [id])

  async function handleMarkFound() {
    try {
      const updatedPet = await updatePet(id, { status: 'E' })
      setPet(updatedPet)
    } catch (err) {
      console.error(err)
      setError(getApiErrorMessage(err, 'Nao foi possivel atualizar o status.'))
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm('Deseja excluir este cadastro?')

    if (!confirmed) {
      return
    }

    try {
      setIsDeleting(true)
      await deletePet(id)
      navigate('/pets')
    } catch (err) {
      console.error(err)
      setError(getApiErrorMessage(err, 'Nao foi possivel excluir este cadastro.'))
    } finally {
      setIsDeleting(false)
    }
  }

  async function handleSightingSubmit(data) {
    try {
      setSightingError('')
      setIsSubmittingSighting(true)
      const sighting = await createSighting(id, data)
      setSightings((currentSightings) => [sighting, ...currentSightings])
      setIsSightingOpen(false)
      setSightingSuccess('Avistamento registrado. Obrigado por ajudar nessa busca.')
    } catch (err) {
      console.error(err)
      setSightingError(
        getApiErrorMessage(err, 'Nao foi possivel registrar o avistamento. Confira as coordenadas.'),
      )
    } finally {
      setIsSubmittingSighting(false)
    }
  }

  if (isLoading) {
    return <p className="feedback">Carregando detalhes...</p>
  }

  if (error && !pet) {
    return <p className="feedback error">{error}</p>
  }

  return (
    <section className="detail-view">
      <AnimatePresence initial={false}>
        {error && (
          <motion.p animate={{ opacity: 1, y: 0 }} className="feedback error" exit={{ opacity: 0 }} initial={reduceMotion ? false : { opacity: 0, y: -3 }} transition={{ duration: reduceMotion ? 0 : 0.16 }}>
            {error}
          </motion.p>
        )}
        {sightingSuccess && (
          <motion.p animate={{ opacity: 1, y: 0 }} className="feedback success" exit={{ opacity: 0 }} initial={reduceMotion ? false : { opacity: 0, y: -3 }} transition={{ duration: reduceMotion ? 0 : 0.16 }}>
            {sightingSuccess}
          </motion.p>
        )}
      </AnimatePresence>

      <div className="detail-layout">
        <img className="detail-photo" src={pet.foto} alt={`Foto de ${pet.nome}`} />

        <div className="detail-content">
          <div className="detail-status-line">
            <span className={`detail-status ${pet.status === 'E' ? 'found' : ''}`}>
              {pet.status === 'P' ? 'Pet perdido' : 'Pet encontrado'}
            </span>
            {pet.is_demo && <span className="detail-demo-label">Cadastro de demonstracao</span>}
            <span>Cadastro acompanhado pela rede</span>
          </div>
          <h1>{pet.nome}</h1>
          <p className="detail-lead">{pet.descricao}</p>

          {pet.is_demo && (
            <p className="detail-demo-note">
              Este perfil e ficticio e existe para voce conhecer e testar a plataforma.
            </p>
          )}

          <div className="detail-encouragement">
            <HeartHandshake aria-hidden="true" size={21} />
            <span>
              {pet.status === 'P'
                ? 'Reconheceu algum detalhe? Compartilhe o anuncio ou registre somente o que voce observou.'
                : `${pet.nome} ja foi marcado como encontrado. Este registro continua visivel para fortalecer quem ainda esta buscando.`}
            </span>
          </div>

          <dl className="pet-details">
            <div>
              <dt>Local</dt>
              <dd className="detail-value-with-icon">
                <MapPin aria-hidden="true" size={16} />
                {pet.cidade} - {pet.estado}
              </dd>
            </div>
            <div>
              <dt>Area do mapa</dt>
              <dd>Raio aproximado de {pet.raio_area_metros || 400} m</dd>
            </div>
            <div>
              <dt>Data</dt>
              <dd>{formatDate(pet.data_desaparecimento)}</dd>
            </div>
            <div>
              <dt>Contato</dt>
              <dd>{pet.contato}</dd>
            </div>
            <div>
              <dt>Caracteristicas</dt>
              <dd>{pet.caracteristicas}</dd>
            </div>
          </dl>

          {isOwner && (
            <div className="detail-actions">
              <Link className="secondary-action" to={`/pets/${pet.id}/editar`}>
                <Share2 aria-hidden="true" size={16} />
                Editar
              </Link>
              {pet.status === 'P' && (
                <button className="primary-action" onClick={handleMarkFound} type="button">
                  <CheckCircle2 aria-hidden="true" size={17} />
                  Marcar encontrado
                </button>
              )}
              <button className="danger-action" disabled={isDeleting} onClick={handleDelete} type="button">
                <Trash2 aria-hidden="true" size={16} />
                {isDeleting ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          )}

          <div className="detail-actions">
            <a
              className="whatsapp-action"
              href={whatsappUrl}
              rel="noreferrer"
              target="_blank"
            >
              <Share2 aria-hidden="true" size={17} />
              Compartilhar no WhatsApp
            </a>
          </div>
        </div>
      </div>

      {pet.status === 'P' && (
        <section className="sighting-cta" aria-labelledby="sighting-cta-title">
          <div>
            <div className="sighting-cta-title-row">
              <HeartHandshake aria-hidden="true" size={23} />
            </div>
            <h2 id="sighting-cta-title">Voce viu este pet?</h2>
            <p>Registre o local e os detalhes. Mesmo uma pista pequena pode devolver a esperanca.</p>
          </div>
          <button className="primary-action" onClick={() => setIsSightingOpen(true)} type="button">
            <MapPin aria-hidden="true" size={17} />
            Vi esse pet!
          </button>
        </section>
      )}

      <PetMap pet={pet} />

      <SightingTimeline sightings={sightings} />

      <AnimatePresence>
        {isSightingOpen && (
          <SightingForm
            error={sightingError}
            isSubmitting={isSubmittingSighting}
            onClose={() => {
              setSightingError('')
              setIsSightingOpen(false)
            }}
            onSubmit={handleSightingSubmit}
            pet={pet}
          />
        )}
      </AnimatePresence>
    </section>
  )
}

export default PetDetailPage

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, HeartHandshake, Plus, RefreshCw, Search, ShieldCheck } from 'lucide-react'
import accountImage from '../assets/editorial/account.webp'
import PetCard from '../components/PetCard.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { listMyPets } from '../services/petService.js'
import { getApiErrorMessage } from '../utils/apiErrors.js'

function AccountPage() {
  const { user } = useAuth()
  const [pets, setPets] = useState([])
  const [isLoadingPets, setIsLoadingPets] = useState(true)
  const [petsError, setPetsError] = useState('')

  const retryLoadPets = async () => {
    setIsLoadingPets(true)
    setPetsError('')

    try {
      setPets(await listMyPets())
    } catch (error) {
      setPetsError(getApiErrorMessage(error, 'Não foi possível carregar seus pets.'))
    } finally {
      setIsLoadingPets(false)
    }
  }

  useEffect(() => {
    let isActive = true

    listMyPets()
      .then((result) => {
        if (isActive) setPets(result)
      })
      .catch((error) => {
        if (isActive) {
          setPetsError(getApiErrorMessage(error, 'Não foi possível carregar seus pets.'))
        }
      })
      .finally(() => {
        if (isActive) setIsLoadingPets(false)
      })

    return () => {
      isActive = false
    }
  }, [])

  return (
    <section className="account-view">
      <div className="account-welcome">
        <div className="account-avatar" aria-hidden="true">
          <HeartHandshake size={28} />
        </div>
        <div className="page-heading">
          <h1>Olá, {user?.username}</h1>
          <p>Sua conta está pronta para cuidar dos seus cadastros e acompanhar cada pista.</p>
        </div>
      </div>

      <dl className="account-details">
        <div>
          <dt>Usuário</dt>
          <dd>{user?.username}</dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd>{user?.email}</dd>
        </div>
      </dl>

      <div className="account-trust">
        <ShieldCheck aria-hidden="true" size={22} />
        <div>
          <strong>Seu espaço de cuidado</strong>
          <p>Apenas você pode editar os pets cadastrados nesta conta.</p>
        </div>
      </div>

      <section className="account-pets" aria-labelledby="account-pets-title">
        <div className="account-pets-heading">
          <div>
            <p className="eyebrow">Seus cadastros</p>
            <h2 id="account-pets-title">Meus pets</h2>
            <p>Abra um cadastro para conferir os detalhes e fazer alterações.</p>
          </div>
          {pets.length > 0 && (
            <Link className="secondary-action" to="/cadastrar-pet">
              <Plus aria-hidden="true" size={17} />
              Cadastrar pet
            </Link>
          )}
        </div>

        {isLoadingPets && (
          <p className="account-pets-feedback" role="status">Carregando seus pets...</p>
        )}

        {!isLoadingPets && petsError && (
          <div className="account-pets-feedback account-pets-error" role="alert">
            <p>{petsError}</p>
            <button className="secondary-action" onClick={retryLoadPets} type="button">
              <RefreshCw aria-hidden="true" size={16} />
              Tentar novamente
            </button>
          </div>
        )}

        {!isLoadingPets && !petsError && pets.length === 0 && (
          <div className="account-pets-feedback account-pets-empty">
            <p>Você ainda não cadastrou nenhum pet.</p>
            <span>Quando precisar, o primeiro cadastro começa por aqui.</span>
            <Link className="primary-action" to="/cadastrar-pet">
              <Plus aria-hidden="true" size={17} />
              Cadastrar meu primeiro pet
            </Link>
          </div>
        )}

        {!isLoadingPets && !petsError && pets.length > 0 && (
          <div className="pet-list account-pets-grid">
            {pets.map((pet) => (
              <PetCard key={pet.id} linkLabel="Ver cadastro" pet={pet} />
            ))}
          </div>
        )}
      </section>

      <section className="account-next-step" aria-labelledby="account-next-step-title">
        <img
          alt="Tutor sorrindo enquanto segura seu gato"
          decoding="async"
          height="1650"
          loading="lazy"
          src={accountImage}
          width="1100"
        />
        <div>
          <h2 id="account-next-step-title">Sua próxima ação pode começar aqui.</h2>
          <p>Com sua conta, você pode iniciar uma busca e manter seus anúncios atualizados.</p>
          <div className="account-next-actions">
            <Link className="primary-action" to="/cadastrar-pet">
              Cadastrar um pet
              <ArrowRight aria-hidden="true" size={17} />
            </Link>
            <Link className="account-search-link" to="/pets">
              <Search aria-hidden="true" size={16} />
              Procurar pets
            </Link>
          </div>
        </div>
      </section>
    </section>
  )
}

export default AccountPage

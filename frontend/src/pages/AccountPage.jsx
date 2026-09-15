import { Link } from 'react-router-dom'
import { ArrowRight, HeartHandshake, Search, ShieldCheck } from 'lucide-react'
import accountImage from '../assets/editorial/account.webp'
import { useAuth } from '../hooks/useAuth.js'

function AccountPage() {
  const { user } = useAuth()

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

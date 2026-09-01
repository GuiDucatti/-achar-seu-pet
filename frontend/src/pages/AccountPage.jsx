import { HeartHandshake, ShieldCheck } from 'lucide-react'
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
          <h1>Ola, {user?.username}</h1>
          <p>Sua conta esta pronta para cuidar dos seus cadastros e acompanhar cada pista.</p>
        </div>
      </div>

      <dl className="account-details">
        <div>
          <dt>Usuario</dt>
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
          <strong>Seu espaco de cuidado</strong>
          <p>Apenas voce pode editar os pets cadastrados nesta conta.</p>
        </div>
      </div>
    </section>
  )
}

export default AccountPage

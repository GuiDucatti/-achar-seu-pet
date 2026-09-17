import { ArrowLeft, Search } from 'lucide-react'
import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <section className="content-view not-found-view">
      <p className="eyebrow">Página não encontrada</p>
      <h1>Essa pista não leva a uma página do site.</h1>
      <p>O endereço pode ter mudado ou sido digitado incorretamente.</p>
      <div className="not-found-actions">
        <Link className="primary-action" to="/">
          <ArrowLeft aria-hidden="true" size={17} />
          Voltar ao início
        </Link>
        <Link className="secondary-action" to="/pets">
          <Search aria-hidden="true" size={17} />
          Ver pets perdidos
        </Link>
      </div>
    </section>
  )
}

export default NotFoundPage

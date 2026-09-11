import { Link } from 'react-router-dom'
import { ArrowUpRight, MapPin, PawPrint } from 'lucide-react'
import { formatDate } from '../utils/formatters.js'

function PetCard({ pet }) {
  const distance = Number(pet.distancia_aproximada_km)
  const hasDistance = pet.distancia_aproximada_km !== null && Number.isFinite(distance)
  const distanceLabel = distance < 1
    ? 'A menos de 1 km de voce'
    : `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(distance)} km de voce`

  return (
    <article className="pet-item">
      <div className="pet-image-wrap">
        <img
          alt={`Foto de ${pet.nome}`}
          decoding="async"
          loading="lazy"
          src={pet.foto}
        />
        <span className={`pet-status ${pet.status === 'E' ? 'found' : ''}`}>
          {pet.status === 'E' ? 'Encontrado' : 'Perdido'}
        </span>
        {pet.is_demo && <span className="pet-demo-label">Cadastro de demonstracao</span>}
      </div>
      <div className="pet-card-content">
        <div className="pet-card-heading">
          <h2>
            <PawPrint aria-hidden="true" size={17} />
            {pet.nome}
          </h2>
          <ArrowUpRight aria-hidden="true" size={18} />
        </div>
        <p className="pet-location">
          <MapPin aria-hidden="true" size={15} />
          {pet.cidade} - {pet.estado}
        </p>
        <p className="pet-meta">Desapareceu em {formatDate(pet.data_desaparecimento)}</p>
        {hasDistance && <p className="pet-distance">{distanceLabel}</p>}
        <Link className="text-link" to={`/pets/${pet.id}`}>
          Ver historia completa
          <ArrowUpRight aria-hidden="true" size={15} />
        </Link>
      </div>
    </article>
  )
}

export default PetCard

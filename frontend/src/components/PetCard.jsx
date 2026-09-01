import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUpRight, MapPin, PawPrint } from 'lucide-react'
import { formatDate } from '../utils/formatters.js'

function PetCard({ index = 0, pet }) {
  return (
    <motion.article
      animate={{ opacity: 1, y: 0 }}
      className="pet-item"
      initial={{ opacity: 0, y: 12 }}
      transition={{ delay: index * 0.05, duration: 0.25 }}
      whileHover={{ y: -3 }}
    >
      <div className="pet-image-wrap">
        <img src={pet.foto} alt={`Foto de ${pet.nome}`} />
        <span className={`pet-status ${pet.status === 'E' ? 'found' : ''}`}>
          {pet.status === 'E' ? 'Encontrado' : 'Perdido'}
        </span>
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
        <Link className="text-link" to={`/pets/${pet.id}`}>
          Ver historia completa
          <ArrowUpRight aria-hidden="true" size={15} />
        </Link>
      </div>
    </motion.article>
  )
}

export default PetCard

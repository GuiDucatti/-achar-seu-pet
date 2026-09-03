import { formatDateTime } from '../utils/formatters.js'

function SightingTimeline({ sightings }) {
  const orderedSightings = [...sightings].sort(
    (first, second) => new Date(second.criado_em) - new Date(first.criado_em),
  )

  return (
    <section className="sightings-section" aria-labelledby="sightings-title">
      <div className="section-heading">
        <div>
          <h2 id="sightings-title">Pistas deixadas pela rede</h2>
        </div>
        <p className="section-heading-note">Cada registro ajuda a desenhar o caminho de volta.</p>
      </div>

      {orderedSightings.length > 0 ? (
        <ol className="sighting-timeline">
          {orderedSightings.map((sighting) => (
            <li className="sighting-item" key={sighting.id}>
              <time dateTime={sighting.criado_em}>{formatDateTime(sighting.criado_em)}</time>
              <p>{sighting.descricao || 'Nenhuma descricao informada.'}</p>
              {sighting.proximo && (
                <strong className="proximity-badge">Possivel correspondencia proxima</strong>
              )}
              <span>Localizacao registrada para calcular a proximidade desta pista.</span>
              {sighting.distancia_km !== null && (
                <span>Distancia da regiao do pet: {sighting.distancia_km} km</span>
              )}
              {sighting.contato_quem_viu && <small>Contato: {sighting.contato_quem_viu}</small>}
            </li>
          ))}
        </ol>
      ) : (
        <p className="feedback">Ainda nao ha avistamentos registrados.</p>
      )}
    </section>
  )
}

export default SightingTimeline

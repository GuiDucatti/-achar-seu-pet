import { formatDateTime } from '../utils/formatters.js'

function SightingTimeline({ isOwner, sightings }) {
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
              {isOwner ? (
                <>
                  <p>{sighting.descricao || 'Nenhuma descrição informada.'}</p>
                  {sighting.proximo && (
                    <strong className="proximity-badge">Possível correspondência próxima</strong>
                  )}
                  <span>Localização registrada para calcular a proximidade desta pista.</span>
                  {sighting.distancia_km !== null && sighting.distancia_km !== undefined && (
                    <span>Distância da região do pet: {sighting.distancia_km} km</span>
                  )}
                  {sighting.contato_quem_viu && <small>Contato: {sighting.contato_quem_viu}</small>}
                </>
              ) : (
                <p>Uma pista foi registrada e os detalhes foram enviados ao tutor.</p>
              )}
            </li>
          ))}
        </ol>
      ) : (
        <p className="feedback">Ainda não há avistamentos registrados.</p>
      )}
    </section>
  )
}

export default SightingTimeline

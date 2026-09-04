import { Circle, MapContainer, TileLayer } from 'react-leaflet'
import { parsePublicLocation } from '../utils/publicLocation.js'

function PetMap({ pet }) {
  const publicLocation = parsePublicLocation(pet.localizacao_publica)

  return (
    <section className="map-section" aria-labelledby="map-title">
      <div className="section-heading">
        <h2 id="map-title">Regiao aproximada</h2>
        <p>
          O mapa mostra uma area aproximada para preservar a privacidade do endereco.
        </p>
      </div>

      {publicLocation ? (
        <MapContainer
          className="pet-map"
          center={[publicLocation.latitude, publicLocation.longitude]}
          scrollWheelZoom={false}
          zoom={14}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Circle
            center={[publicLocation.latitude, publicLocation.longitude]}
            pathOptions={{ color: '#347ea8', fillColor: '#347ea8', fillOpacity: 0.18 }}
            radius={publicLocation.radius}
          />
        </MapContainer>
      ) : (
        <div className="map-placeholder">
          <strong>Localizacao ainda nao encontrada</strong>
          <span>O cadastro continua disponivel pela regiao informada.</span>
        </div>
      )}
    </section>
  )
}

export default PetMap

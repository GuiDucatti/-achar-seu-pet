import L from 'leaflet'
import { Circle, MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'

function createPetIcon(photo) {
  return L.icon({
    className: 'pet-map-icon',
    iconAnchor: [28, 28],
    iconSize: [56, 56],
    iconUrl: photo,
    popupAnchor: [0, -28],
  })
}

function PetMap({ pet }) {
  const latitude = Number(pet.latitude)
  const longitude = Number(pet.longitude)
  const radius = Number(pet.raio_area_metros) || 400
  const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude)

  return (
    <section className="map-section" aria-labelledby="map-title">
      <div className="section-heading">
        <h2 id="map-title">Regiao aproximada</h2>
        <p>
          O mapa mostra uma area aproximada para preservar a privacidade do endereco.
        </p>
      </div>

      {hasCoordinates ? (
        <MapContainer
          className="pet-map"
          center={[latitude, longitude]}
          scrollWheelZoom={false}
          zoom={15}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Circle
            center={[latitude, longitude]}
            pathOptions={{ color: '#347ea8', fillColor: '#347ea8', fillOpacity: 0.18 }}
            radius={radius}
          />
          <Marker icon={createPetIcon(pet.foto)} position={[latitude, longitude]}>
            <Popup>
              {pet.nome}
              <br />
              {pet.cidade} - {pet.estado}
            </Popup>
          </Marker>
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

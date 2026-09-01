import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Cat,
  Check,
  Dog,
  HeartHandshake,
  LocateFixed,
  MapPin,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import PetCard from '../components/PetCard.jsx'
import foundSearchImage from '../assets/editorial/search-found.webp'
import lostSearchImage from '../assets/editorial/search-lost.webp'
import { listNearbyPets, listPets } from '../services/petService.js'
import { getApiErrorMessage } from '../utils/apiErrors.js'

const emptyFilters = {
  estado: '',
  cidade: '',
  especie: '',
  sexo: '',
  data_desaparecimento: '',
  busca: '',
}

const speciesOptions = [
  { label: 'Todos', value: '', icon: HeartHandshake },
  { label: 'Cachorro', value: 'cachorro', icon: Dog },
  { label: 'Gato', value: 'gato', icon: Cat },
]

const radiusOptions = [10, 25, 50, 100]

function PetsPage({ title, status }) {
  const [pets, setPets] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState(emptyFilters)
  const [activeFilters, setActiveFilters] = useState(emptyFilters)
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)
  const [radius, setRadius] = useState(50)
  const [activeRegion, setActiveRegion] = useState(null)
  const [resolvedOrigin, setResolvedOrigin] = useState(null)
  const [regionNotice, setRegionNotice] = useState('')
  const [locationState, setLocationState] = useState('idle')
  const [reloadKey, setReloadKey] = useState(0)

  const hasPendingFilters = useMemo(
    () => JSON.stringify(filters) !== JSON.stringify(activeFilters),
    [activeFilters, filters],
  )

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setActiveFilters(filters)
    }, 350)

    return () => window.clearTimeout(timeoutId)
  }, [filters])

  useEffect(() => {
    let isMounted = true

    async function loadPets() {
      try {
        setIsLoading(true)
        setError('')

        const commonFilters = {
          status,
          especie: activeFilters.especie || undefined,
          sexo: activeFilters.sexo || undefined,
          data_desaparecimento: activeFilters.data_desaparecimento || undefined,
          busca: activeFilters.busca || undefined,
        }

        let data
        if (activeRegion) {
          const origin = activeRegion.type === 'gps'
            ? {
                latitude: activeRegion.latitude,
                longitude: activeRegion.longitude,
              }
            : {
                cidade_origem: activeRegion.city,
                estado_origem: activeRegion.state,
              }
          const regionalData = await listNearbyPets({
            ...origin,
            ...commonFilters,
            raio_km: radius,
          })
          data = regionalData.resultados

          if (isMounted) {
            setResolvedOrigin(regionalData.origem)
            setRegionNotice('')
            setLocationState('active')
          }
        } else {
          data = await listPets({
            ...commonFilters,
            estado: activeFilters.estado || undefined,
            cidade: activeFilters.cidade || undefined,
          })
        }

        if (isMounted) {
          setPets(data)
        }
      } catch (err) {
        if (
          isMounted
          && activeRegion?.type === 'city'
          && err.response?.data?.codigo === 'regiao_nao_encontrada'
        ) {
          setActiveRegion(null)
          setResolvedOrigin(null)
          setLocationState('fallback')
          setRegionNotice(
            `Nao foi possivel calcular cidades vizinhas. Mostrando cadastros de ${activeRegion.city}/${activeRegion.state}.`,
          )
          return
        }

        if (isMounted) {
          setError(getApiErrorMessage(err, 'Nao foi possivel carregar os pets agora.'))
        }

        console.error(err)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadPets()

    return () => {
      isMounted = false
    }
  }, [status, activeFilters, activeRegion, radius, reloadKey])

  function handleFilterChange(event) {
    const { name, value } = event.target
    const nextValue = name === 'estado' ? value.toUpperCase() : value
    setFilters((current) => ({ ...current, [name]: nextValue }))

    if ((name === 'cidade' || name === 'estado') && activeRegion?.type === 'city') {
      setActiveRegion(null)
      setResolvedOrigin(null)
      setLocationState('idle')
      setRegionNotice('Clique em Usar esta regiao para incluir cidades vizinhas.')
    }
  }

  function handleSpeciesChange(value) {
    setFilters((current) => ({ ...current, especie: value }))
  }

  function handleFilterSubmit(event) {
    event.preventDefault()
    setActiveFilters(filters)
  }

  function handleClearFilters() {
    setFilters(emptyFilters)
    setActiveFilters(emptyFilters)
    setActiveRegion(null)
    setResolvedOrigin(null)
    setRegionNotice('')
    setLocationState('idle')
    setRadius(50)
  }

  function handleUseTypedRegion() {
    const city = filters.cidade.trim()
    const stateCode = filters.estado.trim().toUpperCase()

    if (!city || stateCode.length !== 2) {
      setLocationState('idle')
      setRegionNotice('Informe a cidade e uma UF com duas letras para usar a busca regional.')
      return
    }

    setActiveFilters({ ...filters, cidade: city, estado: stateCode })
    setActiveRegion({ type: 'city', city, state: stateCode })
    setResolvedOrigin(null)
    setRegionNotice('')
    setLocationState('resolving')
  }

  function handleUseLocation() {
    if (!navigator.geolocation) {
      setLocationState('unavailable')
      setRegionNotice('Este navegador nao oferece localizacao. Use cidade e UF abaixo.')
      return
    }

    setLocationState('locating')
    setRegionNotice('')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setActiveRegion({
          type: 'gps',
          latitude: Number(coords.latitude.toFixed(3)),
          longitude: Number(coords.longitude.toFixed(3)),
        })
        setResolvedOrigin(null)
        setLocationState('resolving')
      },
      () => {
        setLocationState('denied')
        setRegionNotice('Localizacao nao autorizada. Voce pode usar cidade e UF sem problema.')
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    )
  }

  function handleRemoveRegion() {
    setActiveRegion(null)
    setResolvedOrigin(null)
    setLocationState('idle')
    setRegionNotice('Busca regional removida. Cidade e UF voltaram ao filtro comum.')
  }

  return (
    <section className="pets-view">
      <div className="page-heading browse-heading">
        <p className="eyebrow">Busca local</p>
        <h1>{title}</h1>
        <p>
          {status === 'P'
            ? 'Comece pelo que voce lembra. A cidade ajuda a colocar cada pista no lugar certo.'
            : 'Procure por uma historia que terminou bem e ajude outras pessoas a reconhecerem seu pet.'}
        </p>
      </div>

      <aside className={`browse-human-note ${status === 'E' ? 'found' : 'lost'}`}>
        <img
          alt={status === 'P'
            ? 'Pessoa caminhando com seu cachorro por uma rua de bairro'
            : 'Tutor sentado com seu cachorro em um parque'}
          height={status === 'P' ? 1800 : 1000}
          src={status === 'P' ? lostSearchImage : foundSearchImage}
          width={status === 'P' ? 1200 : 1500}
        />
        <p>
          {status === 'P'
            ? 'Comece perto de onde ele foi visto. Ruas e cidades vizinhas tambem podem guardar uma pista.'
            : 'Estes reencontros mostram por que vale a pena registrar, compartilhar e continuar olhando.'}
        </p>
      </aside>

      <form className="search-panel" onSubmit={handleFilterSubmit} role="search">
        <div className="search-panel-intro">
          <div className="search-panel-mark" aria-hidden="true">
            <Search size={20} />
          </div>
          <div>
            <strong>Qual pet voce esta procurando?</strong>
            <span>Comece com uma lembranca. Os resultados acompanham seus filtros.</span>
          </div>
        </div>

        <section className="region-search" aria-labelledby="region-search-title">
          <div className="region-search-heading">
            <div>
              <span className="region-kicker">Sua regiao</span>
              <strong id="region-search-title">Coloque sua regiao para ver animais perto de voce.</strong>
            </div>
            <button
              className="location-action"
              disabled={locationState === 'locating' || locationState === 'resolving'}
              onClick={handleUseLocation}
              type="button"
            >
              <LocateFixed aria-hidden="true" size={18} />
              {locationState === 'locating' ? 'Buscando sua regiao...' : 'Usar minha localizacao'}
            </button>
          </div>

          <div className="region-controls">
            <div className="region-city-fields">
              <label htmlFor="cidade">
                Cidade
                <input
                  id="cidade"
                  name="cidade"
                  onChange={handleFilterChange}
                  placeholder="Ex.: Birigui"
                  type="text"
                  value={filters.cidade}
                />
              </label>
              <label htmlFor="estado">
                UF
                <input
                  id="estado"
                  maxLength="2"
                  name="estado"
                  onChange={handleFilterChange}
                  placeholder="SP"
                  type="text"
                  value={filters.estado}
                />
              </label>
              <button className="region-submit" onClick={handleUseTypedRegion} type="button">
                <MapPin aria-hidden="true" size={17} />
                Usar esta regiao
              </button>
            </div>

            <fieldset className="radius-control">
              <legend>Buscar em ate</legend>
              <div className="radius-options">
                {radiusOptions.map((option) => (
                  <button
                    aria-pressed={radius === option}
                    className={radius === option ? 'selected' : ''}
                    key={option}
                    onClick={() => setRadius(option)}
                    type="button"
                  >
                    {option} km
                  </button>
                ))}
              </div>
            </fieldset>
          </div>

          {(resolvedOrigin || regionNotice) && (
            <div className={`region-feedback ${resolvedOrigin ? 'active' : ''}`} aria-live="polite">
              <MapPin aria-hidden="true" size={16} />
              <span>
                {resolvedOrigin
                  ? `Perto de ${resolvedOrigin.rotulo.toLowerCase() === 'sua localizacao' ? 'sua localizacao' : resolvedOrigin.rotulo} - ate ${radius} km`
                  : regionNotice}
              </span>
              {resolvedOrigin && (
                <button onClick={handleRemoveRegion} type="button">Remover regiao</button>
              )}
            </div>
          )}
        </section>

        <div className="search-main-row search-main-row-single">
          <label className="search-primary-field" htmlFor="busca">
            <span>Nome, raca ou uma caracteristica</span>
            <div className="input-with-icon">
              <Search aria-hidden="true" size={18} />
              <input
                id="busca"
                name="busca"
                onChange={handleFilterChange}
                placeholder="Ex.: mancha branca na testa"
                type="search"
                value={filters.busca}
              />
            </div>
          </label>
        </div>

        <div className="quick-filter-row" aria-label="Filtros rapidos">
          <span className="quick-filter-label">Estou procurando</span>
          <div className="species-choices">
            {speciesOptions.map(({ icon: Icon, label, value }) => (
              <button
                aria-pressed={filters.especie === value}
                className={`species-choice ${filters.especie === value ? 'selected' : ''}`}
                key={value || 'todos'}
                onClick={() => handleSpeciesChange(value)}
                type="button"
              >
                <Icon aria-hidden="true" size={17} />
                {label}
                {filters.especie === value && <Check aria-hidden="true" size={14} />}
              </button>
            ))}
          </div>

          <button
            aria-expanded={isAdvancedOpen}
            className={`advanced-toggle ${isAdvancedOpen ? 'open' : ''}`}
            onClick={() => setIsAdvancedOpen((current) => !current)}
            type="button"
          >
            <SlidersHorizontal aria-hidden="true" size={17} />
            Mais filtros
          </button>
        </div>

        <AnimatePresence initial={false}>
          {isAdvancedOpen && (
            <motion.div
              animate={{ height: 'auto', opacity: 1 }}
              className="advanced-filter-panel"
              exit={{ height: 0, opacity: 0 }}
              initial={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <div className="advanced-filter-grid">
                <label>
                  Sexo
                  <select name="sexo" onChange={handleFilterChange} value={filters.sexo}>
                    <option value="">Todos</option>
                    <option value="macho">Macho</option>
                    <option value="femea">Femea</option>
                  </select>
                </label>
                <label>
                  Desapareceu em
                  <input
                    name="data_desaparecimento"
                    onChange={handleFilterChange}
                    type="date"
                    value={filters.data_desaparecimento}
                  />
                </label>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="search-panel-footer">
          <p className="search-status" aria-live="polite">
            {isLoading
              ? pets.length > 0
                ? 'Atualizando os resultados...'
                : 'Procurando pistas na rede...'
              : locationState === 'resolving'
                ? 'Calculando os animais mais proximos...'
              : hasPendingFilters
                ? 'Preparando sua busca...'
                : 'Busca atualizada automaticamente'}
          </p>
          <button className="clear-search" onClick={handleClearFilters} type="button">
            <X aria-hidden="true" size={16} />
            Limpar busca
          </button>
        </div>
      </form>

      {!isLoading && !error && (
        <p className="results-summary" aria-live="polite">
          {pets.length} {pets.length === 1 ? 'historia encontrada' : 'historias encontradas'}
          {resolvedOrigin ? ` em ate ${radius} km` : ''}
        </p>
      )}

      {isLoading && <p className="feedback loading-feedback">Procurando pistas na rede...</p>}

      {!isLoading && error && (
        <div className="feedback error search-error">
          <strong>Nao conseguimos atualizar a busca.</strong>
          <span>{error}</span>
          <button className="secondary-action" onClick={() => setReloadKey((current) => current + 1)} type="button">
            Tentar novamente
          </button>
        </div>
      )}

      <AnimatePresence mode="wait">
        {!isLoading && !error && pets.length === 0 && (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="search-empty-state"
            exit={{ opacity: 0, y: -6 }}
            initial={{ opacity: 0, y: 6 }}
          >
            <div className="empty-paw" aria-hidden="true">
              <HeartHandshake size={26} />
            </div>
            <div>
              <h2>Nenhuma historia apareceu ainda</h2>
              <p>
                {resolvedOrigin && radius < 100
                  ? 'Nenhum cadastro apareceu neste raio. Tente ampliar a distancia ou retirar um filtro.'
                  : 'Tente tirar um filtro ou procurar por outro detalhe. Uma pista pode estar escrita de outro jeito.'}
              </p>
            </div>
            <button className="secondary-action" onClick={handleClearFilters} type="button">
              Ver todos os pets
            </button>
          </motion.div>
        )}

        {!isLoading && !error && pets.length > 0 && (
          <motion.div animate={{ opacity: 1 }} className="pet-list" initial={{ opacity: 0 }}>
            {pets.map((pet, index) => (
              <PetCard key={pet.id} index={index} pet={pet} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

export default PetsPage

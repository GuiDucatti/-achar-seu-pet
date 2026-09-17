import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
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
  const [totalPets, setTotalPets] = useState(0)
  const [page, setPage] = useState(1)
  const [hasNextPage, setHasNextPage] = useState(false)
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
  const reduceMotion = useReducedMotion()

  const hasPendingFilters = useMemo(
    () => JSON.stringify(filters) !== JSON.stringify(activeFilters),
    [activeFilters, filters],
  )

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setPage(1)
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
          const regionalData = await listNearbyPets(
            {
              ...origin,
              ...commonFilters,
              raio_km: radius,
            },
            page,
          )
          data = regionalData

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
            page,
          })
        }

        if (isMounted) {
          setPets((current) => page === 1 ? data.items : [...current, ...data.items])
          setTotalPets(data.count)
          setHasNextPage(data.hasNext)
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
            `Não foi possível calcular cidades vizinhas. Mostrando cadastros de ${activeRegion.city}/${activeRegion.state}.`,
          )
          return
        }

        if (isMounted) {
          setError(getApiErrorMessage(err, 'Não foi possível carregar os pets agora.'))
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
  }, [status, activeFilters, activeRegion, radius, reloadKey, page])

  function handleFilterChange(event) {
    const { name, value } = event.target
    const nextValue = name === 'estado' ? value.toUpperCase() : value
    setPage(1)
    setFilters((current) => ({ ...current, [name]: nextValue }))

    if ((name === 'cidade' || name === 'estado') && activeRegion?.type === 'city') {
      setActiveRegion(null)
      setResolvedOrigin(null)
      setLocationState('idle')
      setRegionNotice('Clique em Usar esta região para incluir cidades vizinhas.')
    }
  }

  function handleSpeciesChange(value) {
    setPage(1)
    setFilters((current) => ({ ...current, especie: value }))
  }

  function handleFilterSubmit(event) {
    event.preventDefault()
    setPage(1)
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
    setPage(1)
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
    setPage(1)
    setActiveRegion({ type: 'city', city, state: stateCode })
    setResolvedOrigin(null)
    setRegionNotice('')
    setLocationState('resolving')
  }

  function handleUseLocation() {
    if (!navigator.geolocation) {
      setLocationState('unavailable')
      setRegionNotice('Este navegador não oferece localização. Use cidade e UF abaixo.')
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
        setPage(1)
        setResolvedOrigin(null)
        setLocationState('resolving')
      },
      () => {
        setLocationState('denied')
        setRegionNotice('Localização não autorizada. Você pode usar cidade e UF sem problema.')
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    )
  }

  function handleRemoveRegion() {
    setActiveRegion(null)
    setResolvedOrigin(null)
    setLocationState('idle')
    setRegionNotice('Busca regional removida. Cidade e UF voltaram ao filtro comum.')
    setPage(1)
  }

  return (
    <section className="pets-view">
      <div className={`browse-hero ${status === 'E' ? 'found' : 'lost'}`}>
        <div className="page-heading browse-heading">
          <p className="eyebrow">{status === 'P' ? 'Busca local' : 'Boas notícias'}</p>
          <h1>{title}</h1>
          <p>
            {status === 'P'
              ? 'Comece pelo que você lembra. A cidade ajuda a colocar cada pista no lugar certo.'
              : 'Procure por uma história que terminou bem e ajude outras pessoas a reconhecerem seu pet.'}
          </p>
          <div className="browse-hero-support">
            <HeartHandshake aria-hidden="true" size={20} />
            <span>{status === 'P' ? 'Você também pode ajudar.' : 'Cada reencontro deixa uma pista para a rede.'}</span>
          </div>
        </div>

        <aside className="browse-human-note">
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
              ? 'Toda informação importa.'
              : 'Juntos, também reencontramos.'}
          </p>
        </aside>
      </div>

      <form className="search-panel" onSubmit={handleFilterSubmit} role="search">
        <div className="search-panel-intro">
          <div className="search-panel-mark" aria-hidden="true">
            <Search size={20} />
          </div>
          <div>
            <strong>Qual pet você está procurando?</strong>
            <span>Comece com uma lembrança. Os resultados acompanham seus filtros.</span>
          </div>
        </div>

        <section className="region-search" aria-labelledby="region-search-title">
          <div className="region-search-heading">
            <div>
              <span className="region-kicker">Sua região</span>
              <strong id="region-search-title">Coloque sua região para ver animais perto de você.</strong>
            </div>
            <button
              className="location-action"
              disabled={locationState === 'locating' || locationState === 'resolving'}
              onClick={handleUseLocation}
              type="button"
            >
              <LocateFixed aria-hidden="true" size={18} />
              {locationState === 'locating' ? 'Buscando sua região...' : 'Usar minha localização'}
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
                Usar esta região
              </button>
            </div>

            <fieldset className="radius-control">
              <legend>Buscar em até</legend>
              <div className="radius-options">
                {radiusOptions.map((option) => (
                  <button
                    aria-pressed={radius === option}
                    className={radius === option ? 'selected' : ''}
                    key={option}
                    onClick={() => {
                      setRadius(option)
                      setPage(1)
                    }}
                    type="button"
                  >
                    {option} km
                  </button>
                ))}
              </div>
            </fieldset>
          </div>

          <AnimatePresence initial={false}>
            {(resolvedOrigin || regionNotice) && (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className={`region-feedback ${resolvedOrigin ? 'active' : ''}`}
                exit={{ opacity: 0, y: reduceMotion ? 0 : -3 }}
                initial={reduceMotion ? false : { opacity: 0, y: -3 }}
                transition={{ duration: reduceMotion ? 0 : 0.16 }}
                aria-live="polite"
              >
                <MapPin aria-hidden="true" size={16} />
                <span>
                  {resolvedOrigin
                    ? `Perto de ${resolvedOrigin.rotulo.toLowerCase() === 'sua localização' ? 'sua localização' : resolvedOrigin.rotulo} - até ${radius} km`
                    : regionNotice}
                </span>
                {resolvedOrigin && (
                  <button onClick={handleRemoveRegion} type="button">Remover região</button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <div className="search-main-row search-main-row-single">
          <label className="search-primary-field" htmlFor="busca">
            <span>Nome, raça ou uma característica</span>
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

        <div className="quick-filter-row" aria-label="Filtros rápidos">
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
                <Check aria-hidden="true" className="choice-check" size={14} />
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
              animate={{ height: 'auto', opacity: 1, y: 0 }}
              className="advanced-filter-panel"
              exit={{ height: 0, opacity: 0, y: reduceMotion ? 0 : -3 }}
              initial={{ height: 0, opacity: 0, y: reduceMotion ? 0 : -3 }}
              transition={{ duration: reduceMotion ? 0 : 0.2, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <div className="advanced-filter-grid">
                <label>
                  Sexo
                  <select name="sexo" onChange={handleFilterChange} value={filters.sexo}>
                    <option value="">Todos</option>
                    <option value="macho">Macho</option>
                    <option value="femea">Fêmea</option>
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

      {!error && (!isLoading || pets.length > 0) && (
        <p className="results-summary" aria-live="polite">
          {totalPets} {totalPets === 1 ? 'história encontrada' : 'histórias encontradas'}
          {resolvedOrigin ? ` em até ${radius} km` : ''}
        </p>
      )}

      {isLoading && pets.length === 0 && (
        <p className="feedback loading-feedback" role="status">
          <span className="loading-indicator" aria-hidden="true" />
          Procurando pistas na rede...
        </p>
      )}

      {!isLoading && error && (
        <div className="feedback error search-error">
          <strong>Não conseguimos atualizar a busca.</strong>
          <span>{error}</span>
          <button className="secondary-action" onClick={() => setReloadKey((current) => current + 1)} type="button">
            Tentar novamente
          </button>
        </div>
      )}

      <div className={`results-stage ${isLoading && pets.length > 0 ? 'is-updating' : ''}`} aria-busy={isLoading}>
      <AnimatePresence initial={false}>
        {!isLoading && !error && pets.length === 0 && (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="search-empty-state"
            exit={{ opacity: 0, y: reduceMotion ? 0 : -4 }}
            initial={{ opacity: 0, y: reduceMotion ? 0 : 4 }}
            transition={{ duration: reduceMotion ? 0 : 0.18 }}
          >
            <div className="empty-paw" aria-hidden="true">
              <HeartHandshake size={26} />
            </div>
            <div>
              <h2>Nenhuma história apareceu ainda</h2>
              <p>
                {resolvedOrigin && radius < 100
                  ? 'Nenhum cadastro apareceu neste raio. Tente ampliar a distância ou retirar um filtro.'
                  : 'Tente tirar um filtro ou procurar por outro detalhe. Uma pista pode estar escrita de outro jeito.'}
              </p>
            </div>
            <button className="secondary-action" onClick={handleClearFilters} type="button">
              Ver todos os pets
            </button>
          </motion.div>
        )}

        {!error && pets.length > 0 && (
          <>
            <motion.div animate={{ opacity: 1 }} className="pet-list" initial={reduceMotion ? false : { opacity: 0.82 }} transition={{ duration: reduceMotion ? 0 : 0.18 }}>
              {pets.map((pet) => (
                <PetCard key={pet.id} pet={pet} />
              ))}
            </motion.div>
            {hasNextPage && (
              <button
                className="secondary-action load-more-action"
                disabled={isLoading}
                onClick={() => setPage((current) => current + 1)}
                type="button"
              >
                {isLoading ? 'Carregando...' : 'Carregar mais histórias'}
              </button>
            )}
          </>
        )}
      </AnimatePresence>
      </div>
    </section>
  )
}

export default PetsPage

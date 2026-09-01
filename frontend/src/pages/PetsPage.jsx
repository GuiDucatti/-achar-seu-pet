import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Cat, Check, Dog, HeartHandshake, Search, SlidersHorizontal, X } from 'lucide-react'
import PetCard from '../components/PetCard.jsx'
import { listPets } from '../services/petService.js'
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

function PetsPage({ title, status }) {
  const [pets, setPets] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState(emptyFilters)
  const [activeFilters, setActiveFilters] = useState(emptyFilters)
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)

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

        const data = await listPets({
          status,
          estado: activeFilters.estado || undefined,
          cidade: activeFilters.cidade || undefined,
          especie: activeFilters.especie || undefined,
          sexo: activeFilters.sexo || undefined,
          data_desaparecimento: activeFilters.data_desaparecimento || undefined,
          busca: activeFilters.busca || undefined,
        })

        if (isMounted) {
          setPets(data)
        }
      } catch (err) {
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
  }, [status, activeFilters])

  function handleFilterChange(event) {
    const { name, value } = event.target
    setFilters((current) => ({ ...current, [name]: value }))
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

        <div className="search-main-row">
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

          <div className="search-location-group">
            <div className="search-location-label">
              <span>Onde procurar</span>
              <small>Por cidade e estado</small>
            </div>
            <div className="search-location-fields">
              <label className="sr-only" htmlFor="cidade">Cidade</label>
              <input
                id="cidade"
                name="cidade"
                onChange={handleFilterChange}
                placeholder="Cidade"
                type="text"
                value={filters.cidade}
              />
              <label className="sr-only" htmlFor="estado">Estado</label>
              <input
                aria-label="Estado"
                id="estado"
                maxLength="2"
                name="estado"
                onChange={handleFilterChange}
                placeholder="UF"
                type="text"
                value={filters.estado}
              />
            </div>
          </div>
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
              <div className="location-readiness">
                <span className="location-signal" aria-hidden="true" />
                <p>
                  A busca por distancia ainda esta sendo preparada. Por enquanto, cidade e estado ja filtram os cadastros reais.
                </p>
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
        </p>
      )}

      {isLoading && <p className="feedback loading-feedback">Procurando pistas na rede...</p>}

      {!isLoading && error && (
        <div className="feedback error search-error">
          <strong>Nao conseguimos atualizar a busca.</strong>
          <span>{error}</span>
          <button className="secondary-action" onClick={() => setActiveFilters({ ...filters })} type="button">
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
              <p>Tente tirar um filtro ou procurar por outro detalhe. Uma pista pode estar escrita de outro jeito.</p>
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

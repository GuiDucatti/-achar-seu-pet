import { useEffect, useId, useState } from 'react'
import { Check, LoaderCircle, MapPin, Search } from 'lucide-react'
import { suggestAddresses } from '../services/petService.js'

function AddressAutocomplete({
  describedBy,
  id,
  inputRef,
  invalid = false,
  label,
  onChange,
  onSelect,
  placeholder,
  value,
}) {
  const listId = useId()
  const [activeIndex, setActiveIndex] = useState(-1)
  const [error, setError] = useState('')
  const [hasSearched, setHasSearched] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [searchEnabled, setSearchEnabled] = useState(false)
  const [suggestions, setSuggestions] = useState([])

  useEffect(() => {
    const query = value.trim()
    if (!searchEnabled || query.length < 3) {
      return undefined
    }

    const controller = new AbortController()
    const timeoutId = window.setTimeout(async () => {
      try {
        setIsLoading(true)
        setError('')
        const results = await suggestAddresses(query, controller.signal)
        setSuggestions(results)
        setHasSearched(true)
        setIsOpen(true)
        setActiveIndex(-1)
      } catch (requestError) {
        if (requestError.code !== 'ERR_CANCELED') {
          setSuggestions([])
          setHasSearched(true)
          setError('Não foi possível buscar endereços agora. Tente novamente.')
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }, 450)

    return () => {
      window.clearTimeout(timeoutId)
      controller.abort()
    }
  }, [searchEnabled, value])

  function handleInputChange(event) {
    const nextValue = event.target.value
    setSearchEnabled(true)
    setIsOpen(true)
    setError('')
    setSuggestions([])
    setActiveIndex(-1)
    setHasSearched(false)
    setIsLoading(false)
    onChange(nextValue)
  }

  function chooseSuggestion(suggestion) {
    setSearchEnabled(false)
    setIsOpen(false)
    setSuggestions([])
    setActiveIndex(-1)
    setHasSearched(false)
    setError('')
    onSelect(suggestion)
  }

  function handleKeyDown(event) {
    if (!isOpen || suggestions.length === 0) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((current) => (current + 1) % suggestions.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((current) => (current <= 0 ? suggestions.length - 1 : current - 1))
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault()
      chooseSuggestion(suggestions[activeIndex])
    } else if (event.key === 'Escape') {
      setIsOpen(false)
      setActiveIndex(-1)
    }
  }

  const showPanel = isOpen && value.trim().length >= 3 && (isLoading || hasSearched || error)

  return (
    <div
      className="address-field"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsOpen(false)
      }}
    >
      <label htmlFor={id}>{label}</label>
      <div className="address-combobox">
        <Search aria-hidden="true" size={18} />
        <input
          aria-autocomplete="list"
          aria-controls={listId}
          aria-describedby={describedBy}
          aria-expanded={showPanel}
          aria-invalid={invalid}
          aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
          autoComplete="off"
          id={id}
          ref={inputRef}
          onChange={handleInputChange}
          onFocus={() => {
            if (suggestions.length > 0 || hasSearched || error) setIsOpen(true)
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          role="combobox"
          type="text"
          value={value}
        />
        {isLoading && <LoaderCircle aria-hidden="true" className="address-loading-icon" size={18} />}

        {showPanel && (
          <div className="address-suggestions-panel">
            {isLoading && <p role="status">Buscando endereços...</p>}
            {!isLoading && error && <p className="address-suggestion-error">{error}</p>}
            {!isLoading && !error && hasSearched && suggestions.length === 0 && (
              <p>Nenhum local encontrado. Inclua a cidade e o estado na busca.</p>
            )}
            {!isLoading && suggestions.length > 0 && (
              <ul id={listId} role="listbox">
                {suggestions.map((suggestion, index) => (
                  <li
                    key={`${suggestion.rotulo}-${suggestion.latitude}-${suggestion.longitude}`}
                    role="presentation"
                  >
                    <button
                      aria-selected={index === activeIndex}
                      className={index === activeIndex ? 'active' : ''}
                      id={`${listId}-${index}`}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => chooseSuggestion(suggestion)}
                      role="option"
                      type="button"
                    >
                      <MapPin aria-hidden="true" size={17} />
                      <span>{suggestion.rotulo}</span>
                      <Check aria-hidden="true" size={15} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {!isLoading && !error && (
              <small className="address-attribution">
                Busca por Photon, dados de{' '}
                <a href="https://www.openstreetmap.org/copyright" rel="noreferrer" target="_blank">
                  OpenStreetMap
                </a>
              </small>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default AddressAutocomplete

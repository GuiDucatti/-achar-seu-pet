import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Check, Copy, HeartHandshake, MessageCircle, Phone, X } from 'lucide-react'
import AddressAutocomplete from './AddressAutocomplete.jsx'
import {
  buildTelephoneUrl,
  buildWhatsAppUrl,
  normalizeBrazilianPhone,
} from '../utils/contact.js'

function SightingForm({ error, isSubmitting, onClose, onSubmit, pet }) {
  const closeButtonRef = useRef(null)
  const panelRef = useRef(null)
  const onCloseRef = useRef(onClose)
  const reduceMotion = useReducedMotion()
  const [address, setAddress] = useState('')
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [locationError, setLocationError] = useState('')
  const [copyFeedback, setCopyFeedback] = useState('')
  const phone = normalizeBrazilianPhone(pet.contato)
  const ownerMessage = `Olá! Acho que vi ${pet.nome}. Estou entrando em contato pelo Achar seu Pet: ${window.location.href}`
  const ownerWhatsAppUrl = buildWhatsAppUrl(phone, ownerMessage)
  const ownerTelephoneUrl = buildTelephoneUrl(phone)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    closeButtonRef.current?.focus()

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onCloseRef.current()
        return
      }

      if (event.key !== 'Tab') return

      const focusable = panelRef.current?.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href]',
      )
      if (!focusable?.length) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  function handleSubmit(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    if (!selectedLocation) {
      setLocationError('Digite o local e escolha uma das sugestões da cidade correta.')
      return
    }

    onSubmit({
      latitude: selectedLocation.latitude,
      longitude: selectedLocation.longitude,
      endereco_label: selectedLocation.rotulo,
      descricao: formData.get('descricao'),
      contato_quem_viu: formData.get('contato_quem_viu'),
    })
  }

  async function copyContact() {
    try {
      await navigator.clipboard.writeText(pet.contato)
      setCopyFeedback('Contato copiado.')
    } catch {
      setCopyFeedback('Não foi possível copiar. Selecione o contato abaixo.')
    }
  }

  return (
    <motion.div
      animate={{ opacity: 1 }}
      className="modal-backdrop"
      exit={{ opacity: 0 }}
      initial={{ opacity: 0 }}
      onMouseDown={onClose}
      transition={{ duration: reduceMotion ? 0 : 0.16 }}
    >
      <motion.div
        animate={{ opacity: 1, scale: 1, y: 0 }}
        aria-labelledby="sighting-title"
        aria-modal="true"
        className="modal-panel"
        exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.99, y: reduceMotion ? 0 : 3 }}
        initial={reduceMotion ? false : { opacity: 0, scale: 0.98, y: 5 }}
        onMouseDown={(event) => event.stopPropagation()}
        ref={panelRef}
        role="dialog"
        transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <div className="modal-heading">
          <div>
            <h2 id="sighting-title">Vi esse pet!</h2>
            <p className="modal-intro">Obrigado por parar e olhar. Conte o que lembrar, mesmo que pareça pequeno.</p>
          </div>
          <button aria-label="Fechar formulário" className="modal-close" onClick={onClose} ref={closeButtonRef} type="button">
            <X aria-hidden="true" size={18} />
          </button>
        </div>

        <div className="sighting-pet-context">
          <img alt={`Foto de ${pet.nome}`} src={pet.foto} />
          <p>
            Descreva apenas o que você observou e indique o local com a maior precisão possível.
          </p>
        </div>

        <section className="sighting-contact-panel" aria-labelledby="owner-contact-title">
          <div>
            <strong id="owner-contact-title">Avise o responsável agora</strong>
            <span>{pet.contato}</span>
          </div>
          {phone ? (
            <div className="sighting-contact-actions">
              <a className="whatsapp-action" href={ownerWhatsAppUrl} rel="noreferrer" target="_blank">
                <MessageCircle aria-hidden="true" size={17} />
                WhatsApp
              </a>
              <a className="secondary-action" href={ownerTelephoneUrl}>
                <Phone aria-hidden="true" size={17} />
                Ligar
              </a>
            </div>
          ) : (
            <button className="secondary-action" onClick={copyContact} type="button">
              {copyFeedback === 'Contato copiado.' ? <Check aria-hidden="true" size={17} /> : <Copy aria-hidden="true" size={17} />}
              Copiar contato
            </button>
          )}
          <span aria-live="polite" className="sighting-copy-feedback">{copyFeedback}</span>
        </section>

        <form className="sighting-form" onSubmit={handleSubmit}>
          <div>
            <AddressAutocomplete
              describedBy={`sighting-location-help${locationError ? ' sighting-location-error' : ''}`}
              id="sighting-location"
              invalid={Boolean(locationError)}
              label="Onde você viu este pet?"
              onChange={(value) => {
                setAddress(value)
                setSelectedLocation(null)
                setLocationError('')
              }}
              onSelect={(suggestion) => {
                setAddress(suggestion.rotulo)
                setSelectedLocation(suggestion)
                setLocationError('')
              }}
              placeholder="Digite a rua, bairro ou ponto de referência"
              value={address}
            />
            <span className="form-help" id="sighting-location-help">
              Escolha uma sugestão para registrar o ponto correto sem digitar coordenadas.
            </span>
            {locationError && <span className="field-error" id="sighting-location-error">{locationError}</span>}
            {selectedLocation && (
              <span className="address-selected-note" role="status">
                <Check aria-hidden="true" size={14} /> Local selecionado
              </span>
            )}
          </div>

          <label>
            O que você viu?
            <textarea name="descricao" rows="4" />
          </label>

          <label>
            Seu contato para o tutor (opcional)
            <input name="contato_quem_viu" placeholder="Telefone ou WhatsApp para o responsável retornar" type="text" />
          </label>
          <span className="form-help">Seu relato, local exato e contato ficam visíveis somente para o tutor.</span>

          <AnimatePresence initial={false}>
            {error && (
              <motion.p
                animate={{ opacity: 1, y: 0 }}
                className="feedback error"
                exit={{ opacity: 0 }}
                initial={reduceMotion ? false : { opacity: 0, y: -3 }}
                transition={{ duration: reduceMotion ? 0 : 0.16 }}
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <div className="modal-actions">
            <button className="secondary-action" onClick={onClose} type="button">
              Cancelar
            </button>
            <button className="primary-action" disabled={isSubmitting} type="submit">
              <HeartHandshake aria-hidden="true" size={17} />
              {isSubmitting ? 'Enviando...' : 'Registrar avistamento'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default SightingForm

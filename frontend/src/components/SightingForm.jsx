import { useEffect, useRef } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { HeartHandshake, X } from 'lucide-react'

function SightingForm({ error, isSubmitting, onClose, onSubmit, pet }) {
  const closeButtonRef = useRef(null)
  const panelRef = useRef(null)
  const onCloseRef = useRef(onClose)
  const reduceMotion = useReducedMotion()

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

    onSubmit({
      latitude: Number(formData.get('latitude')),
      longitude: Number(formData.get('longitude')),
      descricao: formData.get('descricao'),
      contato_quem_viu: formData.get('contato_quem_viu'),
    })
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
            <p className="modal-intro">Obrigado por parar e olhar. Conte o que lembrar, mesmo que pareca pequeno.</p>
          </div>
          <button aria-label="Fechar formulario" className="modal-close" onClick={onClose} ref={closeButtonRef} type="button">
            <X aria-hidden="true" size={18} />
          </button>
        </div>

        <div className="sighting-pet-context">
          <img alt={`Foto de ${pet.nome}`} src={pet.foto} />
          <p>
            Descreva apenas o que voce observou e indique o local com a maior precisao possivel.
          </p>
        </div>

        <form className="sighting-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              Latitude
              <input max="90" min="-90" name="latitude" required step="any" type="number" />
            </label>
            <label>
              Longitude
              <input max="180" min="-180" name="longitude" required step="any" type="number" />
            </label>
          </div>

          <label>
            O que voce viu?
            <textarea name="descricao" rows="4" />
          </label>

          <label>
            Seu contato (opcional)
            <input name="contato_quem_viu" type="text" />
          </label>

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

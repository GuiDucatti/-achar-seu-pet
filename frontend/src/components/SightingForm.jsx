import { HeartHandshake, X } from 'lucide-react'

function SightingForm({ error, isSubmitting, onClose, onSubmit, pet }) {
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
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
        aria-labelledby="sighting-title"
        aria-modal="true"
        className="modal-panel"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="modal-heading">
          <div>
            <h2 id="sighting-title">Vi esse pet!</h2>
            <p className="modal-intro">Obrigado por parar e olhar. Conte o que lembrar, mesmo que pareca pequeno.</p>
          </div>
          <button aria-label="Fechar formulario" className="modal-close" onClick={onClose} type="button">
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

          {error && <p className="feedback error">{error}</p>}

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
      </div>
    </div>
  )
}

export default SightingForm

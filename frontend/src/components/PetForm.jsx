import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Cat,
  Check,
  CheckCircle2,
  Dog,
  ImagePlus,
  MapPin,
  PawPrint,
  Phone,
  UploadCloud,
} from 'lucide-react'
import AddressAutocomplete from './AddressAutocomplete.jsx'
import { formatDate } from '../utils/formatters.js'
import { parseCoordinatePair } from '../utils/publicLocation.js'

const initialPetValues = {
  nome: '',
  especie: 'cachorro',
  raca: '',
  cor: '',
  sexo: 'macho',
  caracteristicas: '',
  estado: '',
  cidade: '',
  endereco_texto: '',
  latitude: null,
  longitude: null,
  data_desaparecimento: '',
  descricao: '',
  contato: '',
  status: 'P',
}

const steps = [
  {
    title: 'Quem desapareceu?',
    description: 'Comece pela foto e pelo nome. E a parte que ajuda a reconhecer de longe.',
  },
  {
    title: 'Como ele e?',
    description: 'Escolha os detalhes que fariam alguem parar e olhar mais uma vez.',
  },
  {
    title: 'Onde foi visto?',
    description: 'Uma regiao e uma data ajudam a rede a procurar no lugar certo.',
  },
  {
    title: 'Como avisar voce?',
    description: 'Revise a historia, confira o contato e publique quando estiver pronto.',
  },
]

const speciesOptions = [
  { label: 'Cachorro', value: 'cachorro', icon: Dog },
  { label: 'Gato', value: 'gato', icon: Cat },
]

const sexOptions = [
  { label: 'Macho', value: 'macho' },
  { label: 'Femea', value: 'femea' },
]

function PetPreview({ photoPreview, values }) {
  const reduceMotion = useReducedMotion()

  return (
    <aside className="listing-preview" aria-label="Preview da publicacao">
      <div className="preview-label">
        <span>Assim vai aparecer</span>
        <CheckCircle2 aria-hidden="true" size={17} />
      </div>
      <div className="preview-photo-wrap">
        {photoPreview ? (
          <motion.img
            animate={{ opacity: 1 }}
            alt="Preview da foto do pet"
            initial={reduceMotion ? false : { opacity: 0 }}
            key={photoPreview}
            src={photoPreview}
            transition={{ duration: reduceMotion ? 0 : 0.18 }}
          />
        ) : (
          <div className="preview-photo-empty">
            <PawPrint aria-hidden="true" size={28} />
            <span>Sua foto aparece aqui</span>
          </div>
        )}
      </div>
      <div className="preview-content">
        <span className={`preview-status ${values.status === 'E' ? 'found' : ''}`}>
          {values.status === 'E' ? 'Encontrado' : 'Perdido'}
        </span>
        <h3>{values.nome || 'Nome do pet'}</h3>
        <p className="preview-description">
          {values.descricao || 'A descricao da historia aparecera neste espaco.'}
        </p>
        <div className="preview-meta">
          <span>
            <MapPin aria-hidden="true" size={14} />
            {values.cidade || 'Sua cidade'}{values.estado ? `, ${values.estado.toUpperCase()}` : ''}
          </span>
          <span>
            <CalendarDays aria-hidden="true" size={14} />
            {formatDate(values.data_desaparecimento)}
          </span>
        </div>
      </div>
    </aside>
  )
}

function PetForm({ initialValues = {}, isSubmitting, onSubmit, submitLabel }) {
  const mergedInitialValues = { ...initialPetValues, ...initialValues }
  const [values, setValues] = useState(mergedInitialValues)
  const [currentStep, setCurrentStep] = useState(0)
  const [stepDirection, setStepDirection] = useState(1)
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(
    typeof mergedInitialValues.foto === 'string' ? mergedInitialValues.foto : '',
  )
  const [errors, setErrors] = useState({})
  const stepHeadingRef = useRef(null)
  const objectUrlRef = useRef('')
  const isEditing = Boolean(initialValues.id)
  const reduceMotion = useReducedMotion()
  const selectedLocation = parseCoordinatePair(values.latitude, values.longitude)

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
      }
    }
  }, [])

  useEffect(() => {
    stepHeadingRef.current?.focus()
  }, [currentStep])

  function updateField(name, value) {
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
  }

  function updateLocationField(name, value) {
    setValues((current) => ({
      ...current,
      [name]: value,
      latitude: null,
      longitude: null,
    }))
    setErrors((current) => ({ ...current, [name]: '' }))
  }

  function handleAddressSelect(suggestion) {
    setValues((current) => ({
      ...current,
      endereco_texto: suggestion.endereco,
      cidade: suggestion.cidade,
      estado: suggestion.estado,
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
    }))
    setErrors((current) => ({
      ...current,
      endereco_texto: '',
      cidade: '',
      estado: '',
    }))
  }

  function handleFile(file) {
    if (!file) {
      return
    }

    const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

    if (!acceptedTypes.includes(file.type)) {
      setErrors((current) => ({ ...current, foto: 'Escolha uma imagem JPG, PNG, WebP ou GIF.' }))
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors((current) => ({ ...current, foto: 'A foto deve ter no maximo 5 MB.' }))
      return
    }

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
    }

    objectUrlRef.current = URL.createObjectURL(file)
    setPhotoFile(file)
    setPhotoPreview(objectUrlRef.current)
    setErrors((current) => ({ ...current, foto: '' }))
  }

  function handleFileChange(event) {
    handleFile(event.target.files?.[0])
  }

  function handleDrop(event) {
    event.preventDefault()
    handleFile(event.dataTransfer.files?.[0])
  }

  function removePhoto() {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = ''
    }

    setPhotoFile(null)
    setPhotoPreview('')
    setValues((current) => ({ ...current, foto: null }))
  }

  function validateStep(stepIndex) {
    const nextErrors = {}

    if (stepIndex === 0) {
      if (!values.nome.trim()) {
        nextErrors.nome = 'Conte como ele se chama.'
      }

      if (!photoFile && !photoPreview) {
        nextErrors.foto = 'Adicione uma foto para facilitar o reconhecimento.'
      }
    }

    if (stepIndex === 1) {
      if (!values.raca.trim()) nextErrors.raca = 'Informe a raca ou escreva "nao sei".'
      if (!values.cor.trim()) nextErrors.cor = 'Qual e a cor predominante?'
      if (!values.caracteristicas.trim()) nextErrors.caracteristicas = 'Conte um detalhe marcante.'
    }

    if (stepIndex === 2) {
      if (!values.estado.trim()) nextErrors.estado = 'Informe o estado.'
      if (!values.cidade.trim()) nextErrors.cidade = 'Informe a cidade.'
      if (!values.endereco_texto.trim()) {
        nextErrors.endereco_texto = 'Busque a rua ou informe um ponto de referencia.'
      }
      if (!values.data_desaparecimento) nextErrors.data_desaparecimento = 'Informe a data.'
    }

    if (stepIndex === 3) {
      if (!values.descricao.trim()) nextErrors.descricao = 'Descreva o que aconteceu.'
      if (!values.contato.trim()) nextErrors.contato = 'Informe como as pessoas podem avisar voce.'
    }

    return nextErrors
  }

  function goToStep(nextStep) {
    if (nextStep > currentStep) {
      const stepErrors = validateStep(currentStep)
      setErrors((current) => ({ ...current, ...stepErrors }))

      if (Object.keys(stepErrors).length > 0) {
        return
      }
    }

    setStepDirection(nextStep > currentStep ? 1 : -1)
    setCurrentStep(nextStep)
  }

  function handleSubmit(event) {
    event.preventDefault()
    const allErrors = [0, 1, 2, 3].reduce(
      (currentErrors, stepIndex) => ({ ...currentErrors, ...validateStep(stepIndex) }),
      {},
    )

    if (Object.keys(allErrors).length > 0) {
      const firstInvalidStep = [0, 1, 2, 3].find(
        (stepIndex) => Object.keys(validateStep(stepIndex)).length > 0,
      )
      setErrors(allErrors)
      setStepDirection((firstInvalidStep ?? 0) >= currentStep ? 1 : -1)
      setCurrentStep(firstInvalidStep ?? 0)
      return
    }

    onSubmit({
      ...values,
      foto: photoFile || undefined,
    })
  }

  function fieldError(name) {
    return errors[name] ? (
      <motion.span
        animate={{ opacity: 1, y: 0 }}
        className="field-error"
        id={`${name}-error`}
        initial={reduceMotion ? false : { opacity: 0, y: -2 }}
        transition={{ duration: reduceMotion ? 0 : 0.16 }}
      >
        {errors[name]}
      </motion.span>
    ) : null
  }

  return (
    <form className="pet-form guided-pet-form" onSubmit={handleSubmit}>
      <div className="wizard-header">
        <div className="wizard-header-copy">
          <span>Etapa {currentStep + 1} de {steps.length}</span>
          <strong>{steps[currentStep].title}</strong>
        </div>
        <div className="wizard-progress-track" aria-hidden="true">
          <span style={{ transform: `scaleX(${(currentStep + 1) / steps.length})` }} />
        </div>
        <ol className="wizard-step-list" aria-label="Etapas do cadastro">
          {steps.map((step, index) => (
            <li className={index === currentStep ? 'current' : index < currentStep ? 'complete' : ''} key={step.title}>
              <span>{index < currentStep ? <Check aria-hidden="true" size={13} /> : index + 1}</span>
              <small>{step.title}</small>
            </li>
          ))}
        </ol>
      </div>

      <section className="wizard-step-panel" aria-labelledby="wizard-step-title">
        <h2 id="wizard-step-title" ref={stepHeadingRef} tabIndex="-1">{steps[currentStep].title}</h2>
        <p className="wizard-step-description">{steps[currentStep].description}</p>

        <motion.div
          animate={{ opacity: 1, x: 0 }}
          className="wizard-step-content"
          initial={reduceMotion ? false : { opacity: 0.72, x: stepDirection * 8 }}
          key={currentStep}
          transition={{ duration: reduceMotion ? 0 : 0.2, ease: [0.2, 0.8, 0.2, 1] }}
        >
        {currentStep === 0 && (
          <div className="identity-step">
            <div>
              <div className={`photo-dropzone ${errors.foto ? 'has-error' : ''}`} onDragOver={(event) => event.preventDefault()} onDrop={handleDrop}>
                <input
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="sr-only"
                  id="pet-foto"
                  name="foto"
                  onChange={handleFileChange}
                  type="file"
                />
                <label htmlFor="pet-foto">
                  {photoPreview ? (
                    <img alt="Preview da foto escolhida" src={photoPreview} />
                  ) : (
                    <span className="photo-upload-prompt">
                      <span className="photo-upload-icon"><ImagePlus aria-hidden="true" size={27} /></span>
                      <strong>Adicione a melhor foto</strong>
                      <small>Toque para escolher ou arraste uma imagem</small>
                    </span>
                  )}
                </label>
                {photoPreview && (
                  <button className="photo-change" onClick={removePhoto} type="button">
                    Trocar foto
                  </button>
                )}
              </div>
              {fieldError('foto')}
              <span className="form-help">JPG, PNG, WebP ou GIF, ate 5 MB.</span>
            </div>

            <div className="wizard-field-stack">
              <label htmlFor="pet-nome">
                Nome do pet
                <input
                  aria-describedby={errors.nome ? 'nome-error' : undefined}
                  aria-invalid={Boolean(errors.nome)}
                  id="pet-nome"
                  name="nome"
                  onChange={(event) => updateField('nome', event.target.value)}
                  placeholder="Como ele e chamado?"
                  type="text"
                  value={values.nome}
                />
                {fieldError('nome')}
              </label>

              <fieldset className="choice-fieldset">
                <legend>Que tipo de pet e?</legend>
                <div className="choice-row">
                  {speciesOptions.map(({ icon: Icon, label, value }) => (
                    <button
                      aria-pressed={values.especie === value}
                      className={`visual-choice ${values.especie === value ? 'selected' : ''}`}
                      key={value}
                      onClick={() => updateField('especie', value)}
                      type="button"
                    >
                      <Icon aria-hidden="true" size={20} />
                      <span>{label}</span>
                      <Check aria-hidden="true" className="choice-check" size={15} />
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="wizard-field-stack">
            <div className="form-grid">
              <label htmlFor="pet-raca">
                Raca
                <input aria-invalid={Boolean(errors.raca)} id="pet-raca" name="raca" onChange={(event) => updateField('raca', event.target.value)} placeholder="Ex.: vira-lata" type="text" value={values.raca} />
                {fieldError('raca')}
              </label>
              <label htmlFor="pet-cor">
                Cor predominante
                <input aria-invalid={Boolean(errors.cor)} id="pet-cor" name="cor" onChange={(event) => updateField('cor', event.target.value)} placeholder="Ex.: caramelo e branco" type="text" value={values.cor} />
                {fieldError('cor')}
              </label>
            </div>

            <fieldset className="choice-fieldset">
              <legend>Sexo</legend>
              <div className="choice-row compact">
                {sexOptions.map(({ label, value }) => (
                  <button aria-pressed={values.sexo === value} className={`visual-choice ${values.sexo === value ? 'selected' : ''}`} key={value} onClick={() => updateField('sexo', value)} type="button">
                    <span>{label}</span>
                    <Check aria-hidden="true" className="choice-check" size={15} />
                  </button>
                ))}
              </div>
            </fieldset>

            <label htmlFor="pet-caracteristicas">
              O detalhe que mais ajuda a reconhecer
              <textarea aria-invalid={Boolean(errors.caracteristicas)} id="pet-caracteristicas" name="caracteristicas" onChange={(event) => updateField('caracteristicas', event.target.value)} placeholder="Uma mancha, coleira, jeito de andar ou qualquer sinal marcante." rows="4" value={values.caracteristicas} />
              {fieldError('caracteristicas')}
            </label>
          </div>
        )}

        {currentStep === 2 && (
          <div className="wizard-field-stack">
            <div className="location-intro">
              <MapPin aria-hidden="true" size={21} />
              <div>
                <strong>Vamos marcar uma area, nao um endereco.</strong>
                <span>A localizacao publica fica aproximada para proteger voce e o pet.</span>
              </div>
            </div>
            <div>
              <AddressAutocomplete
                describedBy={`regiao-help${errors.endereco_texto ? ' endereco_texto-error' : ''}`}
                id="pet-regiao"
                invalid={Boolean(errors.endereco_texto)}
                label="Rua ou local onde desapareceu"
                onChange={(value) => updateLocationField('endereco_texto', value)}
                onSelect={handleAddressSelect}
                placeholder="Ex.: Rua das Flores, Birigui - SP"
                value={values.endereco_texto}
              />
              <span className="form-help" id="regiao-help">
                Digite pelo menos 3 letras e escolha a cidade correta. Nao informe o numero da casa.
              </span>
              {fieldError('endereco_texto')}
              {selectedLocation && (
                <span className="address-selected-note" role="status">
                  <Check aria-hidden="true" size={14} />
                  Local pronto para aparecer como area aproximada no mapa.
                </span>
              )}
            </div>
            <div className="form-grid location-fields">
              <label htmlFor="pet-cidade">
                Cidade
                <input aria-invalid={Boolean(errors.cidade)} id="pet-cidade" name="cidade" onChange={(event) => updateLocationField('cidade', event.target.value)} placeholder="Preenchida ao escolher a rua" type="text" value={values.cidade} />
                {fieldError('cidade')}
              </label>
              <label htmlFor="pet-estado">
                Estado
                <input aria-invalid={Boolean(errors.estado)} id="pet-estado" maxLength="2" name="estado" onChange={(event) => updateLocationField('estado', event.target.value.toUpperCase())} placeholder="UF" type="text" value={values.estado} />
                {fieldError('estado')}
              </label>
            </div>
            <label htmlFor="pet-data">
              Data do desaparecimento
              <input aria-invalid={Boolean(errors.data_desaparecimento)} id="pet-data" name="data_desaparecimento" onChange={(event) => updateField('data_desaparecimento', event.target.value)} type="date" value={values.data_desaparecimento} />
              {fieldError('data_desaparecimento')}
            </label>
          </div>
        )}

        {currentStep === 3 && (
          <div className="review-step">
            <div className="review-fields">
              <label htmlFor="pet-descricao">
                Conte a historia
                <textarea aria-invalid={Boolean(errors.descricao)} id="pet-descricao" name="descricao" onChange={(event) => updateField('descricao', event.target.value)} placeholder="O que aconteceu? O que alguem precisa saber para ajudar?" rows="5" value={values.descricao} />
                {fieldError('descricao')}
              </label>
              <label htmlFor="pet-contato">
                Como entrar em contato
                <span className="input-with-icon">
                  <Phone aria-hidden="true" size={17} />
                  <input aria-invalid={Boolean(errors.contato)} id="pet-contato" name="contato" onChange={(event) => updateField('contato', event.target.value)} placeholder="Telefone, WhatsApp ou outro contato" type="text" value={values.contato} />
                </span>
                {fieldError('contato')}
              </label>
              <label htmlFor="pet-status">
                Situacao da historia
                <select id="pet-status" name="status" onChange={(event) => updateField('status', event.target.value)} value={values.status}>
                  <option value="P">Pet perdido</option>
                  <option value="E">Pet encontrado</option>
                </select>
              </label>
            </div>
            <PetPreview photoPreview={photoPreview} values={values} />
          </div>
        )}
        </motion.div>
      </section>

      <div className="wizard-actions">
        {currentStep > 0 ? (
          <button className="secondary-action" onClick={() => goToStep(currentStep - 1)} type="button">
            <ArrowLeft aria-hidden="true" size={17} />
            Voltar
          </button>
        ) : (
          <span className="wizard-action-note"><UploadCloud aria-hidden="true" size={16} /> Voce podera revisar tudo antes de publicar.</span>
        )}

        {currentStep < steps.length - 1 ? (
          <button className="primary-action" onClick={() => goToStep(currentStep + 1)} type="button">
            Continuar
            <ArrowRight aria-hidden="true" size={17} />
          </button>
        ) : (
          <button className="primary-action" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Publicando...' : submitLabel}
            <CheckCircle2 aria-hidden="true" size={17} />
          </button>
        )}
      </div>
      {isEditing && <span className="form-help">Suas alteracoes serao salvas neste cadastro.</span>}
    </form>
  )
}

export default PetForm

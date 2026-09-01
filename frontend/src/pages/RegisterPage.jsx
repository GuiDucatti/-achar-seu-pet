import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { HeartHandshake } from 'lucide-react'
import petsRunningHero from '../assets/pets-running-hero.jpg'
import { useAuth } from '../hooks/useAuth.js'
import { getApiErrorMessage } from '../utils/apiErrors.js'

function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    try {
      setError('')
      setIsSubmitting(true)
      await register(formData)
      navigate('/minha-conta', { replace: true })
    } catch (err) {
      console.error(err)
      setError(getApiErrorMessage(err, 'Nao foi possivel criar sua conta. Confira os dados.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="auth-view">
      <div className="auth-layout">
        <div className="auth-copy">
          <img alt="Cachorro e gato correndo em um parque" src={petsRunningHero} />
          <div>
            <HeartHandshake aria-hidden="true" size={22} />
            <strong>Uma conta, muitas possibilidades de ajudar.</strong>
            <p>Publique uma busca, acompanhe avistamentos e faca parte de uma rede mais atenta.</p>
          </div>
        </div>
        <div className="auth-panel">
      <div className="page-heading">
        <h1>Entre para essa rede de cuidado.</h1>
        <p>Crie sua conta e tenha um lugar seguro para organizar cada busca.</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Usuario
          <input
            autoComplete="username"
            name="username"
            onChange={handleChange}
            required
            type="text"
            value={formData.username}
          />
        </label>

        <label>
          Email
          <input
            autoComplete="email"
            name="email"
            onChange={handleChange}
            required
            type="email"
            value={formData.email}
          />
        </label>

        <label>
          Senha
          <input
            autoComplete="new-password"
            minLength={8}
            name="password"
            onChange={handleChange}
            required
            type="password"
            value={formData.password}
          />
        </label>

        {error && <p className="feedback error">{error}</p>}

        <button className="primary-action" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Criando...' : 'Criar conta'}
        </button>
      </form>

      <p className="auth-note">
        Ja tem conta? <Link to="/login">Entrar</Link>
      </p>
        </div>
      </div>
    </section>
  )
}

export default RegisterPage

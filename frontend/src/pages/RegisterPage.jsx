import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { HeartHandshake } from 'lucide-react'
import registerImage from '../assets/editorial/register.webp'
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
      setError(getApiErrorMessage(err, 'Não foi possível criar sua conta. Confira os dados.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="auth-view register-view">
      <div className="auth-layout">
        <div className="auth-copy register-copy">
          <img
            alt="Pessoa segurando seu gato em um ambiente doméstico"
            decoding="async"
            height="750"
            loading="lazy"
            src={registerImage}
            width="1200"
          />
          <div>
            <HeartHandshake aria-hidden="true" size={22} />
            <strong>Sua conta guarda a busca em um só lugar.</strong>
            <p>Publique o pet, acompanhe novas pistas e atualize a situação quando ele voltar para casa.</p>
          </div>
        </div>
        <div className="auth-panel">
      <div className="page-heading">
        <h1>Entre para essa rede de cuidado.</h1>
        <p>Crie sua conta e tenha um lugar seguro para organizar cada busca.</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Usuário
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
          E-mail
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
        Já tem conta? <Link to="/login">Entrar</Link>
      </p>
        </div>
      </div>
    </section>
  )
}

export default RegisterPage

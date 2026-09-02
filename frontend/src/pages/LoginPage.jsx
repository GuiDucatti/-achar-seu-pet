import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { PawPrint } from 'lucide-react'
import loginImage from '../assets/editorial/login.webp'
import { useAuth } from '../hooks/useAuth.js'
import { getApiErrorMessage } from '../utils/apiErrors.js'

function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [formData, setFormData] = useState({ username: '', password: '' })
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
      await login(formData)
      navigate(location.state?.from?.pathname || '/minha-conta', { replace: true })
    } catch (err) {
      console.error(err)
      setError(
        err.response?.status === 401
          ? 'Email, usuario ou senha invalidos.'
          : getApiErrorMessage(err, 'Nao foi possivel entrar agora.'),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="auth-view login-view">
      <div className="auth-layout">
        <div className="auth-copy login-copy">
          <img
            alt="Pessoa acessando o notebook com seu gato no colo"
            decoding="async"
            height="680"
            loading="lazy"
            src={loginImage}
            width="960"
          />
          <div>
            <PawPrint aria-hidden="true" size={22} />
            <strong>Voltar a sua conta e voltar para a busca.</strong>
            <p>
              Revise os dados, acompanhe avistamentos e atualize o anuncio quando
              houver novidade.
            </p>
          </div>
        </div>
        <div className="auth-panel">
      <div className="page-heading">
        <h1>Vamos continuar essa busca?</h1>
        <p>Entre com seu email ou usuario. A rede esta esperando por voce.</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Email ou usuario
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
          Senha
          <input
            autoComplete="current-password"
            name="password"
            onChange={handleChange}
            required
            type="password"
            value={formData.password}
          />
        </label>

        {error && <p className="feedback error">{error}</p>}

        <button className="primary-action" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <p className="auth-note">
        Ainda nao tem conta? <Link to="/criar-conta">Criar conta</Link>
      </p>
        </div>
      </div>
    </section>
  )
}

export default LoginPage

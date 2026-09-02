import { lazy, Suspense, useState } from 'react'
import { NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { LogIn, Menu, PawPrint, UserPlus, X } from 'lucide-react'
import './App.css'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import { useAuth } from './hooks/useAuth.js'
import AccountPage from './pages/AccountPage.jsx'
import AboutPage from './pages/AboutPage.jsx'
import CreatePetPage from './pages/CreatePetPage.jsx'
import EditPetPage from './pages/EditPetPage.jsx'
import Home from './pages/Home.jsx'
import LoginPage from './pages/LoginPage.jsx'
import PetsPage from './pages/PetsPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'

const PetDetailPage = lazy(() => import('./pages/PetDetailPage.jsx'))

function App() {
  const { isAuthenticated, logout, user } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const location = useLocation()
  const reduceMotion = useReducedMotion()

  function closeMobileMenu() {
    setIsMenuOpen(false)
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <NavLink className="brand" to="/">
          <span className="brand-mark">
            <PawPrint aria-hidden="true" size={21} />
          </span>
          <span className="brand-copy">
            <strong>Achar seu Pet</strong>
            <small>Uma busca feita em conjunto</small>
          </span>
        </NavLink>

        <button
          aria-controls="main-navigation"
          aria-expanded={isMenuOpen}
          aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
          className="menu-toggle"
          onClick={() => setIsMenuOpen((current) => !current)}
          title={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
          type="button"
        >
          {isMenuOpen ? <X aria-hidden="true" size={19} /> : <Menu aria-hidden="true" size={19} />}
        </button>

        <nav
          className={`main-nav ${isMenuOpen ? 'open' : ''}`}
          id="main-navigation"
          aria-label="Navegacao principal"
        >
          <NavLink onClick={closeMobileMenu} to="/">Inicio</NavLink>
          <NavLink onClick={closeMobileMenu} to="/pets">Pets perdidos</NavLink>
          <NavLink onClick={closeMobileMenu} to="/encontrados">Encontrados</NavLink>
          <NavLink onClick={closeMobileMenu} to="/quem-somos">Quem somos</NavLink>
          <NavLink onClick={closeMobileMenu} to="/cadastrar-pet">Cadastrar pet</NavLink>
          {isAuthenticated ? (
            <>
              <NavLink onClick={closeMobileMenu} to="/minha-conta">
                {user?.username || 'Minha conta'}
              </NavLink>
              <button
                className="nav-button"
                onClick={() => {
                  closeMobileMenu()
                  logout()
                }}
                type="button"
              >
                Sair
              </button>
            </>
          ) : (
            <>
              <NavLink onClick={closeMobileMenu} to="/login">
                <LogIn aria-hidden="true" size={16} />
                Entrar
              </NavLink>
              <NavLink onClick={closeMobileMenu} to="/criar-conta">
                <UserPlus aria-hidden="true" size={16} />
                Criar conta
              </NavLink>
            </>
          )}
        </nav>
      </header>

      <main className="app-main">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="route-stage"
            initial={reduceMotion ? false : { opacity: 0.96, y: 3 }}
            key={location.pathname}
            transition={{ duration: reduceMotion ? 0 : 0.16, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <Suspense fallback={<p className="feedback">Carregando pagina...</p>}>
              <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/pets" element={<PetsPage title="Pets perdidos" status="P" />} />
          <Route path="/pets/:id" element={<PetDetailPage />} />
          <Route path="/encontrados" element={<PetsPage title="Pets encontrados" status="E" />} />
          <Route path="/quem-somos" element={<AboutPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/criar-conta" element={<RegisterPage />} />
          <Route
            path="/minha-conta"
            element={
              <ProtectedRoute>
                <AccountPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cadastrar-pet"
            element={
              <ProtectedRoute>
                <CreatePetPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pets/:id/editar"
            element={
              <ProtectedRoute>
                <EditPetPage />
              </ProtectedRoute>
            }
          />
              </Routes>
            </Suspense>
          </motion.div>
      </main>

      <footer className="app-footer">
        <div className="footer-brand">
          <PawPrint aria-hidden="true" size={18} />
          <strong>Achar seu Pet</strong>
        </div>
        <p>Uma busca feita com cuidado, bairro por bairro.</p>
        <NavLink to="/quem-somos">Conheca a rede</NavLink>
      </footer>
    </div>
  )
}

export default App

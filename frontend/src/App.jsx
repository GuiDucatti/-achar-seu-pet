import { lazy, Suspense, useState } from 'react'
import { NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { LogIn, Menu, PawPrint, UserPlus, X } from 'lucide-react'
import './App.css'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import { useAuth } from './hooks/useAuth.js'

const AccountPage = lazy(() => import('./pages/AccountPage.jsx'))
const AboutPage = lazy(() => import('./pages/AboutPage.jsx'))
const CreatePetPage = lazy(() => import('./pages/CreatePetPage.jsx'))
const EditPetPage = lazy(() => import('./pages/EditPetPage.jsx'))
const Home = lazy(() => import('./pages/Home.jsx'))
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx'))
const PetDetailPage = lazy(() => import('./pages/PetDetailPage.jsx'))
const PetsPage = lazy(() => import('./pages/PetsPage.jsx'))
const RegisterPage = lazy(() => import('./pages/RegisterPage.jsx'))

function App() {
  const { isAuthenticated, logout, user } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const location = useLocation()

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
          aria-label="Navegação principal"
        >
          <NavLink onClick={closeMobileMenu} to="/">Início</NavLink>
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
          <div className="route-stage" key={location.pathname}>
            <Suspense fallback={<p className="feedback">Carregando página...</p>}>
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
          <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </div>
      </main>

      <footer className="app-footer">
        <div className="footer-brand">
          <PawPrint aria-hidden="true" size={18} />
          <strong>Achar seu Pet</strong>
        </div>
        <p>Uma busca feita com cuidado, bairro por bairro.</p>
        <NavLink to="/quem-somos">Conheça a rede</NavLink>
      </footer>
    </div>
  )
}

export default App

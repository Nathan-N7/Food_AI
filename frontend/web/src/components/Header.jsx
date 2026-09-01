import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import './Header.css'
import Friends from './Friends.jsx'
import LanguageSelector from './LanguageSelector.jsx'
import './LanguageSelector.css'
import { useTranslation } from 'react-i18next'

const Header = ({ user: customUser, avatarUrl = null }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState(customUser || null)
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()

  // Sincroniza com localStorage se não foi passado via prop
  useEffect(() => {
    if (customUser) {
      setCurrentUser(customUser)
      return
    }

    const saved = localStorage.getItem('user')
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved))
      } catch {
        setCurrentUser(null)
      }
    }
  }, [customUser])

  // Fecha o menu ao trocar de rota
  useEffect(() => {
    setIsMenuOpen(false)
  }, [location.pathname])

  // Fecha o menu com a tecla Escape
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setIsMenuOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setIsMenuOpen(false)
    navigate('/login')
  }

  // Define nome de exibição e iniciais do avatar
  const displayName =
    currentUser?.nickname || currentUser?.username || 'Visitante'

  const getInitials = (name) => {
    if (!name) return 'AI'
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  const effectiveAvatarUrl = avatarUrl || currentUser?.avatar || null

  const menuItems = [
    { label: t('navigation.dashboard'), path: '/dashboard', icon: '📊' },
    { label: t('navigation.profile'), path: '/profile', icon: '👤' },
    { label: t('navigation.friends'), path: '/friends', icon: '👥' },
    { label: t('navigation.generate'), path: '/generate', icon: '✨' },
    { label: t('navigation.history'), path: '/history', icon: '📜' },
    { label: t('navigation.privacy'), path: '/privacy', icon: '🔒' },
    { label: t('navigation.terms'), path: '/terms', icon: '📄' },
  
  ]

  return (
    <>
      <header className="fai-header">
        <div className="fai-header-container">
          {/* Lado Esquerdo: Menu Hambúrguer e Logo */}
          <div className="fai-header-left">
            <button
              type="button"
              className={`fai-hamburger-btn ${isMenuOpen ? 'is-active' : ''}`}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? t('navigation.closeMenu') : t('navigation.openMenu')}
              aria-expanded={isMenuOpen}
            >
              <span className="fai-hamburger-line"></span>
              <span className="fai-hamburger-line"></span>
              <span className="fai-hamburger-line"></span>
            </button>

            <Link to="/dashboard" className="fai-brand">
              <span className="fai-brand-icon">🍕</span>
              <h1 className="fai-brand-title">Food AI</h1>
              <span className="fai-brand-badge">PRO</span>
            </Link>
          </div>

          {/* Lado Direito: Saudação e Avatar */}
          <div className="fai-header-right">
            <div className="fai-user-greeting">
              <span className="fai-greeting-label">{t('navigation.welcome')}</span>
              <strong className="fai-user-name" title={displayName}>
                Olá, {displayName}
              </strong>
            </div>

            <div
              className="fai-avatar-wrapper"
              title={`Perfil de ${displayName}`}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <div className="fai-avatar-circle">
                {effectiveAvatarUrl ? (
                  <img src={effectiveAvatarUrl} alt={`Avatar de ${displayName}`} />
                ) : (
                  <span>{getInitials(displayName)}</span>
                )}
              </div>
              <span className="fai-status-indicator"></span>
            </div>
          </div>
        </div>
      </header>

      {/* Backdrop / Overlay do Drawer */}
      <div
        className={`fai-drawer-overlay ${isMenuOpen ? 'is-open' : ''}`}
        onClick={() => setIsMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Menu Lateral (Drawer Hambúrguer) */}
      <aside
        className={`fai-drawer ${isMenuOpen ? 'is-open' : ''}`}
                aria-label={t('navigation.openMenu')}
      >
        <div className="fai-drawer-header">
          <div className="fai-brand">
            <span className="fai-brand-icon">🍕</span>
            <span className="fai-brand-title">Menu Food AI</span>
          </div>
          <button
            type="button"
            className="fai-drawer-close"
            onClick={() => setIsMenuOpen(false)}
            aria-label={t('navigation.closeMenu')}
          >
            ✕
          </button>
        </div>

        <nav className="fai-drawer-nav">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`fai-nav-item ${isActive ? 'is-active' : ''}`}
              >
                <span className="fai-nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="fai-drawer-footer">
          <button
            type="button"
            className="fai-logout-btn"
            onClick={handleLogout}
          >
            <span className="fai-nav-icon">🚪</span>
            <span>{t('navigation.logout')}</span>
          </button>
        </div>
      </aside>
      <div className="fai-language-selector"><LanguageSelector /></div>
    </>
  )
}

export default Header

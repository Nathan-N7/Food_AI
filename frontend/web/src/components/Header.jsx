import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import './Header.css'
import { useAuth } from '../context/AuthContext.jsx'
import LanguageSwitcher from './LanguageSwitcher.jsx'

const Header = ({ user: customUser, avatarUrl = null }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { t } = useTranslation()
  // user comes from context; optional prop overrides for page-specific display
  const { user: authUser, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const currentUser = customUser || authUser

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

  async function handleLogout() {
    try {
      await logout()
    } finally {
      setIsMenuOpen(false)
      navigate('/login')
    }
  }

  // Define nome de exibição e iniciais do avatar
  const displayName =
    currentUser?.nickname || currentUser?.username || t('header.visitor')

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
    { label: t('header.dashboard'), path: '/dashboard', icon: '📊' },
    { label: t('header.myProfile'), path: '/profile', icon: '👤' },
    { label: t('header.friendsStatus'), path: '/friends', icon: '👥' },
    { label: t('header.generate'), path: '/generate', icon: '✨' },
    { label: t('header.history'), path: '/history', icon: '📜' },
    { label: t('header.privacy'), path: '/privacy', icon: '🔒' },
    { label: t('header.terms'), path: '/terms', icon: '📄' },
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
              aria-label={isMenuOpen ? t('header.closeMenu') : t('header.openMenu')}
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
            <LanguageSwitcher />
            <div className="fai-user-greeting">
              <span className="fai-greeting-label">{t('header.welcome')}</span>
              <strong className="fai-user-name" title={displayName}>
                {t('header.hello', { name: displayName })}
              </strong>
            </div>

            <div
              className="fai-avatar-wrapper"
              title={t('header.profileOf', { name: displayName })}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <div className="fai-avatar-circle">
                {effectiveAvatarUrl ? (
                  <img src={effectiveAvatarUrl} alt={t('header.avatarOf', { name: displayName })} />
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
        aria-label={t('header.mainNav')}
      >
        <div className="fai-drawer-header">
          <div className="fai-brand">
            <span className="fai-brand-icon">🍕</span>
            <span className="fai-brand-title">{t('header.menu')}</span>
          </div>
          <button
            type="button"
            className="fai-drawer-close"
            onClick={() => setIsMenuOpen(false)}
            aria-label={t('header.closeMenu')}
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
            <span>{t('header.logout')}</span>
          </button>
        </div>
      </aside>
    </>
  )
}

export default Header

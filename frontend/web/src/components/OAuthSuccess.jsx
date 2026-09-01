import { Navigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import './Login.css'
import { useAuth } from '../context/AuthContext.jsx'
import LanguageSwitcher from './LanguageSwitcher.jsx'

const OAuthSuccess = () => {
  const { t } = useTranslation()
  const { loading, isAuthenticated } = useAuth()
  const [searchParams] = useSearchParams()
  const error = searchParams.get('error')

  if (error) {
    return (
      <main className="login-container">
        <section className="login-card">
          <LanguageSwitcher />
          <div className="login-header">
            <img src="/cerebro.png" alt={t('oauth.brainAlt')} className="login-logo-brain" />
            <h1>Food AI</h1>
          </div>

          <h2>{t('oauth.authFailed')}</h2>

          <p className="login-message" style={{ color: '#f87171' }}>
            {error}
          </p>

          <div className="login-footer">
            <button type="button" onClick={() => window.location.assign('/login')}>
              {t('oauth.goLogin')}
            </button>
          </div>
        </section>
      </main>
    )
  }

  if (loading) {
    return (
      <main className="login-container">
        <section className="login-card">
          <LanguageSwitcher />
          <div className="login-header">
            <img src="/cerebro.png" alt={t('oauth.brainAlt')} className="login-logo-brain" />
            <h1>Food AI</h1>
          </div>

          <h2>{t('oauth.redirecting')}</h2>

          <p className="login-message">{t('oauth.entering')}</p>
        </section>
      </main>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <main className="login-container">
      <section className="login-card">
        <LanguageSwitcher />
        <div className="login-header">
          <img src="/cerebro.png" alt={t('oauth.brainAlt')} className="login-logo-brain" />
          <h1>Food AI</h1>
        </div>

        <h2>{t('oauth.redirecting')}</h2>

        <p className="login-message">{t('oauth.couldNotAuthenticate')}</p>

        <div className="login-footer">
          <button type="button" onClick={() => window.location.assign('/login')}>
            {t('oauth.goLogin')}
          </button>
        </div>
      </section>
    </main>
  )
}

export default OAuthSuccess

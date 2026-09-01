import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import './Login.css'
import { fetchJson } from '../lib/api.js'
import LanguageSwitcher from './LanguageSwitcher.jsx'

const API_URL = '/api'

const Register = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [username, setUsername] = useState('')
  const [usernickname, setUserNickname] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRegister(event) {
    event.preventDefault()

    setLoading(true)
    setMessage(t('register.registering'))

    try {
      await fetchJson(`${API_URL}/auth/register/`, {
        method: 'POST',
        body: {
          username,
          email,
          password,
          usernickname,
        },
      })

      setMessage(t('register.accountCreated'))

      navigate('/login')
    } catch (error) {
      setMessage(error.message || t('register.registerError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-container">
      <section className="login-card">
        <LanguageSwitcher />
        <div className="login-header">
          <img src="/cerebro.png" alt={t('register.brainAlt')} className="login-logo-brain" />
          <h1>Food AI</h1>
        </div>

        <h2>{t('register.title')}</h2>

        <form onSubmit={handleRegister} className="login-form">
          <div className="input-group">
            <label htmlFor="username">
              {t('register.username')}
            </label>
            <br />
            <input
              id="username"
              type="text"
              value={username}
              onChange={(event) =>
                setUsername(event.target.value)
              }
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="usernickname">
              {t('register.nickname')}
            </label>
            <br />
            <input
              id="usernickname"
              type="text"
              value={usernickname}
              onChange={(event) =>
                setUserNickname(event.target.value)
              }
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="email">
              {t('register.email')}
            </label>
            <br />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">
              {t('register.password')}
            </label>
            <br />
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              required
            />
          </div>

          <button
            type="submit"
            className="btn-submit"
            disabled={loading}
          >
            {loading ? t('register.submitting') : t('register.submit')}
          </button>

          <a href="/api/auth/42/authorize" className="btn-42">
            {t('register.register42')}
          </a>
        </form>

        {message && <p className="login-message">{message}</p>}

        <div className="login-footer">
          <button
            type="button"
            onClick={() => navigate('/login')}
          >
            {t('register.alreadyHaveAccount')}
          </button>

          <button
            type="button"
            onClick={() => navigate('/privacy')}
          >
            {t('register.privacy')}
          </button>

          <button
            type="button"
            onClick={() => navigate('/terms')}
          >
            {t('register.terms')}
          </button>
        </div>
      </section>
    </main>
  )
}

export default Register

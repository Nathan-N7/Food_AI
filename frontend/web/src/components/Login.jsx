
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import './Login.css'
import { useAuth } from '../context/AuthContext.jsx'
import LanguageSwitcher from './LanguageSwitcher.jsx'

const Login = () => {
  const { t } = useTranslation()
  const [useremail, setUseremail] = useState('')
  const [usernickname, setUsernickname] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()
  const { login } = useAuth()

  async function handleLogin(event) {
    event.preventDefault()

    setLoading(true)
    setMessage(t('login.submitting'))

    try {
      const user = await login({
        useremail,
        password,
      })

      setPassword('')

      setMessage(
        t('login.loginSuccess', { name: user?.nickname || user?.username }),
      )

      navigate('/dashboard')
    } catch (error) {
      setMessage(error.message || t('login.loginError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-container">
      <section className="login-card">
        <LanguageSwitcher />
        <div className="login-header">
          <img src="/cerebro.png" alt={t('login.brainAlt')} className="login-logo-brain" />
          <h1>Food AI</h1>
        </div>

        <h2>{t('login.title')}</h2>

        <form onSubmit={handleLogin} className="login-form">  
          <div className="form-content-row">
            <div className="input-column">
              <div className="input-group">
                <label htmlFor="email">
                  {t('login.email')}
                </label>
                <br />
                <input
                  id="email"
                  type="email"
                  value={useremail}
                  onChange={(event) => {
                    setUseremail(event.target.value)
                  }}
                  required
                />
              </div>
              <div className="input-group">
                <label htmlFor="password">
                  {t('login.password')}
                </label>
                <br />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value)
                  }}
                  required
                />
              </div>
            </div>
            
            <div className="hat-badge-container">
              <img src="/chapeu.png" alt={t('login.hatAlt')} className="login-logo" />
            </div>
          </div>


          <button
            type="submit"
            className="btn-submit"
            disabled={loading}
          >
            {loading ? t('login.submitting') : t('login.submit')}
          </button>

          <a href="/api/auth/42/authorize" className="btn-42">
            {t('login.login42')}
          </a>
        </form>

        {message && <p className="login-message">{message}</p>}

        <div className="login-footer">
          <button
            type="button"
            onClick={() => navigate('/register')}
          >
            {t('login.createAccount')}
          </button>

          <button
            type="button"
            onClick={() => navigate('/privacy')}
          >
            {t('login.privacy')}
          </button>

          <button
            type="button"
            onClick={() => navigate('/terms')}
          >
            {t('login.terms')}
          </button>
        </div>
      </section>
    </main>
  )
}

export default Login

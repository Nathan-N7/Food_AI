
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Login.css'
import './LanguageSelector.css'
import LanguageSelector from './LanguageSelector.jsx'
import { useTranslation } from 'react-i18next'

const API_URL = '/api'

const oauthErrorMessages = {
  configuration_error: 'O login com a 42 ainda não foi configurado neste ambiente.',
  invalid_state: 'A sessão de login expirou. Tente entrar com a 42 novamente.',
  authorization_denied: 'A autorização de login com a 42 foi cancelada.',
  missing_code: 'A 42 não retornou o código de autorização. Tente novamente.',
  login_failed: 'Não foi possível concluir o login com a 42. Tente novamente.',
}

const Login = () => {
  const [useremail, setUseremail] = useState('')
  const [usernickname, setUsernickname] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [twoFactorChallenge, setTwoFactorChallenge] = useState('')
  const [twoFactorCode, setTwoFactorCode] = useState('')

  const navigate = useNavigate()
  const { t } = useTranslation()

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1))
    const token = params.get('oauth_token')
    const oauthError = params.get('oauth_error')
    const oauthChallenge = params.get('oauth_challenge')

    if (token) {
      const user = {
        id: Number(params.get('oauth_user_id')),
        username: params.get('oauth_username') || '',
        email: params.get('oauth_email') || '',
        nickname: params.get('oauth_nickname') || '',
      }
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      window.history.replaceState(null, '', '/login')
      navigate('/dashboard', { replace: true })
    } else if (oauthChallenge && params.get('oauth_2fa_required')) {
      setTwoFactorChallenge(oauthChallenge)
      window.history.replaceState(null, '', '/login')
    } else if (oauthError) {
      window.history.replaceState(null, '', '/login')
      setMessage(
        oauthErrorMessages[oauthError]
        || 'Não foi possível entrar com a conta da 42',
      )
    }
  }, [navigate])

  async function handleLogin(event) {
    event.preventDefault()

    setLoading(true)
    setMessage(t('auth.signingIn'))

    try {
      const response = await fetch(
        `${API_URL}/auth/login/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            useremail,
            password,
           
          }),
        },
      )

      const data = await response.json()

      if (!response.ok) {
        setMessage(data.error || t('auth.invalidCredentials'))
        return
      }

      if (data.two_factor_required) {
        setTwoFactorChallenge(data.challenge)
        setTwoFactorCode('')
        setMessage(t('auth.twoFactorRequired'))
        return
      }

      localStorage.setItem('token', data.token)

      localStorage.setItem(
        'user',
        JSON.stringify(data.user),
      )

      setPassword('')

      setMessage(
        `Login realizado: ${data.user.nickname || data.user.username}`,
      )

      navigate('/dashboard')
    } catch (error) {
      console.error(error)

      setMessage(
        'Não foi possível conectar ao backend',
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleTwoFactorVerify(event) {
    event.preventDefault()
    setLoading(true)
    setMessage(t('auth.verifying'))
    try {
      const response = await fetch(`${API_URL}/auth/2fa/verify/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challenge: twoFactorChallenge, code: twoFactorCode }),
      })
      const data = await response.json()
      if (!response.ok) {
        setMessage(data.error || t('auth.invalidTwoFactor'))
        return
      }
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      navigate('/dashboard', { replace: true })
    } catch {
      setMessage(t('auth.connectionError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-container">
      <section className="login-card">
        <LanguageSelector />
        <div className="login-header">
          <img src="/cerebro.png" alt="Cérebro AI" className="login-logo-brain" />
          <h1>Food AI</h1>
        </div>

        <h2>{t('auth.login')}</h2>

        {twoFactorChallenge ? (
          <form onSubmit={handleTwoFactorVerify} className="login-form">
            <p>Digite o código de autenticação do seu aplicativo.</p>
            <div className="input-group">
              <label htmlFor="two-factor-code">{t('auth.twoFactorCode')}</label>
              <input
                id="two-factor-code"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={twoFactorCode}
                onChange={(event) => setTwoFactorCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                autoFocus
              />
            </div>
            <button type="submit" className="btn-submit" disabled={loading || twoFactorCode.length !== 6}>
              {loading ? t('auth.verifying') : t('auth.verify')}
            </button>
            <button type="button" onClick={() => { setTwoFactorChallenge(''); setMessage('') }}>
              {t('auth.back')}
            </button>
          </form>
        ) : <form onSubmit={handleLogin} className="login-form">
          <div className="form-content-row">
            <div className="input-column">
              <div className="input-group">
                <label htmlFor="email">
                    {t('auth.email')}
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
                    {t('auth.password')}
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
              <img src="/chapeu.png" alt="Chapéu Chef" className="login-logo" />
            </div>
          </div>


          <button
            type="submit"
            className="btn-submit"
            disabled={loading}
          >
            {loading ? t('auth.signingIn') : t('auth.enter')}
          </button>

          <button
            type="button"
            className="btn-forty-two"
            onClick={() => window.location.assign('/auth/42')}
            aria-label="Entrar com a conta da 42"
          >
            <span className="forty-two-mark" aria-hidden="true">42</span>
            <span>{t('auth.fortyTwo')}</span>
          </button>
        </form>}

        {message && <p className="login-message">{message}</p>}

        <div className="login-footer">
          <button
            type="button"
            onClick={() => navigate('/register')}
          >
            {t('auth.register')}
          </button>

          <button
            type="button"
            onClick={() => navigate('/privacy')}
          >
            Privacy Policy
          </button>

          <button
            type="button"
            onClick={() => navigate('/terms')}
          >
            Terms of Service
          </button>
        </div>
      </section>
    </main>
  )
}

export default Login

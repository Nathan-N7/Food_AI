import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API_URL = '/api'

const Login = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const [step, setStep] = useState('login')
  const [tempToken, setTempToken] = useState('')
  const [totpCode, setTotpCode] = useState('')

  const navigate = useNavigate()

  async function handleLogin(event) {
    event.preventDefault()
    setLoading(true)
    setMessage('Entrando...')

    try {
      const response = await fetch(`${API_URL}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await response.json()

      if (!response.ok) {
        setMessage(data.error || 'Erro ao fazer login')
        return
      }

      if (data.require_2fa) {
        setTempToken(data.temp_token)
        setStep('2fa')
        setMessage('')
      } else {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        navigate('/dashboard')
      }
    } catch (error) {
      setMessage('Não foi possível conectar ao backend')
    } finally {
      setLoading(false)
    }
  }

  async function handle2FA(event) {
    event.preventDefault()
    setLoading(true)
    setMessage('Verificando...')

    try {
      const response = await fetch(`${API_URL}/auth/login/2fa/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ temp_token: tempToken, totp_code: totpCode }),
      })
      const data = await response.json()

      if (!response.ok) {
        setMessage(data.error || 'Código inválido')
        return
      }

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      navigate('/dashboard')
    } catch (error) {
      setMessage('Erro na verificação')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main>
      <section>
        <h1>Food AI</h1>
        <h2>Login</h2>

        {step === 'login' ? (
          <form onSubmit={handleLogin}>
            <div>
              <label htmlFor="username">Usuário</label><br />
              <input
                id="username" type="text" value={username}
                onChange={(e) => setUsername(e.target.value)} required
              />
            </div>
            <div>
              <label htmlFor="password">Senha</label><br />
              <input
                id="password" type="password" value={password}
                onChange={(e) => setPassword(e.target.value)} required
              />
            </div>
            <button type="submit" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        ) : (
          <form onSubmit={handle2FA}>
            <div>
              <label>Enter your authentication code:</label><br />
              <input
                type="text" value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)} required
                maxLength={6}
              />
            </div>
            <button type="submit" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify'}
            </button>
            <button type="button" onClick={() => {setStep('login'); setTotpCode('')}}>
              Voltar
            </button>
          </form>
        )}

        {message && <p>{message}</p>}

        {step === 'login' && (
          <div>
            <button type="button" onClick={() => navigate('/register')}>Create an account</button>
            <button type="button" onClick={() => navigate('/privacy')}>Privacy Policy</button>
            <button type="button" onClick={() => navigate('/terms')}>Terms of Service</button>
          </div>
        )}
      </section>
    </main>
  )
}

export default Login

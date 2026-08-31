
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Login.css'

const API_URL = '/api'

const Login = () => {
  const [useremail, setUseremail] = useState('')
  const [usernickname, setUsernickname] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  async function handleLogin(event) {
    event.preventDefault()

    setLoading(true)
    setMessage('Entrando...')

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
        setMessage(data.error || 'Erro ao fazer login')
        return
      }

      sessionStorage.setItem('token', data.token)

      sessionStorage.setItem(
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

  return (
    <main className="login-container">
      <section className="login-card">
        <div className="login-header">
          <img src="/cerebro.png" alt="Cérebro AI" className="login-logo-brain" />
          <h1>Food AI</h1>
        </div>

        <h2>Login</h2>

        <form onSubmit={handleLogin} className="login-form">  
          <div className="form-content-row">
            <div className="input-column">
              <div className="input-group">
                <label htmlFor="email">
                  Email
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
                  Senha
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
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        {message && <p className="login-message">{message}</p>}

        <div className="login-footer">
          <button
            type="button"
            onClick={() => navigate('/register')}
          >
            Create an account
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


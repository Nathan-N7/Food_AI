
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

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

  return (
    <main>
      <section>
        <h1>Food AI</h1>

        <h2>Login</h2>

        <form onSubmit={handleLogin}>
          

          <div>
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

          <div>
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

          <button
            type="submit"
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        {message && <p>{message}</p>}

        <div>
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


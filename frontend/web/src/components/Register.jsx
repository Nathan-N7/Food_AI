import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API_URL = 'http://127.0.0.1:8000/api'

const Register = () => {
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRegister(event) {
    event.preventDefault()

    setLoading(true)
    setMessage('Criando conta...')

    try {
      const response = await fetch(
        `${API_URL}/auth/register/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username,
            email,
            password,
          }),
        },
      )

      const data = await response.json()

      if (!response.ok) {
        setMessage(data.error || 'Erro ao criar conta')
        return
      }

      setMessage('Conta criada com sucesso')

      navigate('/login')
    } catch (error) {
      console.error(error)
      setMessage('Não foi possível conectar ao backend')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main>
      <h1>Food AI</h1>

      <h2>Criar conta</h2>

      <form onSubmit={handleRegister}>
        <div>
          <label htmlFor="username">
            Usuário
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

        <div>
          <label htmlFor="email">
            Email
          </label>

          <br />

          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
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
            onChange={(event) =>
              setPassword(event.target.value)
            }
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
        >
          {loading ? 'Criando...' : 'Criar conta'}
        </button>
      </form>

      <button
        type="button"
        onClick={() => navigate('/login')}
      >
        Já tenho uma conta
      </button>

      {message && <p>{message}</p>}
    </main>
  )
}

export default Register
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchJson } from '../lib/api.js'

const API_URL = '/api'

const Register = () => {
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [usernickname, setUserNickname] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRegister(event) {
    event.preventDefault()

    setLoading(true)
    setMessage('Criando conta...')

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

      setMessage('Conta criada com sucesso')

      navigate('/login')
    } catch (error) {
      setMessage(error.message || 'Erro ao criar conta')
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
          <label htmlFor="username">
            NickName
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



      {message && <p>{message}</p>}
    </main>
  )
}

export default Register

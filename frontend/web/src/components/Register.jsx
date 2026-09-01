import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LanguageSelector from './LanguageSelector.jsx'
import './LanguageSelector.css'

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
    setMessage(t('auth.creating'))

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
            usernickname
          }),
        },
      )

      const data = await response.json()

      if (!response.ok) {
        setMessage(data.error || t('common.error'))
        return
      }

      setMessage(t('auth.accountCreated'))

      navigate('/login')
    } catch (error) {
      console.error(error)
      setMessage(t('auth.connectionError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main>
      <LanguageSelector />
      <h1>Food AI</h1>

      <h2>{t('auth.create')}</h2>

      <form onSubmit={handleRegister}>
        <div>
          <label htmlFor="username">
            {t('auth.username')}
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
            {t('profile.nickname')}
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
            {t('auth.email')}
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
            {t('auth.password')}
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
          {loading ? t('auth.creating') : t('auth.create')}
        </button>
      </form>

      <button
        type="button"
        onClick={() => navigate('/login')}
      >
        {t('auth.login')}
      </button>

      
       <button
            type="button"
            onClick={() => navigate('/privacy')}
          >
            {t('navigation.privacy')}
          </button>

          <button
            type="button"
            onClick={() => navigate('/terms')}
          >
            {t('navigation.terms')}
          </button>



      {message && <p>{message}</p>}
    </main>
  )
}

export default Register

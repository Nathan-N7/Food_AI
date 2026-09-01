import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Box, Button, Card, CardContent, TextField, Typography, Container } from '@mui/material'

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
  const location = useLocation()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const error = params.get('error')
    const token = params.get('token')
    const require_2fa = params.get('require_2fa')
    
    if (error) {
      setMessage('Erro na autenticação 42: ' + error)
    } else if (require_2fa === 'true') {
      const t_token = params.get('temp_token')
      if (t_token) {
        setTempToken(t_token)
        setStep('2fa')
      }
    } else if (token) {
      const userId = params.get('user_id')
      const username = params.get('username')
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify({id: userId, username: username}))
      navigate('/dashboard')
    }
  }, [location, navigate])


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
    <Container maxWidth="xs" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <Card sx={{ width: '100%', p: 2 }}>
        <CardContent>
          <Typography variant="h1" align="center" gutterBottom color="primary">
            Transcendence
          </Typography>
          <Typography variant="h2" align="center" gutterBottom sx={{ fontSize: '1.5rem', mb: 3 }}>
            Login
          </Typography>

          {step === 'login' ? (
            <Box component="form" onSubmit={handleLogin} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Usuário"
                variant="outlined"
                fullWidth
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <TextField
                label="Senha"
                type="password"
                variant="outlined"
                fullWidth
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button type="submit" variant="contained" color="primary" fullWidth disabled={loading} size="large" sx={{ mt: 1 }}>
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </Box>
          ) : (
            <Box component="form" onSubmit={handle2FA} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="body1" align="center">
                Enter your authentication code (6 digits):
              </Typography>
              <TextField
                label="Código 2FA"
                variant="outlined"
                fullWidth
                required
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)}
                inputProps={{ maxLength: 6 }}
              />
              <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                <Button type="submit" variant="contained" color="primary" fullWidth disabled={loading}>
                  {loading ? 'Verifying...' : 'Verify'}
                </Button>
                <Button variant="outlined" color="secondary" fullWidth onClick={() => {setStep('login'); setTotpCode('')}}>
                  Voltar
                </Button>
              </Box>
            </Box>
          )}

          {message && (
            <Typography color="error" align="center" sx={{ mt: 2 }}>
              {message}
            </Typography>
          )}

          {step === 'login' && (
            <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button variant="outlined" color="primary" fullWidth onClick={() => navigate('/register')}>
                Create an account
              </Button>
              
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 1 }}>
                 <Button variant="text" size="small" onClick={() => navigate('/privacy')}>Privacy Policy</Button>
                 <Button variant="text" size="small" onClick={() => navigate('/terms')}>Terms of Service</Button>
              </Box>
              
              <Button 
                variant="contained" 
                fullWidth 
                sx={{ mt: 2, backgroundColor: '#333', '&:hover': { backgroundColor: '#555' } }}
                onClick={() => window.location.href = API_URL + '/auth/42/'}
              >
                Login with 42
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    </Container>
  )
}

export default Login

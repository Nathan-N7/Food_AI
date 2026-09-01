import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Button, Card, CardContent, TextField, Typography, Container } from '@mui/material'

const API_URL = '/api'

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
    <Container maxWidth="xs" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <Card sx={{ width: '100%', p: 2 }}>
        <CardContent>
          <Typography variant="h1" align="center" gutterBottom color="primary">
            Transcendence
          </Typography>
          <Typography variant="h2" align="center" gutterBottom sx={{ fontSize: '1.5rem', mb: 3 }}>
            Criar Conta
          </Typography>

          <Box component="form" onSubmit={handleRegister} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Usuário"
              variant="outlined"
              fullWidth
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ex: joaosilva"
            />
            <TextField
              label="Email"
              type="email"
              variant="outlined"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="joao@exemplo.com"
            />
            <TextField
              label="Senha"
              type="password"
              variant="outlined"
              fullWidth
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Sua senha"
            />
            <Button type="submit" variant="contained" color="primary" fullWidth disabled={loading} size="large" sx={{ mt: 1 }}>
              {loading ? 'Criando...' : 'Criar conta'}
            </Button>
          </Box>

          {message && (
            <Typography color={message.includes('sucesso') ? 'success.main' : 'error'} align="center" sx={{ mt: 2 }}>
              {message}
            </Typography>
          )}

          <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Button variant="outlined" color="primary" fullWidth onClick={() => navigate('/login')}>
              Já tenho uma conta
            </Button>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 1 }}>
               <Button variant="text" size="small" onClick={() => navigate('/privacy')}>Privacy Policy</Button>
               <Button variant="text" size="small" onClick={() => navigate('/terms')}>Terms of Service</Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Container>
  )
}

export default Register

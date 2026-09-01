import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Button, Card, CardContent, Typography, Container, AppBar, Toolbar, Grid, Chip, CircularProgress, CardMedia, CardActions } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import DeleteIcon from '@mui/icons-material/Delete'

const API_URL = '/api'

const History = () => {
  const navigate = useNavigate()

  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function loadHistory() {
      const token = localStorage.getItem('token')

      if (!token) {
        navigate('/login')
        return
      }

      try {
        const response = await fetch(`${API_URL}/generations/`, {
          headers: { Authorization: `Token ${token}` },
        })
        const data = await response.json()

        if (!response.ok) {
          setMessage(data.error || 'Erro ao carregar histórico')
          return
        }

        setHistory(data)
      } catch (error) {
        console.error(error)
        setMessage('Não foi possível conectar ao backend')
      } finally {
        setLoading(false)
      }
    }

    loadHistory()
  }, [navigate])

  async function handleDelete(generationId) {
    const token = localStorage.getItem('token')

    if (!token) {
      setMessage('Faça login novamente')
      return
    }

    try {
      const response = await fetch(`${API_URL}/generations/${generationId}/`, {
        method: 'DELETE',
        headers: { Authorization: `Token ${token}` },
      })

      if (!response.ok) {
        const data = await response.json()
        setMessage(data.error || 'Erro ao excluir')
        return
      }

      setHistory(history.filter((gen) => gen.id !== generationId))
      setMessage('Geração excluída com sucesso')
    } catch (error) {
      console.error('Erro ao excluir:', error)
      setMessage('Erro de conexão')
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: 'background.default' }}>
        <CircularProgress color="primary" />
        <Typography variant="h6" sx={{ mt: 2, color: 'text.secondary' }}>Carregando histórico...</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: 'primary.main', fontWeight: 'bold' }}>
            Transcendence
          </Typography>
          <Button color="inherit" onClick={() => navigate('/dashboard')} startIcon={<ArrowBackIcon />}>
            Voltar
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, pb: 4 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Histórico de Gerações
        </Typography>

        {message && (
          <Typography align="center" sx={{ mb: 4, color: 'primary.light' }}>
            {message}
          </Typography>
        )}

        {history.length === 0 && (
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              Nenhuma geração encontrada.
            </Typography>
            <Button variant="contained" color="primary" onClick={() => navigate('/generate')} sx={{ mt: 2 }}>
              Gerar nova imagem
            </Button>
          </Box>
        )}

        <Grid container spacing={3}>
          {history.map((generation) => (
            <Grid item xs={12} sm={6} md={4} key={generation.id}>
              <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" component="h3">
                      Geração #{generation.id}
                    </Typography>
                    <Chip 
                      label={generation.status} 
                      color={(generation.status === 'success' || generation.status === 'completed') ? 'success' : 'warning'} 
                      size="small" 
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {new Date(generation.created_at).toLocaleString()}
                  </Typography>

                  <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" gutterBottom display="block">Original</Typography>
                      <CardMedia
                        component="img"
                        height="140"
                        image={generation.original_image}
                        alt="Original"
                        sx={{ borderRadius: 1, border: '1px solid rgba(255, 255, 255, 0.1)' }}
                      />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" gutterBottom display="block">Gerada</Typography>
                      <CardMedia
                        component="img"
                        height="140"
                        image={generation.generated_image}
                        alt="Gerada"
                        sx={{ borderRadius: 1, border: '1px solid rgba(255, 255, 255, 0.1)' }}
                      />
                    </Box>
                  </Box>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    color="error" 
                    startIcon={<DeleteIcon />} 
                    fullWidth 
                    onClick={() => handleDelete(generation.id)}
                  >
                    Deletar
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  )
}

export default History

import { toast } from 'react-toastify';
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Button, Card, CardContent, Typography, Container, AppBar, Toolbar, LinearProgress, Chip } from '@mui/material'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

const API_URL = '/api'

const Generate = () => {
  const navigate = useNavigate()

  const [user] = useState(() => {
    const savedUser = localStorage.getItem('user')
    if (!savedUser) return null
    try { return JSON.parse(savedUser) } catch { return null }
  })

  const [image, setImage] = useState(null)
  const [result, setResult] = useState(null)
  const [message, setMessage] = useState('')
  const [generating, setGenerating] = useState(false)
  const [preview, setPreview] = useState(null)
  const [progress, setProgress] = useState(0)

  async function handleGenerate(event) {
    event.preventDefault()
    const token = localStorage.getItem('token')

    if (!token) {
      setMessage('Usuário não autenticado')
      navigate('/login')
      return
    }

    if (!image) {
      setMessage('Selecione uma imagem'); toast.warning('Selecione uma imagem')
      return
    }

    setGenerating(true)
    setMessage('Gerando imagem...')
    setResult(null)
    setProgress(0)

    const formData = new FormData()
    formData.append('image', image)

    const xhr = new XMLHttpRequest()
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100)
        setProgress(percent)
      }
    }
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText)
        if (xhr.status >= 200 && xhr.status < 300) {
          setResult(data)
          setMessage('Imagem gerada com sucesso'); toast.success('Imagem gerada com sucesso!')
        } else {
          setMessage(data.error || 'Erro ao gerar imagem'); toast.error(data.error || 'Erro ao gerar imagem')
        }
      } catch {
        setMessage('Resposta inválida do servidor'); toast.error('Resposta inválida do servidor')
      } finally {
        setGenerating(false)
      }
    }
    xhr.onerror = () => {
      setMessage('Não foi possível concluir a geração'); toast.error('Não foi possível concluir a geração')
      setGenerating(false)
    }
    xhr.open('POST', `${API_URL}/generate/`)
    xhr.setRequestHeader('Authorization', `Token ${token}`)
    xhr.send(formData)
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

      <Container maxWidth="sm" sx={{ mt: 4, pb: 4 }}>
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h4" align="center" gutterBottom>
              Gerar Imagem
            </Typography>
            
            <Box component="form" onSubmit={handleGenerate} sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 3 }}>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                sx={{ height: 100, borderStyle: 'dashed' }}
                startIcon={<CloudUploadIcon fontSize="large" />}
              >
                Envie uma foto de comida
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(event) => {
                    setImage(event.target.files?.[0] || null)
                    if (preview) URL.revokeObjectURL(preview)
                    setPreview(event.target.files?.[0] ? URL.createObjectURL(event.target.files?.[0]) : null)
                  }}
                />
              </Button>

              {preview && (
                <Box sx={{ textAlign: 'center' }}>
                  <img
                    src={preview}
                    alt="Preview"
                    style={{ width: '100%', maxWidth: '300px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </Box>
              )}

              {generating && (
                <Box sx={{ width: '100%' }}>
                  <LinearProgress variant="determinate" value={progress} />
                  <Typography variant="body2" align="center" sx={{ mt: 1 }}>
                    {progress}% enviado — processando...
                  </Typography>
                </Box>
              )}

              <Button type="submit" variant="contained" color="primary" fullWidth disabled={generating} size="large">
                {generating ? 'Gerando...' : 'Gerar Imagem'}
              </Button>
            </Box>

            {message && (
              <Typography align="center" sx={{ mt: 2, color: result ? 'success.main' : 'error.main' }}>
                {message}
              </Typography>
            )}

            {result?.resultado && (
              <Box sx={{ mt: 4, p: 2, backgroundColor: 'background.paper', borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom>Resultado</Typography>
                <Typography variant="body1">
                  Classe detectada: <strong>{result.resultado.name_class}</strong>
                </Typography>
                <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                  Válido: 
                  <Chip 
                    label={result.resultado.validate ? 'Sim' : 'Não'} 
                    color={result.resultado.validate ? 'success' : 'error'} 
                    size="small" 
                  />
                </Typography>
              </Box>
            )}

            {result?.url_image && (
              <Box sx={{ mt: 4, textAlign: 'center' }}>
                <img
                  src={result.url_image}
                  alt="Imagem gerada"
                  style={{
                    width: '100%',
                    maxWidth: '400px',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  )
}

export default Generate

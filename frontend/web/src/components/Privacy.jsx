import { useNavigate } from 'react-router-dom'
import { Box, Button, Card, CardContent, Typography, Container, AppBar, Toolbar } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

const Privacy = () => {
  const navigate = useNavigate()

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: 'primary.main', fontWeight: 'bold' }}>
            Transcendence
          </Typography>
          <Button color="inherit" onClick={() => navigate(-1)} startIcon={<ArrowBackIcon />}>
            Voltar
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4, pb: 4 }}>
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h4" gutterBottom>
              Privacy Policy
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom sx={{ mb: 4 }}>
              Last updated: August 2026
            </Typography>

            <Typography variant="h6" gutterBottom>1. Introduction</Typography>
            <Typography variant="body1" paragraph>
              Welcome to Food AI. This Privacy Policy explains how we collect, use, store, and protect your personal information when you use our service. Food AI is an academic project developed as part of the 42 school curriculum. By using this application, you agree to the practices described in this policy.
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  )
}

export default Privacy

import { useNavigate } from 'react-router-dom'
import { Box, Button, Card, CardContent, Typography, Container, AppBar, Toolbar } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

const Terms = () => {
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
              Terms of Service
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom sx={{ mb: 4 }}>
              Last updated: August 2026
            </Typography>

            <Typography variant="h6" gutterBottom>1. Introduction</Typography>
            <Typography variant="body1" paragraph>
              Food AI is a web application that allows users to upload photos of food and receive AI-enhanced versions of those images, suitable for use in delivery menus, food blogs, or promotional materials.
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  )
}

export default Terms

import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Box, Card, CardContent, Typography, Badge, IconButton, AppBar, Toolbar, Container, Grid, Button } from '@mui/material'
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu'
import HistoryIcon from '@mui/icons-material/History'
import PersonIcon from '@mui/icons-material/Person'
import PeopleIcon from '@mui/icons-material/People'
import ChatIcon from '@mui/icons-material/Chat'
import ExitToAppIcon from '@mui/icons-material/ExitToApp'

const API_URL = '/api'

const Dashboard = () => {
  const navigate = useNavigate()
  const [pendingRequests, setPendingRequests] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    fetchNotifications()
  }, [])

  async function fetchNotifications() {
    try {
      const reqRes = await fetch(`${API_URL}/friends/requests/`, {
        headers: { Authorization: `Token ${token}` },
      })
      if (reqRes.ok) {
        const data = await reqRes.json()
        setPendingRequests(data.length)
      }

      const convRes = await fetch(`${API_URL}/messages/conversations/`, {
        headers: { Authorization: `Token ${token}` },
      })
      if (convRes.ok) {
        const data = await convRes.json()
        const total = data.reduce((acc, c) => acc + (c.unread_count || 0), 0)
        setUnreadMessages(total)
      }
    } catch (err) {
      console.error('Error fetching notifications:', err)
    }
  }

  async function handleLogout() {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await fetch('/api/auth/logout/', {
          method: 'POST',
          headers: { 'Authorization': `Token ${token}` }
        });
      } catch (e) { console.error(e); }
    }
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const items = [
    { title: 'Gerar', desc: 'Gerar imagem de comida', icon: <RestaurantMenuIcon fontSize="large" />, path: '/generate' },
    { title: 'Histórico', desc: 'Ver gerações anteriores', icon: <HistoryIcon fontSize="large" />, path: '/history' },
    { title: 'Perfil', desc: 'Editar seu perfil', icon: <PersonIcon fontSize="large" />, path: '/profile' },
    { title: 'Amigos', desc: 'Gerenciar amizades', icon: <Badge badgeContent={pendingRequests} color="error"><PeopleIcon fontSize="large" /></Badge>, path: '/friends' },
    { title: 'Mensagens', desc: 'Conversar com amigos', icon: <Badge badgeContent={unreadMessages} color="error"><ChatIcon fontSize="large" /></Badge>, path: '/chat', fullWidth: true },
  ]

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: 'primary.main', fontWeight: 'bold' }}>
            Transcendence
          </Typography>
          <Typography variant="body1" sx={{ mr: 2 }}>
            Olá, {user.username}
          </Typography>
          <Button color="inherit" onClick={handleLogout} startIcon={<ExitToAppIcon />}>
            Sair
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Grid container spacing={3}>
          {items.map((item, index) => (
            <Grid item xs={12} sm={item.fullWidth ? 12 : 6} key={index}>
              <Card 
                sx={{ 
                  cursor: 'pointer', 
                  transition: '0.3s', 
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: 6, backgroundColor: 'rgba(255, 255, 255, 0.05)' } 
                }}
                onClick={() => navigate(item.path)}
              >
                <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4 }}>
                  <Box sx={{ color: 'primary.main', mb: 2 }}>
                    {item.icon}
                  </Box>
                  <Typography variant="h5" component="h2" gutterBottom>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.desc}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  )
}

export default Dashboard

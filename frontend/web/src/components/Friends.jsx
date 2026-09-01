import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Box, Button, Card, CardContent, TextField, Typography, Container, 
  AppBar, Toolbar, Avatar, CircularProgress, Tabs, Tab, Badge, 
  List, ListItem, ListItemAvatar, ListItemText, IconButton
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ChatIcon from '@mui/icons-material/Chat'
import PersonIcon from '@mui/icons-material/Person'
import PersonRemoveIcon from '@mui/icons-material/PersonRemove'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import AccessTimeIcon from '@mui/icons-material/AccessTime'

const API_URL = '/api'

const Friends = () => {
  const navigate = useNavigate()
  
  const [activeTab, setActiveTab] = useState(0) // 0: Friends, 1: Requests, 2: Search
  const [friends, setFriends] = useState([])
  const [requests, setRequests] = useState([])
  const [searchResults, setSearchResults] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('success')

  const token = localStorage.getItem('token')

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }
    fetchFriends()
    fetchRequests()
    // eslint-disable-next-line
  }, [token, navigate])

  function showMessage(msg, type = 'success') {
    setMessage(msg)
    setMessageType(type)
    setTimeout(() => setMessage(''), 5000)
  }

  async function fetchFriends() {
    try {
      const res = await fetch(`${API_URL}/friends/`, {
        headers: { Authorization: `Token ${token}` },
      })
      if (!res.ok) throw new Error('Erro ao carregar amigos')
      const data = await res.json()
      setFriends(data)
    } catch (err) {
      console.error(err)
    }
  }

  async function fetchRequests() {
    try {
      const res = await fetch(`${API_URL}/friends/request/`, {
        headers: { Authorization: `Token ${token}` },
      })
      if (!res.ok) throw new Error('Erro ao carregar pedidos')
      const data = await res.json()
      setRequests(data)
    } catch (err) {
      console.error(err)
    }
  }

  async function handleSearch() {
    if (!searchQuery.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/users/search/?q=${encodeURIComponent(searchQuery)}`, {
        headers: { Authorization: `Token ${token}` },
      })
      if (!res.ok) throw new Error('Erro na busca')
      const data = await res.json()
      setSearchResults(data)
    } catch (err) {
      showMessage(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleSendRequest(userId) {
    try {
      const res = await fetch(`${API_URL}/friends/request/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({ to_user_id: userId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      showMessage('Pedido enviado com sucesso')
      handleSearch()
    } catch (err) {
      showMessage(err.message, 'error')
    }
  }

  async function handleAccept(friendshipId) {
    try {
      const res = await fetch(`${API_URL}/friends/accept/${friendshipId}/`, {
        method: 'POST',
        headers: { Authorization: `Token ${token}` },
      })
      if (!res.ok) throw new Error('Erro ao aceitar pedido')

      showMessage('Pedido aceito!')
      fetchRequests()
      fetchFriends()
    } catch (err) {
      showMessage(err.message, 'error')
    }
  }

  async function handleReject(friendshipId) {
    try {
      const res = await fetch(`${API_URL}/friends/reject/${friendshipId}/`, {
        method: 'POST',
        headers: { Authorization: `Token ${token}` },
      })
      if (!res.ok) throw new Error('Erro ao rejeitar pedido')

      showMessage('Pedido rejeitado')
      fetchRequests()
    } catch (err) {
      showMessage(err.message, 'error')
    }
  }

  async function handleRemove(friendshipId) {
    try {
      const res = await fetch(`${API_URL}/friends/${friendshipId}/`, {
        method: 'DELETE',
        headers: { Authorization: `Token ${token}` },
      })
      if (!res.ok) throw new Error('Erro ao remover amigo')

      showMessage('Amigo removido', 'success')
      fetchFriends()
    } catch (err) {
      showMessage(err.message, 'error')
    }
  }

  function getInitials(name) {
    return (name || '?').charAt(0).toUpperCase()
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

      <Container maxWidth="md" sx={{ mt: 4, pb: 4 }}>
        {message && (
          <Typography align="center" sx={{ mb: 2, p: 1, borderRadius: 1, backgroundColor: messageType === 'error' ? 'error.dark' : 'success.dark', color: '#fff' }}>
            {message}
          </Typography>
        )}

        <Card>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)} variant="fullWidth">
              <Tab label={`Amigos (${friends.length})`} />
              <Tab label={
                <Badge badgeContent={requests.length} color="error">
                  Pedidos
                </Badge>
              } />
              <Tab label="Buscar" />
            </Tabs>
          </Box>

          <CardContent sx={{ p: 0 }}>
            {/* AMIGOS */}
            {activeTab === 0 && (
              <List sx={{ width: '100%' }}>
                {friends.length === 0 ? (
                  <Box sx={{ textAlign: 'center', p: 4 }}>
                    <Typography color="text.secondary">Você ainda não tem amigos. Busque e adicione pessoas!</Typography>
                  </Box>
                ) : (
                  friends.map((friend) => (
                    <ListItem key={friend.id} divider
                      secondaryAction={
                        <Box>
                          <IconButton color="primary" onClick={() => navigate(`/chat/${friend.id}`)}>
                            <ChatIcon />
                          </IconButton>
                          <IconButton color="secondary" onClick={() => navigate(`/profile/${friend.id}`)}>
                            <PersonIcon />
                          </IconButton>
                          <IconButton color="error" onClick={() => handleRemove(friend.friendship_id)}>
                            <PersonRemoveIcon />
                          </IconButton>
                        </Box>
                      }
                    >
                      <ListItemAvatar>
                        <Badge variant="dot" color="success" invisible={!friend.is_online} overlap="circular" anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                          <Avatar src={friend.avatar}>{getInitials(friend.display_name || friend.username)}</Avatar>
                        </Badge>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={friend.display_name || friend.username} 
                        secondary={`@${friend.username} ${friend.is_online ? '• Online' : ''}`} 
                      />
                    </ListItem>
                  ))
                )}
              </List>
            )}

            {/* PEDIDOS */}
            {activeTab === 1 && (
              <List sx={{ width: '100%' }}>
                {requests.length === 0 ? (
                  <Box sx={{ textAlign: 'center', p: 4 }}>
                    <Typography color="text.secondary">Nenhum pedido de amizade pendente.</Typography>
                  </Box>
                ) : (
                  requests.map((req) => (
                    <ListItem key={req.friendship_id} divider
                      secondaryAction={
                        <Box>
                          <IconButton color="success" onClick={() => handleAccept(req.friendship_id)}>
                            <CheckIcon />
                          </IconButton>
                          <IconButton color="error" onClick={() => handleReject(req.friendship_id)}>
                            <CloseIcon />
                          </IconButton>
                        </Box>
                      }
                    >
                      <ListItemAvatar>
                        <Avatar src={req.avatar}>{getInitials(req.display_name || req.username)}</Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={req.display_name || req.username} 
                        secondary={`@${req.username} quer ser seu amigo`} 
                      />
                    </ListItem>
                  ))
                )}
              </List>
            )}

            {/* BUSCA */}
            {activeTab === 2 && (
              <Box sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <TextField 
                    fullWidth 
                    size="small"
                    placeholder="Buscar por username..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button variant="contained" onClick={handleSearch} disabled={loading}>
                    Buscar
                  </Button>
                </Box>
                
                <List sx={{ width: '100%' }}>
                  {searchResults.length === 0 ? (
                    <Box sx={{ textAlign: 'center', p: 4 }}>
                      <Typography color="text.secondary">Busque por nome de usuário para encontrar pessoas.</Typography>
                    </Box>
                  ) : (
                    searchResults.map((user) => (
                      <ListItem key={user.id} divider
                        secondaryAction={
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            {user.friendship_status === 'accepted' ? (
                              <Button variant="contained" color="success" size="small" disabled startIcon={<CheckIcon />}>Amigos</Button>
                            ) : user.friendship_status === 'pending' ? (
                              <Button variant="outlined" color="secondary" size="small" disabled startIcon={<AccessTimeIcon />}>Pendente</Button>
                            ) : (
                              <Button variant="contained" color="primary" size="small" onClick={() => handleSendRequest(user.id)} startIcon={<PersonAddIcon />}>Adicionar</Button>
                            )}
                            <IconButton color="secondary" size="small" onClick={() => navigate(`/profile/${user.id}`)}>
                              <PersonIcon />
                            </IconButton>
                          </Box>
                        }
                      >
                        <ListItemAvatar>
                          <Avatar src={user.avatar}>{getInitials(user.display_name || user.username)}</Avatar>
                        </ListItemAvatar>
                        <ListItemText 
                          primary={user.display_name || user.username} 
                          secondary={`@${user.username}`} 
                        />
                      </ListItem>
                    ))
                  )}
                </List>
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  )
}

export default Friends

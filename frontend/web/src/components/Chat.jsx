import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Box, Button, Typography, AppBar, Toolbar, Avatar, 
  List, ListItem, ListItemAvatar, ListItemText, TextField, 
  IconButton, Badge, Paper, Divider 
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import SendIcon from '@mui/icons-material/Send'

const API_URL = '/api'

const Chat = () => {
  const { userId } = useParams()
  const navigate = useNavigate()

  const [conversations, setConversations] = useState([])
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [selectedUserId, setSelectedUserId] = useState(userId || null)
  const [searchFilter, setSearchFilter] = useState('')
  const [sending, setSending] = useState(false)

  const messagesEndRef = useRef(null)
  const convPollRef = useRef(null)

  const token = localStorage.getItem('token')

  const selectedUser = conversations.find(
    (c) => String(c.id) === String(selectedUserId),
  )

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }
    fetchConversations()
    // eslint-disable-next-line
  }, [token, navigate])

  useEffect(() => {
    if (selectedUserId) {
      fetchMessages()
    } else {
      setMessages([])
    }
    // eslint-disable-next-line
  }, [selectedUserId])

  async function fetchConversations() {
    try {
      const res = await fetch(`${API_URL}/messages/conversations/`, {
        headers: { Authorization: `Token ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setConversations(data)
      }
    } catch (err) {
      console.error('Error fetching conversations:', err)
    }
  }

  async function fetchMessages() {
    try {
      const res = await fetch(`${API_URL}/messages/${selectedUserId}/`, {
        headers: { Authorization: `Token ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setMessages(data)
      }
    } catch (err) {
      console.error('Error fetching messages:', err)
    }
  }

  useEffect(() => {
    convPollRef.current = setInterval(() => {
      fetchConversations()
    }, 5000)

    return () => {
      if (convPollRef.current) clearInterval(convPollRef.current)
    }
  }, [fetchConversations])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function selectConversation(uid) {
    setSelectedUserId(uid)
    navigate(`/chat/${uid}`, { replace: true })
  }

  async function handleSend(e) {
    e.preventDefault()
    if (!newMessage.trim() || !selectedUserId || sending) return

    setSending(true)
    try {
      const res = await fetch(`${API_URL}/messages/${selectedUserId}/`, {
        method: 'POST',
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newMessage.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setMessages((prev) => [...prev, data])
      setNewMessage('')
      fetchConversations()
    } catch (err) {
      console.error('Error sending message:', err)
    } finally {
      setSending(false)
    }
  }

  function formatTime(isoStr) {
    if (!isoStr) return ''
    const d = new Date(isoStr)
    const isToday = d.toDateString() === new Date().toDateString()

    if (isToday) {
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  function getInitials(name) {
    return (name || '?').charAt(0).toUpperCase()
  }

  const filteredConversations = conversations.filter((c) => {
    if (!searchFilter) return true
    const name = (c.display_name || c.username || '').toLowerCase()
    return name.includes(searchFilter.toLowerCase())
  })

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'background.default' }}>
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

      <Box sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Sidebar */}
        <Box sx={{ width: { xs: '100%', md: 350 }, display: { xs: selectedUserId ? 'none' : 'flex', md: 'flex' }, flexDirection: 'column', borderRight: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <Box sx={{ p: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <Typography variant="h6" gutterBottom>Conversas</Typography>
            <TextField 
              fullWidth 
              size="small" 
              placeholder="Filtrar conversas..." 
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
            />
          </Box>
          <List sx={{ flexGrow: 1, overflowY: 'auto' }}>
            {filteredConversations.length === 0 ? (
              <Box sx={{ textAlign: 'center', p: 4 }}>
                <Typography color="text.secondary" variant="body2">
                  {conversations.length === 0 ? 'Nenhuma conversa ainda. Envie uma mensagem para um amigo!' : 'Nenhum resultado.'}
                </Typography>
              </Box>
            ) : (
              filteredConversations.map((conv) => (
                <ListItem 
                  button 
                  key={conv.id} 
                  onClick={() => selectConversation(conv.id)}
                  selected={String(selectedUserId) === String(conv.id)}
                >
                  <ListItemAvatar>
                    <Badge variant="dot" color="success" invisible={!conv.is_online} overlap="circular" anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                      <Avatar src={conv.avatar}>{getInitials(conv.display_name || conv.username)}</Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText 
                    primary={conv.display_name || conv.username}
                    secondary={(conv.last_message?.is_mine ? 'Você: ' : '') + (conv.last_message?.content || 'Sem mensagens')}
                    secondaryTypographyProps={{ noWrap: true }}
                  />
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', ml: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      {formatTime(conv.last_message?.created_at)}
                    </Typography>
                    {conv.unread_count > 0 && (
                      <Badge badgeContent={conv.unread_count} color="error" sx={{ mt: 1, mr: 1 }} />
                    )}
                  </Box>
                </ListItem>
              ))
            )}
          </List>
        </Box>

        {/* Chat Area */}
        <Box sx={{ flexGrow: 1, display: { xs: selectedUserId ? 'flex' : 'none', md: 'flex' }, flexDirection: 'column', backgroundColor: 'background.paper' }}>
          {selectedUserId && selectedUser ? (
            <>
              <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <Toolbar>
                  <IconButton edge="start" color="inherit" onClick={() => setSelectedUserId(null)} sx={{ display: { md: 'none' }, mr: 1 }}>
                    <ArrowBackIcon />
                  </IconButton>
                  <Badge variant="dot" color="success" invisible={!selectedUser.is_online} overlap="circular" anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                    <Avatar src={selectedUser.avatar} sx={{ mr: 2 }}>{getInitials(selectedUser.display_name || selectedUser.username)}</Avatar>
                  </Badge>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {selectedUser.display_name || selectedUser.username}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {selectedUser.is_online ? '● Online' : `Visto por último: ${formatTime(selectedUser.last_seen)}`}
                    </Typography>
                  </Box>
                </Toolbar>
              </AppBar>

              <Box sx={{ flexGrow: 1, p: 2, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {messages.length === 0 ? (
                  <Box sx={{ textAlign: 'center', p: 4, m: 'auto' }}>
                    <Typography variant="h4" gutterBottom>💬</Typography>
                    <Typography color="text.secondary">Comece a conversa!</Typography>
                  </Box>
                ) : (
                  messages.map((msg) => (
                    <Box 
                      key={msg.id} 
                      sx={{ 
                        alignSelf: msg.is_mine ? 'flex-end' : 'flex-start',
                        maxWidth: '75%',
                      }}
                    >
                      <Paper 
                        elevation={1}
                        sx={{ 
                          p: 1.5, 
                          backgroundColor: msg.is_mine ? 'primary.main' : 'background.default',
                          color: msg.is_mine ? 'primary.contrastText' : 'text.primary',
                          borderRadius: msg.is_mine ? '12px 12px 0 12px' : '12px 12px 12px 0',
                        }}
                      >
                        <Typography variant="body1">{msg.content}</Typography>
                        <Typography variant="caption" sx={{ display: 'block', textAlign: 'right', mt: 0.5, opacity: 0.7 }}>
                          {formatTime(msg.created_at)}
                          {msg.is_mine && (msg.is_read ? ' ✓✓' : ' ✓')}
                        </Typography>
                      </Paper>
                    </Box>
                  ))
                )}
                <div ref={messagesEndRef} />
              </Box>

              <Box component="form" onSubmit={handleSend} sx={{ p: 2, borderTop: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', gap: 1 }}>
                <TextField 
                  fullWidth 
                  size="small"
                  placeholder="Digite uma mensagem..." 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={sending}
                  autoFocus
                />
                <Button type="submit" variant="contained" color="primary" disabled={!newMessage.trim() || sending} sx={{ minWidth: 'auto', px: 2 }}>
                  <SendIcon />
                </Button>
              </Box>
            </>
          ) : (
            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="h2" color="text.secondary" gutterBottom>💬</Typography>
              <Typography variant="h6" color="text.secondary">Selecione uma conversa</Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  )
}

export default Chat

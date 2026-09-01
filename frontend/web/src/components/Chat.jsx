import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import './Social.css'

const API_URL = '/api'

const Chat = () => {
  const navigate = useNavigate()
  const { userId: paramUserId } = useParams()
  const [conversations, setConversations] = useState([])
  const [selectedUserId, setSelectedUserId] = useState(paramUserId || null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [searchFilter, setSearchFilter] = useState('')
  const messagesEndRef = useRef(null)
  const pollRef = useRef(null)
  const convPollRef = useRef(null)

  const token = localStorage.getItem('token')
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
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
  }, [token])

  // Fetch messages for selected user
  const fetchMessages = useCallback(async (uid) => {
    if (!uid) return
    try {
      const res = await fetch(`${API_URL}/messages/${uid}/`, {
        headers: { Authorization: `Token ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setMessages(data)
      }
    } catch (err) {
      console.error('Error fetching messages:', err)
    }
  }, [token])

  // Fetch user profile for selected chat
  const fetchSelectedUser = useCallback(async (uid) => {
    if (!uid) return
    try {
      const res = await fetch(`${API_URL}/profile/${uid}/`, {
        headers: { Authorization: `Token ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setSelectedUser(data)
      }
    } catch (err) {
      console.error('Error fetching user:', err)
    }
  }, [token])

  // Mark messages as read
  const markAsRead = useCallback(async (uid) => {
    if (!uid) return
    try {
      await fetch(`${API_URL}/messages/${uid}/read/`, {
        method: 'POST',
        headers: { Authorization: `Token ${token}` },
      })
    } catch (err) {
      console.error('Error marking as read:', err)
    }
  }, [token])

  // Initial load
  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  // When selectedUserId changes
  useEffect(() => {
    if (selectedUserId) {
      fetchSelectedUser(selectedUserId)
      fetchMessages(selectedUserId)
      markAsRead(selectedUserId)
    }
  }, [selectedUserId, fetchSelectedUser, fetchMessages, markAsRead])

  // Set from URL param
  useEffect(() => {
    if (paramUserId) {
      setSelectedUserId(paramUserId)
    }
  }, [paramUserId])

  // Poll for new messages every 3 seconds
  useEffect(() => {
    if (selectedUserId) {
      pollRef.current = setInterval(() => {
        fetchMessages(selectedUserId)
        markAsRead(selectedUserId)
      }, 3000)
    }

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [selectedUserId, fetchMessages, markAsRead])

  // Poll conversations every 5 seconds
  useEffect(() => {
    convPollRef.current = setInterval(() => {
      fetchConversations()
    }, 5000)

    return () => {
      if (convPollRef.current) clearInterval(convPollRef.current)
    }
  }, [fetchConversations])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function selectConversation(userId) {
    setSelectedUserId(userId)
    navigate(`/chat/${userId}`, { replace: true })
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
    const now = new Date()
    const isToday = d.toDateString() === now.toDateString()

    if (isToday) {
      return d.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    }
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function getInitials(name) {
    return (name || '?').charAt(0).toUpperCase()
  }

  function renderAvatar(user, small = false) {
    const cls = small ? 'avatar' : 'avatar'
    if (user?.avatar) {
      return <img src={user.avatar} alt={user.username} className={cls} />
    }
    return (
      <div className={`${cls} avatar-placeholder`}>
        {getInitials(user?.display_name || user?.username)}
      </div>
    )
  }

  const filteredConversations = conversations.filter((c) => {
    if (!searchFilter) return true
    const name = (c.display_name || c.username || '').toLowerCase()
    return name.includes(searchFilter.toLowerCase())
  })

  return (
    <div className="social-page">
      <header className="social-header">
        <h1>Mensagens</h1>
        <button className="back-btn" onClick={() => navigate('/dashboard')}>
          ← Voltar
        </button>
      </header>

      <div className="chat-layout">
        {/* Sidebar */}
        <div className="chat-sidebar">
          <div className="chat-sidebar-header">
            <h2>Conversas</h2>
            <div className="chat-sidebar-search">
              <input
                type="text"
                placeholder="Filtrar conversas..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
              />
            </div>
          </div>

          <div className="chat-conversations">
            {filteredConversations.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px' }}>
                <p style={{ fontSize: '13px' }}>
                  {conversations.length === 0
                    ? 'Nenhuma conversa ainda. Envie uma mensagem para um amigo!'
                    : 'Nenhum resultado.'}
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`conversation-item ${
                    String(selectedUserId) === String(conv.id) ? 'active' : ''
                  }`}
                  onClick={() => selectConversation(conv.id)}
                >
                  <div className={conv.is_online ? 'online-indicator' : ''}>
                    {renderAvatar(conv)}
                  </div>
                  <div className="conv-info">
                    <p className="conv-name">
                      {conv.display_name || conv.username}
                    </p>
                    <p className="conv-preview">
                      {conv.last_message?.is_mine && 'Você: '}
                      {conv.last_message?.content || 'Sem mensagens'}
                    </p>
                  </div>
                  <div className="conv-meta">
                    <span className="conv-time">
                      {formatTime(conv.last_message?.created_at)}
                    </span>
                    {conv.unread_count > 0 && (
                      <span className="unread-badge">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        {selectedUserId && selectedUser ? (
          <div className="chat-area">
            <div className="chat-area-header">
              {renderAvatar(selectedUser)}
              <div className="chat-user-info">
                <h3>
                  {selectedUser.display_name || selectedUser.username}
                </h3>
                <p
                  className={`chat-user-status ${
                    selectedUser.is_online ? '' : 'offline'
                  }`}
                >
                  {selectedUser.is_online
                    ? '● Online'
                    : `Visto por último: ${formatTime(selectedUser.last_seen)}`}
                </p>
              </div>
            </div>

            <div className="chat-messages">
              {messages.length === 0 ? (
                <div className="chat-empty">
                  <div className="chat-empty-icon">💬</div>
                  <p>Comece a conversa!</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`message-bubble ${
                      msg.is_mine ? 'mine' : 'theirs'
                    }`}
                  >
                    {msg.content}
                    <span className="msg-time">
                      {formatTime(msg.created_at)}
                      {msg.is_mine && (
                        <span className="msg-read">
                          {msg.is_read ? ' ✓✓' : ' ✓'}
                        </span>
                      )}
                    </span>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <form className="chat-input-area" onSubmit={handleSend}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Digite uma mensagem..."
                maxLength={2000}
                disabled={sending}
                autoFocus
              />
              <button
                type="submit"
                className="send-btn"
                disabled={!newMessage.trim() || sending}
              >
                ➤
              </button>
            </form>
          </div>
        ) : (
          <div className="chat-no-selection">
            <div className="no-sel-icon">💬</div>
            <h3>Selecione uma conversa</h3>
            <p>
              Escolha um amigo na lista ao lado ou vá até{' '}
              <button
                className="btn-secondary"
                onClick={() => navigate('/friends')}
                style={{ display: 'inline' }}
              >
                Amigos
              </button>{' '}
              para adicionar pessoas.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Chat

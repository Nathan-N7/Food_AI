import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Header from './Header'
import { usePresence } from '../hooks/usePresence'
import './Friends.css'

const API_URL = '/api'

const Friends = () => {
  const navigate = useNavigate()
  const { isConnected, isFriendOnline, notifications } = usePresence()

  const [activeTab, setActiveTab] = useState('friends') // 'friends' | 'search' | 'requests'
  const [friends, setFriends] = useState([])
  const [requests, setRequests] = useState({ received: [], sent: [] })
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState({})

  const token = localStorage.getItem('token')

  const fetchFriends = useCallback(async () => {
    if (!token) {
      navigate('/login')
      return
    }

    try {
      setLoading(true)
      const res = await fetch(`${API_URL}/friends/`, {
        headers: { Authorization: `Token ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setFriends(data)
      }
    } catch (err) {
      console.error('Erro ao buscar amigos:', err)
    } finally {
      setLoading(false)
    }
  }, [token, navigate])

  const fetchRequests = useCallback(async () => {
    if (!token) return

    try {
      const res = await fetch(`${API_URL}/friends/requests/`, {
        headers: { Authorization: `Token ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setRequests(data)
      }
    } catch (err) {
      console.error('Erro ao buscar solicitações:', err)
    }
  }, [token])

  useEffect(() => {
    fetchFriends()
    fetchRequests()
  }, [fetchFriends, fetchRequests])

  // Re-fetch requests/friends if a new real-time notification arrives
  useEffect(() => {
    if (notifications.length > 0) {
      fetchRequests()
      fetchFriends()
    }
  }, [notifications, fetchRequests, fetchFriends])

  // Search debounced
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    const timer = setTimeout(async () => {
      if (!token) return
      try {
        setSearchLoading(true)
        const res = await fetch(
          `${API_URL}/users/search/?q=${encodeURIComponent(searchQuery.trim())}`,
          {
            headers: { Authorization: `Token ${token}` },
          }
        )
        if (res.ok) {
          const data = await res.json()
          setSearchResults(data)
        }
      } catch (err) {
        console.error('Erro na busca:', err)
      } finally {
        setSearchLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, token])

  async function handleSendRequest(userId) {
    if (!token) return
    setActionLoading((prev) => ({ ...prev, [userId]: true }))

    try {
      const res = await fetch(`${API_URL}/friends/request/${userId}/`, {
        method: 'POST',
        headers: { Authorization: `Token ${token}` },
      })
      const data = await res.json()
      if (res.ok) {
        setSearchResults((prev) =>
          prev.map((u) =>
            u.id === userId
              ? {
                  ...u,
                  friendship_status: data.status === 'accepted' ? 'accepted' : 'pending_sent',
                  friendship_id: data.friendship_id,
                }
              : u
          )
        )
        fetchRequests()
        if (data.status === 'accepted') fetchFriends()
      } else {
        alert(data.error || 'Erro ao enviar solicitação')
      }
    } catch {
      alert('Erro de conexão')
    } finally {
      setActionLoading((prev) => ({ ...prev, [userId]: false }))
    }
  }

  async function handleRespondRequest(requestId, action) {
    if (!token) return
    setActionLoading((prev) => ({ ...prev, [requestId]: true }))

    try {
      const res = await fetch(`${API_URL}/friends/respond/${requestId}/`, {
        method: 'POST',
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      })

      if (res.ok) {
        setRequests((prev) => ({
          ...prev,
          received: prev.received.filter((r) => r.id !== requestId),
        }))
        if (action === 'accept') {
          fetchFriends()
        }
      }
    } catch {
      alert('Erro ao responder solicitação')
    } finally {
      setActionLoading((prev) => ({ ...prev, [requestId]: false }))
    }
  }

  async function handleRemoveFriend(friendId, friendName) {
    if (!confirm(`Deseja remover ${friendName} dos seus amigos?`)) return
    if (!token) return

    try {
      const res = await fetch(`${API_URL}/friends/${friendId}/`, {
        method: 'DELETE',
        headers: { Authorization: `Token ${token}` },
      })
      if (res.ok) {
        setFriends((prev) => prev.filter((f) => f.id !== friendId))
      }
    } catch {
      alert('Erro ao remover amigo')
    }
  }

  const getInitials = (name) => {
    if (!name) return 'U'
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  const pendingReceivedCount = requests.received.length

  return (
    <>
      <Header />
      <main className="friends-container">
        {/* Top Header */}
        <div className="friends-header">
          <h2>Amigos & Conexões</h2>
          <div className="friends-live-badge">
            <span className="live-dot" style={{ backgroundColor: isConnected ? '#10b981' : '#f59e0b' }} />
            <span>{isConnected ? 'Tempo Real Ativo' : 'Conectando...'}</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="friends-tabs">
          <button
            type="button"
            className={`friends-tab-btn ${activeTab === 'friends' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('friends')}
          >
            <span>👥 Meus Amigos</span>
            <span className="friends-tab-count">{friends.length}</span>
          </button>

          <button
            type="button"
            className={`friends-tab-btn ${activeTab === 'search' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('search')}
          >
            <span>🔍 Buscar Usuários</span>
          </button>

          <button
            type="button"
            className={`friends-tab-btn ${activeTab === 'requests' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            <span>📬 Solicitações</span>
            {pendingReceivedCount > 0 && (
              <span className="friends-tab-count" style={{ background: '#ef4444', color: '#fff' }}>
                {pendingReceivedCount}
              </span>
            )}
          </button>
        </div>

        {/* Tab 1: Friends List */}
        {activeTab === 'friends' && (
          <div>
            {loading ? (
              <p>Carregando amigos...</p>
            ) : friends.length === 0 ? (
              <div className="friends-empty-state">
                <div className="friends-empty-state-icon">👥</div>
                <h3>Nenhum amigo adicionado ainda</h3>
                <p>Use a aba "Buscar Usuários" para encontrar e adicionar amigos!</p>
              </div>
            ) : (
              <div className="friends-grid">
                {friends.map((friend) => {
                  const online = isFriendOnline(friend.id) || friend.is_online
                  const displayName = friend.nickname || friend.username

                  return (
                    <article key={friend.id} className="friend-card">
                      <div className="friend-card-avatar">
                        <div className="friend-avatar-img">
                          {friend.avatar ? (
                            <img src={friend.avatar} alt={displayName} />
                          ) : (
                            <span>{getInitials(displayName)}</span>
                          )}
                        </div>
                        <span
                          className={`friend-online-status ${online ? 'online' : 'offline'}`}
                          title={online ? 'Online agora' : 'Offline'}
                        />
                      </div>

                      <h4 className="friend-card-name" title={displayName}>
                        {displayName}
                      </h4>
                      <div className="friend-card-username">@{friend.username}</div>

                      <div className="friend-card-actions">
                        <Link to={`/profile/${friend.id}`} className="btn-primary-sm">
                          Ver Perfil
                        </Link>
                        <button
                          type="button"
                          className="btn-danger-sm"
                          onClick={() => handleRemoveFriend(friend.id, displayName)}
                        >
                          Remover
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: User Search */}
        {activeTab === 'search' && (
          <div>
            <div className="friends-search-box">
              <input
                type="text"
                className="friends-search-input"
                placeholder="Buscar por nome de usuário, apelido ou email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>

            {searchLoading ? (
              <p>Buscando usuários...</p>
            ) : searchQuery.trim() && searchResults.length === 0 ? (
              <div className="friends-empty-state">
                <div className="friends-empty-state-icon">🔍</div>
                <p>Nenhum usuário encontrado para "{searchQuery}".</p>
              </div>
            ) : (
              <div className="friends-grid">
                {searchResults.map((user) => {
                  const online = isFriendOnline(user.id) || user.is_online
                  const displayName = user.nickname || user.username
                  const isLoading = actionLoading[user.id]

                  return (
                    <article key={user.id} className="friend-card">
                      <div className="friend-card-avatar">
                        <div className="friend-avatar-img">
                          {user.avatar ? (
                            <img src={user.avatar} alt={displayName} />
                          ) : (
                            <span>{getInitials(displayName)}</span>
                          )}
                        </div>
                        <span
                          className={`friend-online-status ${online ? 'online' : 'offline'}`}
                          title={online ? 'Online' : 'Offline'}
                        />
                      </div>

                      <h4 className="friend-card-name" title={displayName}>
                        {displayName}
                      </h4>
                      <div className="friend-card-username">@{user.username}</div>

                      <div className="friend-card-actions">
                        <Link to={`/profile/${user.id}`} className="btn-primary-sm">
                          Perfil
                        </Link>

                        {user.friendship_status === 'accepted' ? (
                          <span style={{ fontSize: '0.85rem', color: '#10b981', alignSelf: 'center' }}>
                            ✓ Amigos
                          </span>
                        ) : user.friendship_status === 'pending_sent' ? (
                          <span style={{ fontSize: '0.85rem', color: 'var(--text)', alignSelf: 'center' }}>
                            ⏳ Enviado
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="btn-primary-sm"
                            disabled={isLoading}
                            onClick={() => handleSendRequest(user.id)}
                          >
                            {isLoading ? 'Enviando...' : '➕ Adicionar'}
                          </button>
                        )}
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Friend Requests */}
        {activeTab === 'requests' && (
          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--text-h)' }}>
              Solicitações Recebidas ({requests.received.length})
            </h3>

            {requests.received.length === 0 ? (
              <p style={{ color: 'var(--text)', marginBottom: '2rem' }}>
                Nenhuma solicitação de amizade pendente.
              </p>
            ) : (
              <div className="friends-grid" style={{ marginBottom: '2rem' }}>
                {requests.received.map((req) => {
                  const displayName = req.user.nickname || req.user.username
                  const isLoading = actionLoading[req.id]

                  return (
                    <article key={req.id} className="friend-card">
                      <div className="friend-card-avatar">
                        <div className="friend-avatar-img">
                          {req.user.avatar ? (
                            <img src={req.user.avatar} alt={displayName} />
                          ) : (
                            <span>{getInitials(displayName)}</span>
                          )}
                        </div>
                      </div>

                      <h4 className="friend-card-name">{displayName}</h4>
                      <div className="friend-card-username">@{req.user.username}</div>

                      <div className="friend-card-actions">
                        <button
                          type="button"
                          className="btn-primary-sm"
                          disabled={isLoading}
                          onClick={() => handleRespondRequest(req.id, 'accept')}
                        >
                          ✓ Aceitar
                        </button>
                        <button
                          type="button"
                          className="btn-danger-sm"
                          disabled={isLoading}
                          onClick={() => handleRespondRequest(req.id, 'reject')}
                        >
                          ✕ Recusar
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}

            {requests.sent.length > 0 && (
              <>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--text-h)' }}>
                  Solicitações Enviadas ({requests.sent.length})
                </h3>
                <div className="friends-grid">
                  {requests.sent.map((req) => {
                    const displayName = req.user.nickname || req.user.username
                    return (
                      <article key={req.id} className="friend-card" style={{ opacity: 0.85 }}>
                        <div className="friend-card-avatar">
                          <div className="friend-avatar-img">
                            {req.user.avatar ? (
                              <img src={req.user.avatar} alt={displayName} />
                            ) : (
                              <span>{getInitials(displayName)}</span>
                            )}
                          </div>
                        </div>

                        <h4 className="friend-card-name">{displayName}</h4>
                        <div className="friend-card-username">@{req.user.username}</div>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text)' }}>
                          ⏳ Aguardando resposta
                        </span>
                      </article>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </>
  )
}

export default Friends

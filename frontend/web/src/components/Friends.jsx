import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Social.css'

const API_URL = '/api'

const Friends = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('friends')
  const [friends, setFriends] = useState([])
  const [requests, setRequests] = useState([])
  const [searchResults, setSearchResults] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')

  const token = localStorage.getItem('token')

  useEffect(() => {
    fetchFriends()
    fetchRequests()
  }, [])

  function showMessage(text, type = 'success') {
    setMessage(text)
    setMessageType(type)
    setTimeout(() => setMessage(''), 4000)
  }

  async function fetchFriends() {
    try {
      const res = await fetch(`${API_URL}/friends/`, {
        headers: { Authorization: `Token ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setFriends(data)
      }
    } catch (err) {
      console.error('Error fetching friends:', err)
    }
  }

  async function fetchRequests() {
    try {
      const res = await fetch(`${API_URL}/friends/requests/`, {
        headers: { Authorization: `Token ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setRequests(data)
      }
    } catch (err) {
      console.error('Error fetching requests:', err)
    }
  }

  async function handleSearch() {
    if (searchQuery.trim().length < 2) {
      showMessage('Mínimo 2 caracteres para buscar', 'error')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(
        `${API_URL}/users/search/?q=${encodeURIComponent(searchQuery)}`,
        { headers: { Authorization: `Token ${token}` } },
      )
      if (res.ok) {
        const data = await res.json()
        setSearchResults(data)
        if (data.length === 0) {
          showMessage('Nenhum usuário encontrado', 'error')
        }
      }
    } catch (err) {
      showMessage('Erro na busca', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleSendRequest(userId) {
    try {
      const res = await fetch(`${API_URL}/friends/request/`, {
        method: 'POST',
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ to_user_id: userId }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      showMessage(data.message, 'success')

      // Refresh data
      handleSearch()
      fetchFriends()
      fetchRequests()
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

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      showMessage('Amizade aceita! 🎉', 'success')
      fetchFriends()
      fetchRequests()
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

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      showMessage('Pedido rejeitado', 'success')
      fetchRequests()
    } catch (err) {
      showMessage(err.message, 'error')
    }
  }

  async function handleRemove(friendshipId) {
    if (!confirm('Tem certeza que deseja remover este amigo?')) return

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

  function renderAvatar(user) {
    if (user.avatar) {
      return <img src={user.avatar} alt={user.username} className="avatar" />
    }
    return (
      <div className="avatar avatar-placeholder">
        {getInitials(user.display_name || user.username)}
      </div>
    )
  }

  function handleSearchKeyDown(e) {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <div className="social-page">
      <header className="social-header">
        <h1>Amigos</h1>
        <button className="back-btn" onClick={() => navigate('/dashboard')}>
          ← Voltar
        </button>
      </header>

      {message && (
        <div className={`status-message ${messageType}`}>
          {message}
        </div>
      )}

      <div className="friends-container">
        {/* Tabs */}
        <div className="friends-tabs">
          <button
            className={`friends-tab ${activeTab === 'friends' ? 'active' : ''}`}
            onClick={() => setActiveTab('friends')}
          >
            👥 Amigos ({friends.length})
          </button>
          <button
            className={`friends-tab ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            📩 Pedidos
            {requests.length > 0 && (
              <span className="badge">{requests.length}</span>
            )}
          </button>
          <button
            className={`friends-tab ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => setActiveTab('search')}
          >
            🔍 Buscar
          </button>
        </div>

        {/* Friends List */}
        {activeTab === 'friends' && (
          <>
            {friends.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">👥</div>
                <p>Você ainda não tem amigos.<br />Busque e adicione pessoas!</p>
              </div>
            ) : (
              friends.map((friend) => (
                <div key={friend.id} className="social-card friend-item">
                  <div className={friend.is_online ? 'online-indicator' : ''}>
                    {renderAvatar(friend)}
                  </div>
                  <div className="friend-info">
                    <p className="friend-name">
                      {friend.display_name || friend.username}
                    </p>
                    <p className="friend-username">
                      @{friend.username}
                      {friend.is_online && ' • 🟢 Online'}
                    </p>
                  </div>
                  <div className="friend-actions">
                    <button
                      className="btn-primary"
                      onClick={() => navigate(`/chat/${friend.id}`)}
                      style={{ padding: '8px 14px', fontSize: '13px' }}
                    >
                      💬
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => navigate(`/profile/${friend.id}`)}
                    >
                      👤
                    </button>
                    <button
                      className="btn-danger"
                      onClick={() => handleRemove(friend.friendship_id)}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* Pending Requests */}
        {activeTab === 'requests' && (
          <>
            {requests.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📩</div>
                <p>Nenhum pedido de amizade pendente.</p>
              </div>
            ) : (
              requests.map((req) => (
                <div key={req.friendship_id} className="social-card friend-item">
                  {renderAvatar(req)}
                  <div className="friend-info">
                    <p className="friend-name">
                      {req.display_name || req.username}
                    </p>
                    <p className="friend-username">
                      @{req.username} quer ser seu amigo
                    </p>
                  </div>
                  <div className="friend-actions">
                    <button
                      className="btn-success"
                      onClick={() => handleAccept(req.friendship_id)}
                    >
                      ✓ Aceitar
                    </button>
                    <button
                      className="btn-danger"
                      onClick={() => handleReject(req.friendship_id)}
                    >
                      ✕ Rejeitar
                    </button>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* Search */}
        {activeTab === 'search' && (
          <>
            <div className="search-box">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Buscar por username..."
              />
              <button
                className="btn-primary"
                onClick={handleSearch}
                disabled={loading}
              >
                {loading ? '...' : '🔍 Buscar'}
              </button>
            </div>

            {searchResults.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🔍</div>
                <p>Busque por nome de usuário para encontrar pessoas.</p>
              </div>
            ) : (
              searchResults.map((user) => (
                <div key={user.id} className="social-card friend-item">
                  {renderAvatar(user)}
                  <div className="friend-info">
                    <p className="friend-name">
                      {user.display_name || user.username}
                    </p>
                    <p className="friend-username">@{user.username}</p>
                  </div>
                  <div className="friend-actions">
                    {user.friendship_status === 'accepted' ? (
                      <button className="btn-success" disabled>
                        ✓ Amigos
                      </button>
                    ) : user.friendship_status === 'pending' ? (
                      <button className="btn-secondary" disabled>
                        ⏳ Pendente
                      </button>
                    ) : (
                      <button
                        className="btn-primary"
                        onClick={() => handleSendRequest(user.id)}
                        style={{ padding: '8px 14px', fontSize: '13px' }}
                      >
                        ➕ Adicionar
                      </button>
                    )}
                    <button
                      className="btn-secondary"
                      onClick={() => navigate(`/profile/${user.id}`)}
                    >
                      👤
                    </button>
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Friends

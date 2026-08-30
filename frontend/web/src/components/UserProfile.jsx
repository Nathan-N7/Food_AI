import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Header from './Header'
import { usePresence } from '../hooks/usePresence'
import './Profile.css'

const API_URL = '/api'

const UserProfile = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isFriendOnline } = usePresence()

  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState(null)
  const [message, setMessage] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchUserProfile()
  }, [id])

  async function fetchUserProfile() {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/users/${id}/`, {
        headers: {
          Authorization: `Token ${token}`,
        },
      })

      if (!response.ok) {
        if (response.status === 404) {
          setMessage('Usuário não encontrado.')
        } else {
          setMessage('Erro ao carregar dados do usuário.')
        }
        return
      }

      const data = await response.json()
      setUserData(data)
    } catch (err) {
      setMessage('Erro de conexão ao buscar perfil.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSendFriendRequest() {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      setActionLoading(true)
      const response = await fetch(`${API_URL}/friends/request/${id}/`, {
        method: 'POST',
        headers: {
          Authorization: `Token ${token}`,
        },
      })

      const data = await response.json()
      if (response.ok) {
        setUserData((prev) => ({
          ...prev,
          friendship_status: data.status === 'accepted' ? 'accepted' : 'pending_sent',
          friendship_id: data.friendship_id,
        }))
      } else {
        alert(data.error || 'Erro ao enviar solicitação')
      }
    } catch {
      alert('Erro de conexão')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleRespondFriendRequest(action) {
    if (!userData?.friendship_id) return
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      setActionLoading(true)
      const response = await fetch(`${API_URL}/friends/respond/${userData.friendship_id}/`, {
        method: 'POST',
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      })

      if (response.ok) {
        setUserData((prev) => ({
          ...prev,
          friendship_status: action === 'accept' ? 'accepted' : 'none',
        }))
      }
    } catch {
      alert('Erro de conexão')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleRemoveFriend() {
    if (!confirm('Deseja realmente desfazer a amizade?')) return
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      setActionLoading(true)
      const response = await fetch(`${API_URL}/friends/${id}/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Token ${token}`,
        },
      })

      if (response.ok) {
        setUserData((prev) => ({
          ...prev,
          friendship_status: 'none',
          friendship_id: null,
        }))
      }
    } catch {
      alert('Erro ao remover amigo')
    } finally {
      setActionLoading(false)
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

  const isOnline = isFriendOnline(id) || userData?.is_online
  const displayName = userData?.nickname || userData?.username || 'Usuário'

  return (
    <>
      <Header />
      <main className="profile-container">
        <button
          type="button"
          style={{
            background: 'transparent',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            padding: '6px 14px',
            borderRadius: '6px',
            cursor: 'pointer',
            marginBottom: '1rem',
          }}
          onClick={() => navigate(-1)}
        >
          ← Voltar
        </button>

        {loading ? (
          <p>Carregando perfil...</p>
        ) : message ? (
          <p>{message}</p>
        ) : (
          <>
            <section className="profile-header-card">
              <div className="profile-avatar-wrapper">
                <div className="profile-avatar-img">
                  {userData.avatar ? (
                    <img src={userData.avatar} alt={`Avatar de ${displayName}`} />
                  ) : (
                    <span>{getInitials(displayName)}</span>
                  )}
                </div>
                <span
                  style={{
                    position: 'absolute',
                    bottom: '4px',
                    right: '4px',
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    backgroundColor: isOnline ? '#10b981' : '#6b7280',
                    border: '3px solid var(--bg)',
                    boxShadow: isOnline ? '0 0 8px #10b981' : 'none',
                  }}
                  title={isOnline ? 'Online agora' : 'Offline'}
                />
              </div>

              <div className="profile-info-summary">
                <h2>{displayName}</h2>
                <div className="profile-username-tag">@{userData.username}</div>
                <p className="profile-bio-text">
                  {userData.bio || 'Este usuário ainda não adicionou uma biografia.'}
                </p>

                {/* Friendship actions */}
                <div style={{ marginTop: '1.25rem' }}>
                  {userData.friendship_status === 'self' && (
                    <button
                      type="button"
                      className="profile-submit-btn"
                      style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem' }}
                      onClick={() => navigate('/profile')}
                    >
                      ✏️ Editar Meu Perfil
                    </button>
                  )}

                  {userData.friendship_status === 'none' && (
                    <button
                      type="button"
                      className="profile-submit-btn"
                      style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem' }}
                      disabled={actionLoading}
                      onClick={handleSendFriendRequest}
                    >
                      ➕ Adicionar Amigo
                    </button>
                  )}

                  {userData.friendship_status === 'pending_sent' && (
                    <span style={{ color: 'var(--text)', fontSize: '0.9rem' }}>
                      ⏳ Solicitação de amizade enviada
                    </span>
                  )}

                  {userData.friendship_status === 'pending_received' && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        className="profile-submit-btn"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                        disabled={actionLoading}
                        onClick={() => handleRespondFriendRequest('accept')}
                      >
                        ✓ Aceitar Amizade
                      </button>
                      <button
                        type="button"
                        className="btn-remove-avatar"
                        disabled={actionLoading}
                        onClick={() => handleRespondFriendRequest('reject')}
                      >
                        ✕ Recusar
                      </button>
                    </div>
                  )}

                  {userData.friendship_status === 'accepted' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ color: '#10b981', fontWeight: 600, fontSize: '0.9rem' }}>
                        ✓ Vocês são amigos
                      </span>
                      <button
                        type="button"
                        className="btn-remove-avatar"
                        disabled={actionLoading}
                        onClick={handleRemoveFriend}
                      >
                        Desfazer amizade
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Stats */}
            <section className="profile-stats-grid">
              <div className="profile-stat-card">
                <div className="profile-stat-icon">🎨</div>
                <div className="profile-stat-content">
                  <span className="profile-stat-value">
                    {userData.generations_count || 0}
                  </span>
                  <span className="profile-stat-label">Gerações Feitas</span>
                </div>
              </div>

              <div className="profile-stat-card">
                <div className="profile-stat-icon">
                  {isOnline ? '🟢' : '⚪'}
                </div>
                <div className="profile-stat-content">
                  <span className="profile-stat-value" style={{ fontSize: '1.1rem' }}>
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                  <span className="profile-stat-label">Presença em tempo real</span>
                </div>
              </div>

              <div className="profile-stat-card">
                <div className="profile-stat-icon">📅</div>
                <div className="profile-stat-content">
                  <span className="profile-stat-value" style={{ fontSize: '0.95rem' }}>
                    {userData.date_joined
                      ? new Date(userData.date_joined).toLocaleDateString('pt-BR')
                      : '—'}
                  </span>
                  <span className="profile-stat-label">Membro Desde</span>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </>
  )
}

export default UserProfile

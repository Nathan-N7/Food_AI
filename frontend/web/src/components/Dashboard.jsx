import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import './Social.css'

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
      // Fetch pending friend requests
      const reqRes = await fetch(`${API_URL}/friends/requests/`, {
        headers: { Authorization: `Token ${token}` },
      })
      if (reqRes.ok) {
        const data = await reqRes.json()
        setPendingRequests(data.length)
      }

      // Fetch unread messages
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

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <div className="social-page">
      <header className="social-header">
        <h1>Food AI</h1>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', color: 'var(--text)' }}>
            Olá, {user.username}
          </span>
          <button className="back-btn" onClick={handleLogout}>
            Sair
          </button>
        </div>
      </header>

      <div style={{
        maxWidth: '600px',
        margin: '40px auto',
        padding: '0 24px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
      }}>
        <div
          className="social-card"
          style={{ cursor: 'pointer', textAlign: 'center', padding: '32px 24px' }}
          onClick={() => navigate('/generate')}
        >
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>🍔</div>
          <h2 style={{ margin: '0 0 4px', fontSize: '18px' }}>Gerar</h2>
          <p style={{ fontSize: '13px', margin: 0 }}>Gerar imagem de comida</p>
        </div>

        <div
          className="social-card"
          style={{ cursor: 'pointer', textAlign: 'center', padding: '32px 24px' }}
          onClick={() => navigate('/history')}
        >
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>📜</div>
          <h2 style={{ margin: '0 0 4px', fontSize: '18px' }}>Histórico</h2>
          <p style={{ fontSize: '13px', margin: 0 }}>Ver gerações anteriores</p>
        </div>

        <div
          className="social-card"
          style={{ cursor: 'pointer', textAlign: 'center', padding: '32px 24px' }}
          onClick={() => navigate('/profile')}
        >
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>👤</div>
          <h2 style={{ margin: '0 0 4px', fontSize: '18px' }}>Perfil</h2>
          <p style={{ fontSize: '13px', margin: 0 }}>Editar seu perfil</p>
        </div>

        <div
          className="social-card"
          style={{ cursor: 'pointer', textAlign: 'center', padding: '32px 24px', position: 'relative' }}
          onClick={() => navigate('/friends')}
        >
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>👥</div>
          <h2 style={{ margin: '0 0 4px', fontSize: '18px' }}>Amigos</h2>
          <p style={{ fontSize: '13px', margin: 0 }}>Gerenciar amizades</p>
          {pendingRequests > 0 && (
            <span className="badge" style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
            }}>
              {pendingRequests}
            </span>
          )}
        </div>

        <div
          className="social-card"
          style={{
            cursor: 'pointer',
            textAlign: 'center',
            padding: '32px 24px',
            gridColumn: '1 / -1',
            position: 'relative',
          }}
          onClick={() => navigate('/chat')}
        >
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>💬</div>
          <h2 style={{ margin: '0 0 4px', fontSize: '18px' }}>Mensagens</h2>
          <p style={{ fontSize: '13px', margin: 0 }}>Conversar com amigos</p>
          {unreadMessages > 0 && (
            <span className="badge" style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
            }}>
              {unreadMessages}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard

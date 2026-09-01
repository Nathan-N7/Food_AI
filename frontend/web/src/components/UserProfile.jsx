import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Header from './Header'
import { usePresence } from '../hooks/usePresence'
import { fetchJson } from '../lib/api.js'
import './Profile.css'

const API_URL = '/api'

const UserProfile = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { isFriendOnline } = usePresence()

  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState(null)
  const [message, setMessage] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchUserProfile()
  }, [id])

  async function fetchUserProfile() {
    try {
      setLoading(true)
      const data = await fetchJson(`${API_URL}/users/${id}/`)
      setUserData(data)
    } catch (err) {
      if (err.status === 404) {
        setMessage(t('userProfile.notFound'))
      } else {
        setMessage(t('userProfile.loadError'))
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleSendFriendRequest() {
    try {
      setActionLoading(true)
      const data = await fetchJson(`${API_URL}/friends/request/${id}/`, {
        method: 'POST',
      })

      setUserData((prev) => ({
        ...prev,
        friendship_status: data.status === 'accepted' ? 'accepted' : 'pending_sent',
        friendship_id: data.friendship_id,
      }))
    } catch (err) {
      alert(err.message || t('userProfile.requestError'))
    } finally {
      setActionLoading(false)
    }
  }

  async function handleRespondFriendRequest(action) {
    if (!userData?.friendship_id) return

    try {
      setActionLoading(true)
      await fetchJson(`${API_URL}/friends/respond/${userData.friendship_id}/`, {
        method: 'POST',
        body: { action },
      })

      setUserData((prev) => ({
        ...prev,
        friendship_status: action === 'accept' ? 'accepted' : 'none',
      }))
    } catch {
      alert(t('userProfile.connectionError'))
    } finally {
      setActionLoading(false)
    }
  }

  async function handleRemoveFriend() {
    if (!confirm(t('userProfile.confirmUnfriend'))) return

    try {
      setActionLoading(true)
      await fetchJson(`${API_URL}/friends/${id}/`, {
        method: 'DELETE',
      })

      setUserData((prev) => ({
        ...prev,
        friendship_status: 'none',
        friendship_id: null,
      }))
    } catch {
      alert(t('userProfile.removeError'))
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
  const displayName = userData?.nickname || userData?.username || t('userProfile.user')

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
          {t('userProfile.back')}
        </button>

        {loading ? (
          <p>{t('userProfile.loading')}</p>
        ) : message ? (
          <p>{message}</p>
        ) : (
          <>
            <section className="profile-header-card">
              <div className="profile-avatar-wrapper">
                <div className="profile-avatar-img">
                  {userData.avatar ? (
                    <img src={userData.avatar} alt={t('userProfile.avatarOf', { name: displayName })} />
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
                  title={isOnline ? t('userProfile.onlineNow') : t('userProfile.offline')}
                />
              </div>

              <div className="profile-info-summary">
                <h2>{displayName}</h2>
                <div className="profile-username-tag">@{userData.username}</div>
                <p className="profile-bio-text">
                  {userData.bio || t('userProfile.noBio')}
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
                      {t('userProfile.editMyProfile')}
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
                      {t('userProfile.addFriend')}
                    </button>
                  )}

                  {userData.friendship_status === 'pending_sent' && (
                    <span style={{ color: 'var(--text)', fontSize: '0.9rem' }}>
                      {t('userProfile.requestSent')}
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
                        {t('userProfile.acceptFriendship')}
                      </button>
                      <button
                        type="button"
                        className="btn-remove-avatar"
                        disabled={actionLoading}
                        onClick={() => handleRespondFriendRequest('reject')}
                      >
                        {t('userProfile.reject')}
                      </button>
                    </div>
                  )}

                  {userData.friendship_status === 'accepted' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ color: '#10b981', fontWeight: 600, fontSize: '0.9rem' }}>
                        {t('userProfile.youAreFriends')}
                      </span>
                      <button
                        type="button"
                        className="btn-remove-avatar"
                        disabled={actionLoading}
                        onClick={handleRemoveFriend}
                      >
                        {t('userProfile.unfriend')}
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
                  <span className="profile-stat-label">{t('userProfile.statsGenerations')}</span>
                </div>
              </div>

              <div className="profile-stat-card">
                <div className="profile-stat-icon">
                  {isOnline ? '🟢' : '⚪'}
                </div>
                <div className="profile-stat-content">
                  <span className="profile-stat-value" style={{ fontSize: '1.1rem' }}>
                    {isOnline ? t('userProfile.online') : t('userProfile.offline')}
                  </span>
                  <span className="profile-stat-label">{t('userProfile.statsPresence')}</span>
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
                  <span className="profile-stat-label">{t('userProfile.statsSince')}</span>
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

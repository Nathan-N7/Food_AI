import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Header from './Header'
import { usePresence } from '../hooks/usePresence'
import { fetchJson } from '../lib/api.js'
import './Friends.css'

const API_URL = '/api'

const Friends = () => {
  const { t } = useTranslation()
  const { isConnected, isFriendOnline, notifications } = usePresence()

  const [activeTab, setActiveTab] = useState('friends') // 'friends' | 'search' | 'requests'
  const [friends, setFriends] = useState([])
  const [requests, setRequests] = useState({ received: [], sent: [] })
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState({})

  const fetchFriends = useCallback(async () => {
    try {
      setLoading(true)
      const data = await fetchJson(`${API_URL}/friends/`)
      setFriends(data)
    } catch (err) {
      if (err.status !== 401) {
        console.error(t('friends.friendLoadError'), err)
      }
    } finally {
      setLoading(false)
    }
  }, [t])

  const fetchRequests = useCallback(async () => {
    try {
      const data = await fetchJson(`${API_URL}/friends/requests/`)
      setRequests(data)
    } catch (err) {
      if (err.status !== 401) {
        console.error(t('friends.requestLoadError'), err)
      }
    }
  }, [t])

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
      try {
        setSearchLoading(true)
        const data = await fetchJson(
          `${API_URL}/users/search/?q=${encodeURIComponent(searchQuery.trim())}`,
        )
        setSearchResults(data)
      } catch (err) {
        if (err.status !== 401) {
          console.error(t('friends.searchError'), err)
        }
      } finally {
        setSearchLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, t])

  async function handleSendRequest(userId) {
    setActionLoading((prev) => ({ ...prev, [userId]: true }))

    try {
      const data = await fetchJson(`${API_URL}/friends/request/${userId}/`, {
        method: 'POST',
      })

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
    } catch (err) {
      alert(err.message || t('friends.requestError'))
    } finally {
      setActionLoading((prev) => ({ ...prev, [userId]: false }))
    }
  }

  async function handleRespondRequest(requestId, action) {
    setActionLoading((prev) => ({ ...prev, [requestId]: true }))

    try {
      await fetchJson(`${API_URL}/friends/respond/${requestId}/`, {
        method: 'POST',
        body: { action },
      })

      setRequests((prev) => ({
        ...prev,
        received: prev.received.filter((r) => r.id !== requestId),
      }))
      if (action === 'accept') {
        fetchFriends()
      }
    } catch {
      alert(t('friends.respondError'))
    } finally {
      setActionLoading((prev) => ({ ...prev, [requestId]: false }))
    }
  }

  async function handleRemoveFriend(friendId, friendName) {
    if (!confirm(t('friends.confirmRemove', { name: friendName }))) return

    try {
      await fetchJson(`${API_URL}/friends/${friendId}/`, {
        method: 'DELETE',
      })
      setFriends((prev) => prev.filter((f) => f.id !== friendId))
    } catch {
      alert(t('friends.removeError'))
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
          <h2>{t('friends.title')}</h2>
          <div className="friends-live-badge">
            <span className="live-dot" style={{ backgroundColor: isConnected ? '#10b981' : '#f59e0b' }} />
            <span>{isConnected ? t('friends.realtime') : t('friends.connecting')}</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="friends-tabs">
          <button
            type="button"
            className={`friends-tab-btn ${activeTab === 'friends' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('friends')}
          >
            <span>{t('friends.myFriends')}</span>
            <span className="friends-tab-count">{friends.length}</span>
          </button>

          <button
            type="button"
            className={`friends-tab-btn ${activeTab === 'search' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('search')}
          >
            <span>{t('friends.searchUsers')}</span>
          </button>

          <button
            type="button"
            className={`friends-tab-btn ${activeTab === 'requests' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            <span>{t('friends.requests')}</span>
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
              <p>{t('friends.loading')}</p>
            ) : friends.length === 0 ? (
              <div className="friends-empty-state">
                <div className="friends-empty-state-icon">👥</div>
                <h3>{t('friends.emptyTitle')}</h3>
                <p>{t('friends.emptyText')}</p>
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
                          title={online ? t('friends.onlineNow') : t('friends.offline')}
                        />
                      </div>

                      <h4 className="friend-card-name" title={displayName}>
                        {displayName}
                      </h4>
                      <div className="friend-card-username">@{friend.username}</div>

                      <div className="friend-card-actions">
                        <Link to={`/profile/${friend.id}`} className="btn-primary-sm">
                          {t('friends.viewProfile')}
                        </Link>
                        <button
                          type="button"
                          className="btn-danger-sm"
                          onClick={() => handleRemoveFriend(friend.id, displayName)}
                        >
                          {t('friends.remove')}
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
                placeholder={t('friends.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>

            {searchLoading ? (
              <p>{t('friends.searchLoading')}</p>
            ) : searchQuery.trim() && searchResults.length === 0 ? (
              <div className="friends-empty-state">
                <div className="friends-empty-state-icon">🔍</div>
                <p>{t('friends.noResults', { query: searchQuery })}</p>
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
                          title={online ? t('friends.online') : t('friends.offline')}
                        />
                      </div>

                      <h4 className="friend-card-name" title={displayName}>
                        {displayName}
                      </h4>
                      <div className="friend-card-username">@{user.username}</div>

                      <div className="friend-card-actions">
                        <Link to={`/profile/${user.id}`} className="btn-primary-sm">
                          {t('friends.profile')}
                        </Link>

                        {user.friendship_status === 'accepted' ? (
                          <span style={{ fontSize: '0.85rem', color: '#10b981', alignSelf: 'center' }}>
                            {t('friends.friends')}
                          </span>
                        ) : user.friendship_status === 'pending_sent' ? (
                          <span style={{ fontSize: '0.85rem', color: 'var(--text)', alignSelf: 'center' }}>
                            {t('friends.sent')}
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="btn-primary-sm"
                            disabled={isLoading}
                            onClick={() => handleSendRequest(user.id)}
                          >
                            {isLoading ? t('friends.sending') : t('friends.add')}
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
              {t('friends.receivedRequests', { count: requests.received.length })}
            </h3>

            {requests.received.length === 0 ? (
              <p style={{ color: 'var(--text)', marginBottom: '2rem' }}>
                {t('friends.noPending')}
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
                          {t('friends.accept')}
                        </button>
                        <button
                          type="button"
                          className="btn-danger-sm"
                          disabled={isLoading}
                          onClick={() => handleRespondRequest(req.id, 'reject')}
                        >
                          {t('friends.reject')}
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
                  {t('friends.sentRequests', { count: requests.sent.length })}
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
                          {t('friends.awaiting')}
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

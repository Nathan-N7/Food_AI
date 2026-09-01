import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import Header from './Header'
import { fetchJson } from '../lib/api.js'
import './Profile.css'

const API_URL = '/api'

const Profile = () => {
  const fileInputRef = useRef(null)
  const { t } = useTranslation()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profileData, setProfileData] = useState(null)
  const [message, setMessage] = useState({ text: '', type: '' })

  // Form states
  const [nickname, setNickname] = useState('')
  const [email, setEmail] = useState('')
  const [bio, setBio] = useState('')
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [avatarFile, setAvatarFile] = useState(null)
  const [removeAvatar, setRemoveAvatar] = useState(false)

  // Password fields
  const [showPasswordSection, setShowPasswordSection] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true)
      const data = await fetchJson(`${API_URL}/users/profile/`)

      setProfileData(data)
      setNickname(data.nickname || '')
      setEmail(data.email || '')
      setBio(data.bio || '')
      setAvatarPreview(data.avatar || null)
    } catch {
      setMessage({
        text: t('profile.loadError'),
        type: 'error',
      })
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  // Revoke the blob URL for the avatar preview on unmount (minor leak).
  useEffect(() => {
    return () => {
      if (avatarPreview && avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview)
      }
    }
  }, [avatarPreview])

  function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setMessage({
        text: t('profile.invalidImage'),
        type: 'error',
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage({
        text: t('profile.imageTooLarge'),
        type: 'error',
      })
      return
    }

    setAvatarFile(file)
    setRemoveAvatar(false)
    if (avatarPreview && avatarPreview.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreview)
    }
    setAvatarPreview(URL.createObjectURL(file))
  }

  function handleRemoveAvatar() {
    setAvatarFile(null)
    if (avatarPreview && avatarPreview.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreview)
    }
    setAvatarPreview(null)
    setRemoveAvatar(true)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage({ text: '', type: '' })

    if (newPassword && newPassword !== confirmPassword) {
      setMessage({
        text: t('profile.passwordMismatch'),
        type: 'error',
      })
      return
    }

    setSaving(true)

    try {
      const formData = new FormData()
      formData.append('nickname', nickname)
      formData.append('email', email)
      formData.append('bio', bio)

      if (avatarFile) {
        formData.append('avatar', avatarFile)
      } else if (removeAvatar) {
        formData.append('remove_avatar', 'true')
      }

      if (newPassword) {
        formData.append('current_password', currentPassword)
        formData.append('new_password', newPassword)
      }

      const data = await fetchJson(`${API_URL}/users/profile/`, {
        method: 'PATCH',
        body: formData,
      })

      setProfileData(data)
      setAvatarPreview(data.avatar || null)
      setAvatarFile(null)
      setRemoveAvatar(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')

      setMessage({ text: t('profile.updated'), type: 'success' })
    } catch (err) {
      setMessage({
        text: err.data?.details?.join(', ') || err.message || t('profile.saveError'),
        type: 'error',
      })
    } finally {
      setSaving(false)
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

  const displayName = nickname || profileData?.username || t('profile.user')

  if (loading) {
    return (
      <>
        <Header />
        <main className="profile-container">
          <p>{t('profile.loading')}</p>
        </main>
      </>
    )
  }

  return (
    <>
      <Header user={profileData} avatarUrl={avatarPreview} />
      <main className="profile-container">
        {message.text && (
          <div className={`profile-alert profile-alert-${message.type}`}>
            <span>{message.text}</span>
            <button
              type="button"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
              onClick={() => setMessage({ text: '', type: '' })}
            >
              ✕
            </button>
          </div>
        )}

        {/* Header Summary Card */}
        <section className="profile-header-card">
          <div className="profile-avatar-wrapper">
            <div className="profile-avatar-img">
              {avatarPreview ? (
                <img src={avatarPreview} alt={t('profile.avatarOf', { name: displayName })} />
              ) : (
                <span>{getInitials(displayName)}</span>
              )}
            </div>

            <button
              type="button"
              className="profile-avatar-upload-btn"
              title={t('profile.changeAvatar')}
              onClick={() => fileInputRef.current?.click()}
            >
              📷
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
            />
          </div>

          <div className="profile-info-summary">
            <h2>{displayName}</h2>
            <div className="profile-username-tag">@{profileData?.username}</div>
            {profileData?.bio ? (
              <p className="profile-bio-text">{profileData.bio}</p>
            ) : (
              <p className="profile-bio-text" style={{ fontStyle: 'italic', opacity: 0.7 }}>
                {t('profile.noBio')}
              </p>
            )}

            {avatarPreview && (
              <div className="profile-avatar-actions">
                <button
                  type="button"
                  className="btn-remove-avatar"
                  onClick={handleRemoveAvatar}
                >
                  {t('profile.restoreAvatar')}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Stats Grid */}
        <section className="profile-stats-grid">
          <div className="profile-stat-card">
            <div className="profile-stat-icon">🎨</div>
            <div className="profile-stat-content">
              <span className="profile-stat-value">
                {profileData?.generations_count || 0}
              </span>
              <span className="profile-stat-label">{t('profile.statsGenerations')}</span>
            </div>
          </div>

          <div className="profile-stat-card">
            <div className="profile-stat-icon">👥</div>
            <div className="profile-stat-content">
              <span className="profile-stat-value">
                {profileData?.friends_count || 0}
              </span>
              <span className="profile-stat-label">{t('profile.statsFriends')}</span>
            </div>
          </div>

          <div className="profile-stat-card">
            <div className="profile-stat-icon">📅</div>
            <div className="profile-stat-content">
              <span className="profile-stat-value" style={{ fontSize: '1rem' }}>
                {profileData?.date_joined
                  ? new Date(profileData.date_joined).toLocaleDateString('pt-BR')
                  : '—'}
              </span>
              <span className="profile-stat-label">{t('profile.statsSince')}</span>
            </div>
          </div>
        </section>

        {/* Edit Form */}
        <form onSubmit={handleSubmit}>
          <section className="profile-card">
            <h3 className="profile-card-title">{t('profile.personalInfo')}</h3>

            <div className="profile-form-group">
              <label htmlFor="username">{t('profile.usernameLabel')}</label>
              <input
                id="username"
                type="text"
                className="profile-input"
                value={profileData?.username || ''}
                disabled
              />
            </div>

            <div className="profile-form-group">
              <label htmlFor="nickname">{t('profile.nicknameLabel')}</label>
              <input
                id="nickname"
                type="text"
                className="profile-input"
                placeholder={t('profile.nicknamePlaceholder')}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={50}
              />
            </div>

            <div className="profile-form-group">
              <label htmlFor="email">{t('profile.emailLabel')}</label>
              <input
                id="email"
                type="email"
                className="profile-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="profile-form-group">
              <label htmlFor="bio">
                {t('profile.bioLabel')} <small>({t('profile.bioChars', { count: bio.length })})</small>
              </label>
              <textarea
                id="bio"
                className="profile-textarea"
                placeholder={t('profile.bioPlaceholder')}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={300}
              />
            </div>
          </section>

          {/* Security / Password Section */}
          <section className="profile-card">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
              }}
              onClick={() => setShowPasswordSection(!showPasswordSection)}
            >
              <h3 className="profile-card-title" style={{ margin: 0, border: 'none' }}>
                {t('profile.changePassword', { arrow: showPasswordSection ? t('profile.arrow_up') : t('profile.arrow_down') })}
              </h3>
            </div>

            {showPasswordSection && (
              <div style={{ marginTop: '1.25rem' }}>
                <div className="profile-form-group">
                  <label htmlFor="currentPassword">{t('profile.currentPassword')}</label>
                  <input
                    id="currentPassword"
                    type="password"
                    className="profile-input"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder={t('profile.currentPasswordPlaceholder')}
                  />
                </div>

                <div className="profile-form-group">
                  <label htmlFor="newPassword">{t('profile.newPassword')}</label>
                  <input
                    id="newPassword"
                    type="password"
                    className="profile-input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t('profile.newPasswordPlaceholder')}
                  />
                </div>

                <div className="profile-form-group">
                  <label htmlFor="confirmPassword">{t('profile.confirmPassword')}</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    className="profile-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('profile.confirmPasswordPlaceholder')}
                  />
                </div>
              </div>
            )}
          </section>

          <button
            type="submit"
            className="profile-submit-btn"
            disabled={saving}
          >
            {saving ? t('profile.saving') : t('profile.save')}
          </button>
        </form>
      </main>
    </>
  )
}

export default Profile

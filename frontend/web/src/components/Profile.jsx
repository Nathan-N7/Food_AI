import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import './Social.css'

const API_URL = '/api'

const Profile = () => {
  const navigate = useNavigate()
  const { userId } = useParams()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')

  // Edit form state
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [saving, setSaving] = useState(false)

  const token = localStorage.getItem('token')
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
  const isOwnProfile = !userId || String(userId) === String(currentUser.id)

  useEffect(() => {
    fetchProfile()
  }, [userId])

  async function fetchProfile() {
    setLoading(true)
    try {
      const url = isOwnProfile
        ? `${API_URL}/profile/`
        : `${API_URL}/profile/${userId}/`

      const res = await fetch(url, {
        headers: { Authorization: `Token ${token}` },
      })

      if (!res.ok) throw new Error('Erro ao carregar perfil')

      const data = await res.json()
      setProfile(data)
      setDisplayName(data.display_name || '')
      setBio(data.bio || '')
    } catch (err) {
      showMessage(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  function showMessage(text, type = 'success') {
    setMessage(text)
    setMessageType(type)
    setTimeout(() => setMessage(''), 4000)
  }

  function handleAvatarChange(e) {
    const file = e.target.files[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onload = (ev) => setAvatarPreview(ev.target.result)
      reader.readAsDataURL(file)
    }
  }

  async function handleSaveProfile(e) {
    e.preventDefault()
    setSaving(true)

    try {
      const formData = new FormData()
      formData.append('display_name', displayName)
      formData.append('bio', bio)
      if (avatarFile) {
        formData.append('avatar', avatarFile)
      }

      const res = await fetch(`${API_URL}/profile/`, {
        method: 'PUT',
        headers: { Authorization: `Token ${token}` },
        body: formData,
      })

      if (!res.ok) throw new Error('Erro ao salvar perfil')

      const data = await res.json()
      setProfile(data)
      setEditing(false)
      setAvatarFile(null)
      setAvatarPreview(null)
      showMessage('Perfil atualizado com sucesso!', 'success')
    } catch (err) {
      showMessage(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleAddFriend() {
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
      fetchProfile()
    } catch (err) {
      showMessage(err.message, 'error')
    }
  }

  function getInitials(name) {
    return (name || '?').charAt(0).toUpperCase()
  }

  function renderAvatar(src, name, large = false) {
    const cls = large ? 'avatar avatar-lg' : 'avatar'
    const plcCls = large
      ? 'avatar avatar-lg avatar-placeholder'
      : 'avatar avatar-placeholder'

    if (src) {
      return <img src={src} alt={name} className={cls} />
    }
    return (
      <div className={plcCls}>
        {getInitials(name)}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="social-page">
        <header className="social-header">
          <h1>Perfil</h1>
          <button className="back-btn" onClick={() => navigate('/dashboard')}>
            ← Voltar
          </button>
        </header>
        <div className="loading-spinner" />
      </div>
    )
  }

  return (
    <div className="social-page">
      <header className="social-header">
        <h1>Perfil</h1>
        <button className="back-btn" onClick={() => navigate('/dashboard')}>
          ← Voltar
        </button>
      </header>

      {message && (
        <div className={`status-message ${messageType}`}>
          {message}
        </div>
      )}

      <div className="profile-container">
        <div className="social-card profile-card">
          {renderAvatar(
            avatarPreview || profile?.avatar,
            profile?.display_name || profile?.username,
            true,
          )}

          {!editing ? (
            <>
              <h2 className="display-name">
                {profile?.display_name || profile?.username}
              </h2>
              <p className="username">@{profile?.username}</p>
              <p className="email">{profile?.email}</p>

              {profile?.bio && (
                <p className="bio">{profile.bio}</p>
              )}

              {isOwnProfile ? (
                <button
                  className="btn-primary"
                  onClick={() => setEditing(true)}
                >
                  ✏️ Editar Perfil
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '16px' }}>
                  {profile?.friendship_status === 'accepted' ? (
                    <button
                      className="btn-primary"
                      onClick={() => navigate(`/chat/${userId}`)}
                    >
                      💬 Enviar Mensagem
                    </button>
                  ) : profile?.friendship_status === 'pending' ? (
                    <button className="btn-secondary" disabled>
                      ⏳ Pedido Enviado
                    </button>
                  ) : (
                    <button className="btn-primary" onClick={handleAddFriend}>
                      ➕ Adicionar Amigo
                    </button>
                  )}
                </div>
              )}
            </>
          ) : (
            <form className="profile-edit-form" onSubmit={handleSaveProfile}>
              <div className="form-group">
                <label>Avatar</label>
                <div className="avatar-upload">
                  {renderAvatar(
                    avatarPreview || profile?.avatar,
                    displayName || profile?.username,
                    false,
                  )}
                  <label className="avatar-upload-label" htmlFor="avatar-input">
                    📷 Escolher Foto
                  </label>
                  <input
                    id="avatar-input"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="display-name">Nome de Exibição</label>
                <input
                  id="display-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Seu nome de exibição"
                  maxLength={100}
                />
              </div>

              <div className="form-group">
                <label htmlFor="bio-input">Bio</label>
                <textarea
                  id="bio-input"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Conte um pouco sobre você..."
                  maxLength={500}
                  rows={3}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Salvando...' : '💾 Salvar'}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setEditing(false)
                    setAvatarFile(null)
                    setAvatarPreview(null)
                    setDisplayName(profile?.display_name || '')
                    setBio(profile?.bio || '')
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default Profile

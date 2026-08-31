import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from './Header'
import './Profile.css'

const API_URL = '/api'

const Profile = () => {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

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

  useEffect(() => {
    fetchProfile()
  }, [])

  async function fetchProfile() {
    const token = sessionStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/users/profile/`, {
        headers: {
          Authorization: `Token ${token}`,
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          navigate('/login')
          return
        }
        throw new Error('Erro ao carregar perfil')
      }

      const data = await response.json()
      setProfileData(data)
      setNickname(data.nickname || '')
      setEmail(data.email || '')
      setBio(data.bio || '')
      setAvatarPreview(data.avatar || null)
    } catch (err) {
      setMessage({
        text: 'Não foi possível carregar os dados do perfil.',
        type: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setMessage({
        text: 'Por favor, selecione um arquivo de imagem válido.',
        type: 'error',
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage({
        text: 'A imagem deve ter no máximo 5 MB.',
        type: 'error',
      })
      return
    }

    setAvatarFile(file)
    setRemoveAvatar(false)
    setAvatarPreview(URL.createObjectURL(file))
  }

  function handleRemoveAvatar() {
    setAvatarFile(null)
    setAvatarPreview(null)
    setRemoveAvatar(true)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage({ text: '', type: '' })

    if (newPassword && newPassword !== confirmPassword) {
      setMessage({
        text: 'A nova senha e a confirmação não coincidem.',
        type: 'error',
      })
      return
    }

    const token = sessionStorage.getItem('token')
    if (!token) {
      navigate('/login')
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

      const response = await fetch(`${API_URL}/users/profile/`, {
        method: 'PATCH',
        headers: {
          Authorization: `Token ${token}`,
        },
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage({
          text: data.error || (data.details ? data.details.join(', ') : 'Erro ao atualizar perfil'),
          type: 'error',
        })
        return
      }

      setProfileData(data)
      setAvatarPreview(data.avatar || null)
      setAvatarFile(null)
      setRemoveAvatar(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')

      // Update sessionStorage user so Header reflects changes instantly
      const storedUser = sessionStorage.getItem('user')
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser)
          parsed.nickname = data.nickname
          parsed.email = data.email
          parsed.avatar = data.avatar
          sessionStorage.setItem('user', JSON.stringify(parsed))
        } catch {
          // ignore
        }
      }

      setMessage({ text: 'Perfil atualizado com sucesso!', type: 'success' })
    } catch (err) {
      setMessage({
        text: 'Erro de conexão ao salvar alterações.',
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

  const displayName = nickname || profileData?.username || 'Usuário'

  if (loading) {
    return (
      <>
        <Header />
        <main className="profile-container">
          <p>Carregando perfil...</p>
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
                <img src={avatarPreview} alt={`Avatar de ${displayName}`} />
              ) : (
                <span>{getInitials(displayName)}</span>
              )}
            </div>

            <button
              type="button"
              className="profile-avatar-upload-btn"
              title="Trocar avatar"
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
                Nenhuma bio adicionada ainda.
              </p>
            )}

            {avatarPreview && (
              <div className="profile-avatar-actions">
                <button
                  type="button"
                  className="btn-remove-avatar"
                  onClick={handleRemoveAvatar}
                >
                  Restaurar avatar padrão
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
              <span className="profile-stat-label">Gerações Feitas</span>
            </div>
          </div>

          <div className="profile-stat-card">
            <div className="profile-stat-icon">👥</div>
            <div className="profile-stat-content">
              <span className="profile-stat-value">
                {profileData?.friends_count || 0}
              </span>
              <span className="profile-stat-label">Amigos</span>
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
              <span className="profile-stat-label">Membro Desde</span>
            </div>
          </div>
        </section>

        {/* Edit Form */}
        <form onSubmit={handleSubmit}>
          <section className="profile-card">
            <h3 className="profile-card-title">Informações Pessoais</h3>

            <div className="profile-form-group">
              <label htmlFor="username">Nome de Usuário (Identificador)</label>
              <input
                id="username"
                type="text"
                className="profile-input"
                value={profileData?.username || ''}
                disabled
              />
            </div>

            <div className="profile-form-group">
              <label htmlFor="nickname">Apelido (Nome de Exibição)</label>
              <input
                id="nickname"
                type="text"
                className="profile-input"
                placeholder="Como quer ser chamado?"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={50}
              />
            </div>

            <div className="profile-form-group">
              <label htmlFor="email">Email</label>
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
                Biografia <small>({bio.length}/300 caracteres)</small>
              </label>
              <textarea
                id="bio"
                className="profile-textarea"
                placeholder="Conte um pouco sobre você e seus pratos favoritos..."
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
                Alterar Senha {showPasswordSection ? '▲' : '▼'}
              </h3>
            </div>

            {showPasswordSection && (
              <div style={{ marginTop: '1.25rem' }}>
                <div className="profile-form-group">
                  <label htmlFor="currentPassword">Senha Atual</label>
                  <input
                    id="currentPassword"
                    type="password"
                    className="profile-input"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Digite sua senha atual"
                  />
                </div>

                <div className="profile-form-group">
                  <label htmlFor="newPassword">Nova Senha</label>
                  <input
                    id="newPassword"
                    type="password"
                    className="profile-input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                  />
                </div>

                <div className="profile-form-group">
                  <label htmlFor="confirmPassword">Confirmar Nova Senha</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    className="profile-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a nova senha"
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
            {saving ? 'Salvando alterações...' : '💾 Salvar Alterações'}
          </button>
        </form>
      </main>
    </>
  )
}

export default Profile

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Box, Button, Card, CardContent, TextField, Typography, Container, 
  AppBar, Toolbar, Avatar, CircularProgress, Divider, Stack 
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import EditIcon from '@mui/icons-material/Edit'
import SaveIcon from '@mui/icons-material/Save'
import CancelIcon from '@mui/icons-material/Cancel'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import ChatIcon from '@mui/icons-material/Chat'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import SecurityIcon from '@mui/icons-material/Security'

const API_URL = '/api'

const Profile = () => {
  const { userId } = useParams()
  const navigate = useNavigate()

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('success')

  const [isOwnProfile, setIsOwnProfile] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)

  const [setup2fa, setSetup2fa] = useState(false)
  const [qrCode, setQrCode] = useState(null)
  const [totpCode, setTotpCode] = useState('')
  const [disable2fa, setDisable2fa] = useState(false)
  const [password, setPassword] = useState('')

  useEffect(() => {
    fetchProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  async function fetchProfile() {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    try {
      const endpoint = userId ? `${API_URL}/profile/${userId}/` : `${API_URL}/profile/`
      const response = await fetch(endpoint, {
        headers: { Authorization: `Token ${token}` },
      })

      const data = await response.json()
      if (!response.ok) {
        showMessage(data.error || 'Erro ao carregar perfil', 'error')
        return
      }

      setProfile(data)
      setIsOwnProfile(!userId || String(data.id) === String(JSON.parse(localStorage.getItem('user') || '{}').id))

      setDisplayName(data.display_name || '')
      setBio(data.bio || '')
    } catch (error) {
      showMessage('Não foi possível conectar ao backend', 'error')
    } finally {
      setLoading(false)
    }
  }

  function showMessage(msg, type = 'success') {
    setMessage(msg)
    setMessageType(type)
    setTimeout(() => setMessage(''), 5000)
  }

  
  async function handleAcceptFriend() {
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`${API_URL}/friends/accept/${profile.friendship_id}/`, {
        method: 'POST',
        headers: { Authorization: `Token ${token}` },
      })
      if (!res.ok) throw new Error('Erro ao aceitar pedido')
      showMessage('Pedido aceito com sucesso!', 'success')
      fetchProfile()
    } catch (err) {
      showMessage(err.message, 'error')
    }
  }

  async function handleRejectFriend() {
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`${API_URL}/friends/reject/${profile.friendship_id}/`, {
        method: 'POST',
        headers: { Authorization: `Token ${token}` },
      })
      if (!res.ok) throw new Error('Erro ao recusar pedido')
      showMessage('Pedido recusado.', 'info')
      fetchProfile()
    } catch (err) {
      showMessage(err.message, 'error')
    }
  }

  async function handleAddFriend() {
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`${API_URL}/friends/request/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({ to_user_id: parseInt(userId, 10) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      
      showMessage('Pedido de amizade enviado!')
      fetchProfile()
    } catch (err) {
      showMessage(err.message, 'error')
    }
  }

  function handleAvatarChange(e) {
    const file = e.target.files[0]
    if (file) {
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  async function handleSaveProfile(e) {
    e.preventDefault()
    setSaving(true)
    const token = localStorage.getItem('token')

    const formData = new FormData()
    formData.append('display_name', displayName)
    formData.append('bio', bio)
    if (avatarFile) formData.append('avatar', avatarFile)

    try {
      const res = await fetch(`${API_URL}/profile/`, {
        method: 'PUT',
        headers: { Authorization: `Token ${token}` },
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setProfile(data)
      setEditing(false)
      showMessage('Perfil atualizado com sucesso!')
    } catch (err) {
      showMessage(err.message || 'Erro ao salvar', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleSetup2FA() {
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`${API_URL}/auth/2fa/setup/`, {
        method: 'POST',
        headers: { Authorization: `Token ${token}` }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setQrCode(data.qr_code_url)
      setSetup2fa(true)
    } catch (err) {
      showMessage(err.message, 'error')
    }
  }

  async function handleVerify2FA(e) {
    e.preventDefault()
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`${API_URL}/auth/2fa/verify/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`
        },
        body: JSON.stringify({ totp_code: totpCode })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setProfile({...profile, two_factor_enabled: true})
      setSetup2fa(false)
      setTotpCode('')
      showMessage('2FA enabled successfully')
    } catch (err) {
      showMessage(err.message, 'error')
    }
  }

  async function handleDisable2FA(e) {
    e.preventDefault()
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`${API_URL}/auth/2fa/disable/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`
        },
        body: JSON.stringify({ password, totp_code: totpCode })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setProfile({...profile, two_factor_enabled: false})
      setDisable2fa(false)
      setPassword('')
      setTotpCode('')
      showMessage('2FA disabled successfully')
    } catch (err) {
      showMessage(err.message, 'error')
    }
  }

  function getInitials(name) {
    return (name || '?').charAt(0).toUpperCase()
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: 'background.default' }}>
        <CircularProgress color="primary" />
        <Typography variant="h6" sx={{ mt: 2, color: 'text.secondary' }}>Carregando perfil...</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: 'primary.main', fontWeight: 'bold' }}>
            Transcendence
          </Typography>
          <Button color="inherit" onClick={() => navigate('/dashboard')} startIcon={<ArrowBackIcon />}>
            Voltar
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ mt: 4, pb: 4 }}>
        {message && (
          <Typography align="center" sx={{ mb: 2, p: 1, borderRadius: 1, backgroundColor: messageType === 'error' ? 'error.dark' : 'success.dark', color: '#fff' }}>
            {message}
          </Typography>
        )}

        <Card sx={{ p: 2 }}>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            
            <Avatar 
              src={avatarPreview || profile?.avatar} 
              sx={{ width: 120, height: 120, mb: 2, fontSize: '3rem', backgroundColor: 'primary.main' }}
            >
              {!avatarPreview && !profile?.avatar && getInitials(profile?.display_name || profile?.username)}
            </Avatar>

            {!editing ? (
              <>
                <Typography variant="h4" gutterBottom>
                  {profile?.display_name || profile?.username}
                </Typography>
                <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                  @{profile?.username}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {profile?.email}
                </Typography>

                {profile?.bio && (
                  <Typography variant="body1" align="center" sx={{ mb: 3, maxWidth: '80%' }}>
                    {profile.bio}
                  </Typography>
                )}

                {isOwnProfile ? (
                  <Box sx={{ width: '100%' }}>
                    <Button 
                      variant="contained" 
                      startIcon={<EditIcon />} 
                      fullWidth 
                      onClick={() => setEditing(true)}
                      sx={{ mb: 3 }}
                    >
                      Editar Perfil
                    </Button>

                    <Divider sx={{ my: 2 }} />
                    
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                        <SecurityIcon color="primary" /> Two-Factor Authentication
                      </Typography>
                      
                      {profile?.two_factor_enabled ? (
                        <Box>
                          <Typography color="success.main" fontWeight="bold" sx={{ mb: 2 }}>Enabled</Typography>
                          {!disable2fa ? (
                            <Button variant="outlined" color="error" fullWidth onClick={() => setDisable2fa(true)}>Disable 2FA</Button>
                          ) : (
                            <Box component="form" onSubmit={handleDisable2FA} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <TextField type="password" label="Password" fullWidth value={password} onChange={e => setPassword(e.target.value)} required />
                              <TextField label="6-digit code" fullWidth value={totpCode} onChange={e => setTotpCode(e.target.value)} inputProps={{ maxLength: 6 }} required />
                              <Stack direction="row" spacing={2}>
                                <Button type="submit" variant="contained" color="primary" fullWidth>Confirm Disable</Button>
                                <Button variant="outlined" color="secondary" fullWidth onClick={() => {setDisable2fa(false); setTotpCode(""); setPassword("")}}>Cancel</Button>
                              </Stack>
                            </Box>
                          )}
                        </Box>
                      ) : (
                        <Box>
                          {!setup2fa ? (
                            <Button variant="contained" color="primary" fullWidth onClick={handleSetup2FA}>Enable 2FA</Button>
                          ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                              <Typography variant="body2" align="center">Scan this QR code with your authenticator app.</Typography>
                              {qrCode && <img src={qrCode} alt="2FA QR Code" style={{ maxWidth: "200px", borderRadius: '8px', border: '2px solid white' }} />}
                              <Box component="form" onSubmit={handleVerify2FA} sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <TextField label="Enter 6-digit code" fullWidth value={totpCode} onChange={e => setTotpCode(e.target.value)} inputProps={{ maxLength: 6 }} required />
                                <Stack direction="row" spacing={2}>
                                  <Button type="submit" variant="contained" color="primary" fullWidth>Confirm</Button>
                                  <Button variant="outlined" color="secondary" fullWidth onClick={() => {setSetup2fa(false); setTotpCode(""); setQrCode(null)}}>Cancel</Button>
                                </Stack>
                              </Box>
                            </Box>
                          )}
                        </Box>
                      )}
                    </Box>
                  </Box>
                ) : (
                  <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                    {profile?.friendship_status === 'accepted' ? (
                      <Button variant="contained" color="primary" startIcon={<ChatIcon />} onClick={() => navigate(`/chat/${userId}`)}>
                        Enviar Mensagem
                      </Button>
                    ) : profile?.friendship_status === 'pending' ? (
                      profile?.friendship_sender_id === JSON.parse(localStorage.getItem('user') || '{}').id ? (
                        <Button variant="outlined" color="secondary" disabled startIcon={<AccessTimeIcon />}>
                          Pedido Enviado
                        </Button>
                      ) : (
                        <Stack direction="row" spacing={1}>
                          <Button variant="contained" color="success" onClick={handleAcceptFriend}>
                            Aceitar
                          </Button>
                          <Button variant="outlined" color="error" onClick={handleRejectFriend}>
                            Recusar
                          </Button>
                        </Stack>
                      )
                    ) : (
                      <Button variant="contained" color="primary" startIcon={<PersonAddIcon />} onClick={handleAddFriend}>
                        Adicionar Amigo
                      </Button>
                    )}
                  </Stack>
                )}
              </>
            ) : (
              <Box component="form" onSubmit={handleSaveProfile} sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                  <Button variant="outlined" component="label" sx={{ textTransform: 'none' }}>
                    Escolher Nova Foto
                    <input type="file" hidden accept="image/*" onChange={handleAvatarChange} />
                  </Button>
                </Box>

                <TextField
                  label="Nome de Exibição"
                  variant="outlined"
                  fullWidth
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  inputProps={{ maxLength: 100 }}
                />

                <TextField
                  label="Bio"
                  variant="outlined"
                  fullWidth
                  multiline
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  inputProps={{ maxLength: 500 }}
                />

                <Stack direction="row" spacing={2}>
                  <Button type="submit" variant="contained" color="primary" startIcon={<SaveIcon />} fullWidth disabled={saving}>
                    {saving ? 'Salvando...' : 'Salvar'}
                  </Button>
                  <Button variant="outlined" color="secondary" startIcon={<CancelIcon />} fullWidth onClick={() => {
                    setEditing(false)
                    setAvatarFile(null)
                    setAvatarPreview(null)
                    setDisplayName(profile?.display_name || '')
                    setBio(profile?.bio || '')
                  }}>
                    Cancelar
                  </Button>
                </Stack>
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  )
}

export default Profile

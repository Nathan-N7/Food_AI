import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import Header from './Header'
import { useTranslation } from 'react-i18next'

const Dashboard = () => {
  const [user] = useState(() => {
    const savedUser = localStorage.getItem('user')
    if (!savedUser) return null
    try {
      return JSON.parse(savedUser)
    } catch {
      return null
    }
  })

  const navigate = useNavigate()
  const { t } = useTranslation()
  const displayName = user?.nickname || user?.username || 'Usuário'

  return (
    <>
      <Header user={user} />
      <main style={{ maxWidth: '900px', margin: '2rem auto', padding: '0 1.25rem 3rem' }}>
        <section style={{ textAlign: 'left', marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '2rem', margin: '0 0 0.5rem', color: 'var(--text-h)' }}>
            {t('navigation.welcome')} {displayName}!
          </h2>
          <p style={{ color: 'var(--text)', fontSize: '1.05rem' }}>
            {t('dashboard.welcome')}
          </p>
        </section>

        {/* Action Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.25rem',
            textAlign: 'left',
          }}
        >
          <div
            onClick={() => navigate('/generate')}
            style={{
              background: 'linear-gradient(135deg, rgba(170, 59, 255, 0.15) 0%, rgba(99, 102, 241, 0.15) 100%)',
              border: '1px solid var(--accent-border)',
              borderRadius: '16px',
              padding: '1.5rem',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-3px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>✨</div>
            <h3 style={{ margin: '0 0 0.4rem', color: 'var(--text-h)', fontSize: '1.25rem' }}>
              {t('navigation.generate')}
            </h3>
            <p style={{ color: 'var(--text)', fontSize: '0.9rem', margin: 0 }}>
              {t('dashboard.generate')}
            </p>
          </div>

          <div
            onClick={() => navigate('/history')}
            style={{
              background: 'var(--social-bg)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '1.5rem',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-3px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📜</div>
            <h3 style={{ margin: '0 0 0.4rem', color: 'var(--text-h)', fontSize: '1.25rem' }}>
              {t('navigation.history')}
            </h3>
            <p style={{ color: 'var(--text)', fontSize: '0.9rem', margin: 0 }}>
              {t('dashboard.history')}
            </p>
          </div>

          <div
            onClick={() => navigate('/profile')}
            style={{
              background: 'var(--social-bg)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '1.5rem',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-3px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>👤</div>
            <h3 style={{ margin: '0 0 0.4rem', color: 'var(--text-h)', fontSize: '1.25rem' }}>
              {t('navigation.profile')}
            </h3>
            <p style={{ color: 'var(--text)', fontSize: '0.9rem', margin: 0 }}>
              {t('dashboard.profile')}
            </p>
          </div>

          <div
            onClick={() => navigate('/friends')}
            style={{
              background: 'var(--social-bg)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '1.5rem',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-3px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>👥</div>
            <h3 style={{ margin: '0 0 0.4rem', color: 'var(--text-h)', fontSize: '1.25rem' }}>
              {t('navigation.friends')}
            </h3>
            <p style={{ color: 'var(--text)', fontSize: '0.9rem', margin: 0 }}>
              {t('dashboard.friends')}
            </p>
          </div>
        </div>
      </main>
    </>
  )
}

export default Dashboard

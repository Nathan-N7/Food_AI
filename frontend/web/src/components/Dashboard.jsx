import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Header from './Header'
import { useAuth } from '../context/AuthContext.jsx'

const Dashboard = () => {
  const { t } = useTranslation()
  const { user } = useAuth()

  const navigate = useNavigate()
  const displayName = user?.nickname || user?.username || t('dashboard.user')

  return (
    <>
      <Header user={user} />
      <main style={{ maxWidth: '900px', margin: '2rem auto', padding: '0 1.25rem 3rem' }}>
        <section style={{ textAlign: 'left', marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '2rem', margin: '0 0 0.5rem', color: 'var(--text-h)' }}>
            {t('dashboard.welcome', { name: displayName })}
          </h2>
          <p style={{ color: 'var(--text)', fontSize: '1.05rem' }}>
            {t('dashboard.tagline')}
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
              {t('dashboard.generateTitle')}
            </h3>
            <p style={{ color: 'var(--text)', fontSize: '0.9rem', margin: 0 }}>
              {t('dashboard.generateDesc')}
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
              {t('dashboard.historyTitle')}
            </h3>
            <p style={{ color: 'var(--text)', fontSize: '0.9rem', margin: 0 }}>
              {t('dashboard.historyDesc')}
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
              {t('dashboard.myProfileTitle')}
            </h3>
            <p style={{ color: 'var(--text)', fontSize: '0.9rem', margin: 0 }}>
              {t('dashboard.myProfileDesc')}
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
              {t('dashboard.friendsTitle')}
            </h3>
            <p style={{ color: 'var(--text)', fontSize: '0.9rem', margin: 0 }}>
              {t('dashboard.friendsDesc')}
            </p>
          </div>
        </div>
      </main>
    </>
  )
}

export default Dashboard
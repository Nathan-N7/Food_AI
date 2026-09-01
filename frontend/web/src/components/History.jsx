import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Header from './Header'
import { fetchJson } from '../lib/api.js'

const API_URL = '/api'

const History = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function loadHistory() {
      try {
        const data = await fetchJson(`${API_URL}/generations/`)
        setHistory(data)
      } catch (error) {
        setMessage(
          error.message || t('history.loadError'),
        )
      } finally {
        setLoading(false)
      }
    }

    loadHistory()
  }, [t])

  function handleBack() {
    navigate('/generate')
  }

  async function handleDelete(generationId) {
    try {
      await fetchJson(`${API_URL}/generations/${generationId}/`, {
        method: 'DELETE',
      })

      // Remove do estado local
      setHistory((prev) => prev.filter((gen) => gen.id !== generationId))
      setMessage(t('history.deleted'))
    } catch (error) {
      setMessage(error.status === 401 ? t('history.loginAgain') : t('history.deleteError'))
    }
  }

  if (loading) {
    return (
      <>
        <Header />
        <main style={{ maxWidth: '850px', margin: '2rem auto', padding: '0 1.25rem 3rem' }}>
          <p>{t('history.loading')}</p>
        </main>
      </>
    )
  }

  return (
    <>
      <Header />
      <main style={{ maxWidth: '850px', margin: '2rem auto', padding: '0 1.25rem 3rem', textAlign: 'left' }}>
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
          onClick={handleBack}
        >
          {t('history.back')}
        </button>

        <h2 style={{ fontSize: '1.8rem', color: 'var(--text-h)', margin: '0 0 1rem' }}>{t('history.title')}</h2>

      {message && <p>{message}</p>}

      {history.length === 0 && (
        <p>{t('history.empty')}</p>
      )}

      {history.map((generation) => (
        <article
          key={generation.id}
          style={{
            marginTop: '30px',
            paddingBottom: '30px',
            borderBottom: '1px solid #ccc',
          }}
        >
          <h3>
            {t('history.generation', { id: generation.id })}
          </h3>

          <p>
            {t('history.status')}{' '}
            <strong>
              {generation.status}
            </strong>
          </p>

          <p>
            {t('history.date')}{' '}
            {new Date(
              generation.created_at,
            ).toLocaleString()}
          </p>

          <button
            type="button"
            onClick={() => handleDelete(generation.id)}
          >
            {t('history.delete')}
          </button>

          <div>
            <h4>{t('history.originalImage')}</h4>

            <img
              src={generation.original_image}
              alt={t('history.originalImageAlt', { id: generation.id })}
              style={{
                width: '100%',
                maxWidth: '300px',
              }}
            />
          </div>

          <div>
            <h4>{t('history.generatedImage')}</h4>

            <img
              src={generation.generated_image}
              alt={t('history.generatedImageAlt', { id: generation.id })}
              style={{
                width: '100%',
                maxWidth: '300px',
              }}
            />
          </div>
        </article>
      ))}
    </main>
    </>
  )
}

export default History

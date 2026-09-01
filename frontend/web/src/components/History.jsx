import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from './Header'
import { fetchJson } from '../lib/api.js'

const API_URL = '/api'

const History = () => {
  const navigate = useNavigate()
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
          error.message || 'Erro ao carregar histórico',
        )
      } finally {
        setLoading(false)
      }
    }

    loadHistory()
  }, [])

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
      setMessage('Geração excluída com sucesso')
    } catch (error) {
      setMessage(error.status === 401 ? 'Faça login novamente' : 'Erro de conexão')
    }
  }

  if (loading) {
    return (
      <>
        <Header />
        <main style={{ maxWidth: '850px', margin: '2rem auto', padding: '0 1.25rem 3rem' }}>
          <p>Carregando histórico...</p>
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
          ← Voltar para geração
        </button>

        <h2 style={{ fontSize: '1.8rem', color: 'var(--text-h)', margin: '0 0 1rem' }}>Histórico de Gerações</h2>

      {message && <p>{message}</p>}

      {history.length === 0 && (
        <p>Nenhuma geração encontrada.</p>
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
            Geração #{generation.id}
          </h3>

          <p>
            Status:{' '}
            <strong>
              {generation.status}
            </strong>
          </p>

          <p>
            Data:{' '}
            {new Date(
              generation.created_at,
            ).toLocaleString()}
          </p>

          <button
            type="button"
            onClick={() => handleDelete(generation.id)}
          >
            Deletar
          </button>

          <div>
            <h4>Imagem original</h4>

            <img
              src={generation.original_image}
              alt={`Imagem original da geração ${generation.id}`}
              style={{
                width: '100%',
                maxWidth: '300px',
              }}
            />
          </div>

          <div>
            <h4>Imagem gerada</h4>

            <img
              src={generation.generated_image}
              alt={`Imagem gerada ${generation.id}`}
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

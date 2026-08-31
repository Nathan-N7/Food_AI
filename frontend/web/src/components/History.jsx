import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from './Header'

const API_URL = '/api'

const History = () => {
  const navigate = useNavigate()

  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function loadHistory() {
      const token = sessionStorage.getItem('token')

      if (!token) {
        navigate('/login')
        return
      }

      try {
        const response = await fetch(
          `${API_URL}/generations/`,
          {
            headers: {
              Authorization: `Token ${token}`,
            },
          },
        )

        const data = await response.json()

        if (!response.ok) {
          setMessage(
            data.error || 'Erro ao carregar histórico',
          )
          return
        }

        setHistory(data)
      } catch (error) {
        console.error(error)
        setMessage(
          'Não foi possível conectar ao backend',
        )
      } finally {
        setLoading(false)
      }
    }

    loadHistory()
  }, [navigate])

  function handleBack() {
    navigate('/generate')
  }

  async function handleDelete(generationId) {
    const token = sessionStorage.getItem('token')

    if (!token) {
      setMessage('Faça login novamente')
      return
    }

    try {
      const response = await fetch(
        `${API_URL}/generations/${generationId}/`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Token ${token}`,
          },
        },
      )

      if (!response.ok) {
        const data = await response.json()
        setMessage(data.error || 'Erro ao excluir')
        return
      }

      // Remove do estado local
      setHistory(history.filter((gen) => gen.id !== generationId))
      setMessage('Geração excluída com sucesso')
    } catch (error) {
      console.error('Erro ao excluir:', error)
      setMessage('Erro de conexão')
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
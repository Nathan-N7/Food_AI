import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API_URL = '/api'

const History = () => {
  const navigate = useNavigate()

  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function loadHistory() {
      const token = localStorage.getItem('token')

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
    const token = localStorage.getItem('token')

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
      <main>
        <h1>Food AI</h1>
        <p>Carregando histórico...</p>
      </main>
    )
  }

  return (
    <main>
      <h1>Food AI</h1>

      <button
        type="button"
        onClick={handleBack}
      >
        Voltar para geração
      </button>

      <h2>Histórico</h2>

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
  )
}

export default History
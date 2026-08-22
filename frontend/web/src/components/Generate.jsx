import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API_URL = 'http://127.0.0.1:8000/api'

const Generate = () => {
  const navigate = useNavigate()

  const [user] = useState(() => {
    const savedUser = localStorage.getItem('user')

    if (!savedUser) {
      return null
    }

    try {
      return JSON.parse(savedUser)
    } catch {
      return null
    }
  })

  const [image, setImage] = useState(null)
  const [result, setResult] = useState(null)
  const [message, setMessage] = useState('')
  const [generating, setGenerating] = useState(false)

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  async function handleGenerate(event) {
    event.preventDefault()

    const token = localStorage.getItem('token')

    if (!token) {
      setMessage('Usuário não autenticado')
      navigate('/login')
      return
    }

    if (!image) {
      setMessage('Selecione uma imagem')
      return
    }

    setGenerating(true)
    setMessage('Gerando imagem...')
    setResult(null)

    const formData = new FormData()
    formData.append('image', image)

    try {
      const response = await fetch(
        `${API_URL}/generate/`,
        {
          method: 'POST',
          headers: {
            Authorization: `Token ${token}`,
          },
          body: formData,
        },
      )

      const data = await response.json()

      if (!response.ok) {
        setMessage(data.error || 'Erro ao gerar imagem')
        return
      }

      setResult(data)
      setMessage('Imagem gerada com sucesso')
    } catch (error) {
      console.error(error)
      setMessage('Não foi possível concluir a geração')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <main>
      <h1>Food AI</h1>

      <p>
        Logado como: <strong>{user?.username}</strong>
      </p>

      <button type="button" onClick={handleLogout}>
        Sair
      </button>

      <h2>Gerar imagem</h2>

      <form onSubmit={handleGenerate}>
        <div>
          <input
            type="file"
            accept="image/*"
            onChange={(event) => {
              setImage(event.target.files?.[0] || null)
            }}
          />
        </div>

        <br />

        <button type="submit" disabled={generating}>
          {generating ? 'Gerando...' : 'Gerar imagem'}
        </button>
      </form>

      {message && <p>{message}</p>}

      {result?.resultado && (
        <section>
          <h3>Resultado da detecção</h3>
          <p>
            Classe detectada:{' '}
            <strong>{result.resultado.name_class}</strong>
          </p>
          <p>
            Válido:{' '}
            <strong>
              {result.resultado.validate ? 'Sim' : 'Não'}
            </strong>
          </p>
        </section>
      )}

      {result?.url_image && (
        <section>
          <h3>Imagem gerada</h3>

          <img
            src={result.url_image}
            alt="Imagem gerada pelo Food AI"
            style={{
              width: '100%',
              maxWidth: '400px',
            }}
          />
        </section>
      )}
      <button onClick={()=> navigate('/history')}>Histórico</button>
    </main>
  )
}

export default Generate
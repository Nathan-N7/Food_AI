import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from './Header'

const API_URL = '/api'

const Generate = () => {
  const navigate = useNavigate()

  const [user] = useState(() => {
    const savedUser = sessionStorage.getItem('user')

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
  const [preview, setPreview] = useState(null)
  const [progress, setProgress] = useState(0)

  const notificarUsuario = (mensagem) => {
    // 1. Verifica se o navegador suporta notificações
    if (!("Notification" in window)) {
      console.log("Este navegador não suporta notificações.");
      return;
    }
    // 2. Se já tem permissão, dispara a notificação
    if (Notification.permission === "granted") {
      new Notification("Food AI", {
        body: mensagem,
        icon: "/pwa-192x192.png"
      });
    }
    // 3. Se não tem permissão e não foi negado, pede agora
    else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          new Notification("Food AI", {
            body: mensagem,
            icon: "/pwa-192x192.png"
          });
        }
      });
    }
  }

  async function handleGenerate(event) {
    event.preventDefault()

    const token = sessionStorage.getItem('token')

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
    setProgress(0)

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const formData = new FormData()
    formData.append('image', image)

    const xhr = new XMLHttpRequest()

    // Atualiza a % durante o upload
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100)
        setProgress(percent)
      }
    }
    // Quando o servidor responde
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText)
        if (xhr.status >= 200 && xhr.status < 300) {
          setResult(data)
          setMessage('Imagem gerada com sucesso')
          notificarUsuario("Sua imagem está pronta! Venha ver o resultado.");
        } else {
          setMessage(data.error || 'Erro ao gerar imagem')
          notificarUsuario("Ops, ocorreu um erro ao gerar sua imagem.");
        }
      } catch {
        setMessage('Resposta inválida do servidor')
      } finally {
        setGenerating(false)
      }
    }
    // Se a conexão cair
    xhr.onerror = () => {
      setMessage('Não foi possível concluir a geração')
      setGenerating(false)
    }
    xhr.open('POST', `${API_URL}/generate/`)
    xhr.setRequestHeader('Authorization', `Token ${token}`)
    xhr.send(formData)
  }

  return (
    <>
      <Header user={user} />
      <main style={{ maxWidth: '700px', margin: '2rem auto', padding: '0 1.25rem 3rem' }}>
        <h2>Gerar imagem</h2>

        {preview && (
          <div>
            <p>Preview:</p>
            <img
              src={preview}
              alt="Preview da imagem selecionada"
              style={{ width: '100%', maxWidth: '300px' }}
            />
          </div>
        )}

        <form onSubmit={handleGenerate}>
          <div>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                setImage(event.target.files?.[0] || null)
                if (preview) URL.revokeObjectURL(preview)
                setPreview(event.target.files?.[0] ? URL.createObjectURL(event.target.files?.[0]) : null)
              }}
            />
          </div>
          {generating && (
            <div>
              <progress value={progress} max={100} style={{ width: '100%' }} />
              <p>{progress}% enviado — aguardando processamento da IA...</p>
            </div>
          )}
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
        <button onClick={() => navigate('/history')}>Histórico</button>
      </main>
    </>
  )
}

export default Generate
// Shared API helper.
// - Always sends cookies (session auth).
// - Adds X-CSRFToken header for unsafe methods (DRF SessionAuthentication).
// - Parses JSON and normalizes errors.

const unsafeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

function getCookie(name) {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop().split(';').shift()
  return null
}

// Called by the 401 handler. Overridden by AuthContext to keep a single
// source of truth for auth state without an import cycle.
let onUnauthorized = null
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler
}

// Upload a FormData via XHR while reporting progress. Returns a Promise that
// resolves with the parsed JSON response or rejects with an Error carrying the
// HTTP status and server-provided error message. Uses the session cookie +
// X-CSRFToken header (same as fetchJson).
export function uploadForm(url, formData, { onProgress } = {}) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.open('POST', url)
    xhr.withCredentials = true

    const csrf = getCookie('csrftoken')
    if (csrf) xhr.setRequestHeader('X-CSRFToken', csrf)

    if (typeof onProgress === 'function') {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          onProgress(Math.round((event.loaded / event.total) * 100))
        }
      }
    }

    xhr.onload = () => {
      let data = null
      try {
        data = xhr.responseText ? JSON.parse(xhr.responseText) : null
      } catch {
        // fall through to raw text / generic error below
      }

      if (xhr.status === 401) {
        if (onUnauthorized) onUnauthorized()
        const err = new Error('Não autenticado')
        err.status = 401
        reject(err)
        return
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(data)
        return
      }

      const err = new Error(data?.error || data?.detail || 'Erro na requisição')
      err.status = xhr.status
      err.data = data
      reject(err)
    }

    xhr.onerror = () => {
      reject(new Error('Não foi possível conectar ao backend'))
    }

    xhr.send(formData)
  })
}

export async function fetchJson(url, options = {}) {
  const { method = 'GET', body, headers = {}, ...rest } = options

  const finalHeaders = { ...headers }

  if (body !== undefined && body !== null && !(body instanceof FormData)) {
    finalHeaders['Content-Type'] = 'application/json'
  }

  if (unsafeMethods.has(method)) {
    const csrf = getCookie('csrftoken')
    if (csrf) finalHeaders['X-CSRFToken'] = csrf
  }

  let response
  try {
    response = await fetch(url, {
      method,
      credentials: 'include',
      headers: finalHeaders,
      body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
      ...rest,
    })
  } catch {
    throw new Error('Não foi possível conectar ao backend')
  }

  if (response.status === 401) {
    if (onUnauthorized) onUnauthorized()
    throw new Error('Não autenticado')
  }

  const text = await response.text()
  const data = text ? JSON.parse(text) : null

  if (!response.ok) {
    const error = new Error(data?.error || data?.detail || 'Erro na requisição')
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}

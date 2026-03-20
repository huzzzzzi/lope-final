const TOKEN_KEY = 'lope_token'
const BASE = import.meta.env.VITE_API_URL || 'https://lope-final-production.up.railway.app'

export const token = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

async function request(method, url, body, isPublic = false) {
  const headers = {}
  if (!(body instanceof FormData)) headers['Content-Type'] = 'application/json'
  if (!isPublic) {
    const t = token.get()
    if (t) headers['Authorization'] = 'Bearer ' + t
  }
  const res = await fetch(BASE + '/api' + url, {
    method,
    headers,
    body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (res.status === 204) return null
  let data
  try {
    data = await res.json()
  } catch {
    if (!res.ok) {
      const err = new Error(`Server error (${res.status})`)
      err.status = res.status
      throw err
    }
    throw new Error('Invalid response from server')
  }
  if (!res.ok) {
    const err = new Error(data?.error || 'Request failed')
    err.status = res.status
    throw err
  }
  return data
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  patch: (path, body) => request('PATCH', path, body),
  delete: (path) => request('DELETE', path),
  public: {
    get: (path) => request('GET', path, undefined, true),
    post: (path, body) => request('POST', path, body, true),
  },
}

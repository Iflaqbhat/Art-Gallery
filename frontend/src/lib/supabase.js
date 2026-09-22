const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/$/, '')
let tokenProvider = async () => null

export const setApiTokenProvider = (provider) => { tokenProvider = provider }

export async function apiFetch(path, options = {}) {
  const token = await tokenProvider()
  const headers = new Headers(options.headers || {})
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json')
  const response = await fetch(`${API_URL}${path}`, { ...options, headers })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error || `Request failed (${response.status})`)
  }
  return response.status === 204 ? null : response.json()
}

const qs = (filters = {}) => {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value))
  })
  return params.size ? `?${params}` : ''
}

export const db = {
  getArtists: () => apiFetch('/artists'),
  getArtist: (id) => apiFetch(`/artists/${id}`),
  getArtistById: (id) => apiFetch(`/artists/${id}`),
  getCollections: () => apiFetch('/collections'),
  getCollection: (id) => apiFetch(`/collections/${id}`),
  getArtworks: (filters = {}) => apiFetch(`/artworks${qs(filters)}`),
  getArtwork: (id) => apiFetch(`/artworks/${id}`),
  getArtworksByArtist: (id) => apiFetch(`/artworks?artist_id=${encodeURIComponent(id)}`),
  getArtworksByCollection: (id) => apiFetch(`/artworks?collection_id=${encodeURIComponent(id)}`),
  getFeaturedContent: () => apiFetch('/featured-content'),
  updateFeaturedContent: (data) => apiFetch('/featured-content', { method: 'PUT', body: JSON.stringify(data) }),
  createArtwork: (data) => apiFetch('/artworks', { method: 'POST', body: JSON.stringify(data) }),
  updateArtwork: (id, data) => apiFetch(`/artworks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteArtwork: (id) => apiFetch(`/artworks/${id}`, { method: 'DELETE' }),
  createArtist: (data) => apiFetch('/artists', { method: 'POST', body: JSON.stringify(data) }),
  updateArtist: (id, data) => apiFetch(`/artists/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteArtist: (id) => apiFetch(`/artists/${id}`, { method: 'DELETE' }),
  createCollection: (data) => apiFetch('/collections', { method: 'POST', body: JSON.stringify(data) }),
  updateCollection: (id, data) => apiFetch(`/collections/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteCollection: (id) => apiFetch(`/collections/${id}`, { method: 'DELETE' }),
  createInquiry: (data) => apiFetch('/inquiries', { method: 'POST', body: JSON.stringify(data) }),
  listInquiries: () => apiFetch('/inquiries'),
  updateInquiry: (id, data) => apiFetch(`/inquiries/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteInquiry: (id) => apiFetch(`/inquiries/${id}`, { method: 'DELETE' }),
  getUserFavorites: () => apiFetch('/favorites'),
  addFavorite: (_userId, artworkId) => apiFetch(`/favorites/${artworkId}`, { method: 'POST' }),
  removeFavorite: (_userId, artworkId) => apiFetch(`/favorites/${artworkId}`, { method: 'DELETE' }),
}

async function upload(file) {
  const form = new FormData()
  form.append('file', file)
  return apiFetch('/uploads', { method: 'POST', body: form })
}

export const storage = {
  uploadFile: (_bucket, file) => upload(file),
  getFileUrl: (_bucket, path) => path,
  getSignedUrl: async (_bucket, path) => path,
  deleteFile: async () => null,
  uploadArtworkImage: (file) => upload(file),
  uploadArtworkAudio: (file) => upload(file),
  uploadCollectionAudio: (file) => upload(file),
  uploadBannerImage: (file) => upload(file),
  deleteArtworkImage: async () => null,
  deleteArtworkAudio: async () => null,
}

export const auth = {}
export const supabase = null
export const getArtworkById = db.getArtwork
export const getArtistById = db.getArtistById
export const getCollectionById = db.getCollection
export const getArtworksByCollection = db.getArtworksByCollection
export const getArtworksByArtist = db.getArtworksByArtist

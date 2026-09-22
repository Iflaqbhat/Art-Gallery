import { apiFetch } from './supabase'

export const publicDb = {
  getCollections: () => apiFetch('/collections'),
  getArtworks: (filters = {}) => {
    const params = new URLSearchParams(filters)
    return apiFetch(`/artworks${params.size ? `?${params}` : ''}`)
  },
  getArtwork: (id) => apiFetch(`/artworks/${id}`),
  getArtists: () => apiFetch('/artists'),
  getFeaturedContent: () => apiFetch('/featured-content'),
  getArtworksByCollection: (id) => apiFetch(`/artworks?collection_id=${encodeURIComponent(id)}`),
  getArtworksByArtist: (id) => apiFetch(`/artworks?artist_id=${encodeURIComponent(id)}`),
}

export const publicStorage = {
  getSignedUrl: async (_bucket, path) => path,
  getPublicUrl: (_bucket, path) => path,
}

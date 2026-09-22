import { Router } from 'express'
import { z } from 'zod'
import { query, transaction } from './db.js'
import { requireAdmin, requireUser, syncUser } from './auth.js'

export const api = Router()

const ids = z.string().uuid()
const resources = {
  artists: ['name', 'bio', 'birth_year', 'death_year', 'nationality', 'style', 'website_url', 'image_url', 'is_featured'],
  collections: ['title', 'description', 'banner_image_url', 'audio_url', 'bundle_price', 'is_featured', 'display_order'],
  artworks: ['title', 'description', 'year_created', 'medium', 'dimensions', 'price', 'image_url', 'audio_url', 'artist_id', 'collection_id', 'is_featured', 'is_available'],
}

function allowedBody(body, fields) {
  return Object.fromEntries(Object.entries(body).filter(([key]) => fields.includes(key)))
}

async function insertRow(table, payload, execute = query) {
  const keys = Object.keys(payload)
  if (!keys.length) throw Object.assign(new Error('No valid fields supplied'), { status: 400 })
  const values = keys.map((key) => payload[key])
  const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ')
  return (await execute(`INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`, values)).rows[0]
}

async function updateRow(table, id, payload, execute = query) {
  const keys = Object.keys(payload)
  if (!keys.length) throw Object.assign(new Error('No valid fields supplied'), { status: 400 })
  const values = keys.map((key) => payload[key])
  const assignments = keys.map((key, index) => `${key} = $${index + 1}`).join(', ')
  const result = await execute(`UPDATE ${table} SET ${assignments} WHERE id = $${keys.length + 1} RETURNING *`, [...values, id])
  if (!result.rows[0]) throw Object.assign(new Error('Resource not found'), { status: 404 })
  return result.rows[0]
}

api.get('/health', async (_req, res) => {
  await query('SELECT 1')
  res.json({ ok: true })
})

api.get('/artists', async (_req, res) => {
  res.json((await query('SELECT * FROM artists ORDER BY name')).rows)
})

api.get('/artists/:id', async (req, res) => {
  const id = ids.parse(req.params.id)
  const artist = (await query('SELECT * FROM artists WHERE id = $1', [id])).rows[0]
  if (!artist) return res.status(404).json({ error: 'Artist not found' })
  artist.artworks = (await query('SELECT id, title, image_url, year_created FROM artworks WHERE artist_id = $1 ORDER BY created_at DESC', [id])).rows
  res.json(artist)
})

api.get('/collections', async (_req, res) => {
  res.json((await query('SELECT * FROM collections ORDER BY display_order, created_at DESC')).rows)
})

api.get('/collections/:id', async (req, res) => {
  const result = await query('SELECT * FROM collections WHERE id = $1', [ids.parse(req.params.id)])
  if (!result.rows[0]) return res.status(404).json({ error: 'Collection not found' })
  res.json(result.rows[0])
})

api.get('/artworks', async (req, res) => {
  const conditions = []
  const values = []
  for (const [key, column] of [['artist_id', 'a.artist_id'], ['collection_id', 'a.collection_id']]) {
    if (req.query[key]) { values.push(ids.parse(req.query[key])); conditions.push(`${column} = $${values.length}`) }
  }
  if (req.query.search) {
    values.push(`%${String(req.query.search).slice(0, 100)}%`)
    conditions.push(`(a.title ILIKE $${values.length} OR a.description ILIKE $${values.length})`)
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const sql = `SELECT a.*, row_to_json(ar) AS artists, row_to_json(c) AS collections
    FROM artworks a LEFT JOIN artists ar ON ar.id = a.artist_id
    LEFT JOIN collections c ON c.id = a.collection_id ${where} ORDER BY a.created_at DESC`
  res.json((await query(sql, values)).rows)
})

api.get('/artworks/:id', async (req, res) => {
  const result = await query(`SELECT a.*, row_to_json(ar) AS artists, row_to_json(c) AS collections
    FROM artworks a LEFT JOIN artists ar ON ar.id = a.artist_id
    LEFT JOIN collections c ON c.id = a.collection_id WHERE a.id = $1`, [ids.parse(req.params.id)])
  if (!result.rows[0]) return res.status(404).json({ error: 'Artwork not found' })
  res.json(result.rows[0])
})

api.get('/featured-content', async (_req, res) => {
  res.json((await query('SELECT * FROM featured_content WHERE is_active = true ORDER BY display_order LIMIT 1')).rows[0] || null)
})

api.post('/inquiries', async (req, res) => {
  const input = z.object({
    kind: z.enum(['artwork', 'collection']), artwork_id: z.string().uuid().nullish(),
    collection_id: z.string().uuid().nullish(), buyer_name: z.string().min(1).max(120),
    buyer_email: z.string().email().max(255), buyer_phone: z.string().max(50).nullish(),
    message: z.string().max(5000).nullish(), option_label: z.string().max(200).nullish(),
    quoted_price: z.coerce.number().nonnegative().nullish(),
  }).parse(req.body)
  res.status(201).json(await insertRow('inquiries', input))
})

api.use(requireUser, syncUser)

api.get('/me', async (req, res) => {
  res.json((await query('SELECT * FROM users WHERE clerk_user_id = $1', [req.userId])).rows[0])
})

api.get('/favorites', async (req, res) => {
  const result = await query(`SELECT a.* FROM user_favorites f JOIN users u ON u.id = f.user_id
    JOIN artworks a ON a.id = f.artwork_id WHERE u.clerk_user_id = $1 ORDER BY f.created_at DESC`, [req.userId])
  res.json(result.rows)
})

api.post('/favorites/:artworkId', async (req, res) => {
  await query(`INSERT INTO user_favorites (user_id, artwork_id)
    SELECT id, $2 FROM users WHERE clerk_user_id = $1 ON CONFLICT DO NOTHING`, [req.userId, ids.parse(req.params.artworkId)])
  res.status(204).end()
})

api.delete('/favorites/:artworkId', async (req, res) => {
  await query(`DELETE FROM user_favorites f USING users u WHERE f.user_id = u.id
    AND u.clerk_user_id = $1 AND f.artwork_id = $2`, [req.userId, ids.parse(req.params.artworkId)])
  res.status(204).end()
})

api.use(requireAdmin)

for (const [resource, fields] of Object.entries(resources)) {
  api.post(`/${resource}`, async (req, res) => res.status(201).json(await insertRow(resource, allowedBody(req.body, fields))))
  api.patch(`/${resource}/:id`, async (req, res) => res.json(await updateRow(resource, ids.parse(req.params.id), allowedBody(req.body, fields))))
  api.delete(`/${resource}/:id`, async (req, res) => {
    const result = await query(`DELETE FROM ${resource} WHERE id = $1 RETURNING id`, [ids.parse(req.params.id)])
    if (!result.rowCount) return res.status(404).json({ error: 'Resource not found' })
    res.status(204).end()
  })
}

api.put('/featured-content', async (req, res) => {
  const fields = ['title', 'subtitle', 'description', 'image_url', 'cta_text', 'cta_link', 'is_active', 'display_order']
  const payload = allowedBody(req.body, fields)
  const row = await transaction(async (client) => {
    const execute = (text, params) => client.query(text, params)
    const current = await client.query('SELECT id FROM featured_content WHERE is_active = true ORDER BY display_order LIMIT 1 FOR UPDATE')
    if (current.rows[0]) return updateRow('featured_content', current.rows[0].id, payload, execute)
    return insertRow('featured_content', payload, execute)
  })
  res.json(row)
})

api.get('/inquiries', async (_req, res) => res.json((await query('SELECT * FROM inquiries ORDER BY created_at DESC')).rows))
api.patch('/inquiries/:id', async (req, res) => res.json(await updateRow('inquiries', ids.parse(req.params.id), allowedBody(req.body, ['status', 'curator_notes']))))
api.delete('/inquiries/:id', async (req, res) => { await query('DELETE FROM inquiries WHERE id = $1', [ids.parse(req.params.id)]); res.status(204).end() })

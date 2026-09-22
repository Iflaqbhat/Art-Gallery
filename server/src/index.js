import { mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import multer from 'multer'
import { clerkMiddleware } from '@clerk/express'
import { api } from './routes.js'
import { requireAdmin, requireUser, syncUser } from './auth.js'

const app = express()
const port = Number(process.env.PORT || 4000)
const uploadDir = resolve(process.env.UPLOAD_DIR || 'uploads')
const frontendDir = fileURLToPath(new URL('../../frontend/dist', import.meta.url))
await mkdir(uploadDir, { recursive: true })

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.set('trust proxy', 1)
app.use(cors({ origin: (process.env.FRONTEND_URL || 'http://localhost:8080').split(','), credentials: true }))
app.use(express.json({ limit: '2mb' }))
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))
app.use(clerkMiddleware())
app.use('/uploads', express.static(uploadDir))

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (_req, file, cb) => cb(null, `${crypto.randomUUID()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '-')}`),
  }),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = new Set([
      'image/avif', 'image/gif', 'image/jpeg', 'image/png', 'image/webp',
      'audio/aac', 'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/webm',
    ])
    cb(null, allowedTypes.has(file.mimetype))
  },
})

app.post('/api/uploads', requireUser, syncUser, requireAdmin, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'A valid image or audio file is required' })
  const base = process.env.PUBLIC_API_URL || `${req.protocol}://${req.get('host')}`
  res.status(201).json({ path: req.file.filename, url: `${base}/uploads/${req.file.filename}` })
})

app.use('/api', api)
if (existsSync(frontendDir)) {
  app.use(express.static(frontendDir))
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) return next()
    res.sendFile('index.html', { root: frontendDir })
  })
}
app.use((error, _req, res, _next) => {
  console.error(error)
  if (error?.name === 'ZodError') return res.status(400).json({ error: 'Invalid request', details: error.issues })
  if (error instanceof multer.MulterError) return res.status(400).json({ error: error.message })
  res.status(error.status || 500).json({ error: error.status ? error.message : 'Internal server error' })
})

app.listen(port, () => console.log(`Canvaso API listening on http://localhost:${port}`))

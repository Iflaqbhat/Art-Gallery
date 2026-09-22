import { clerkClient, getAuth } from '@clerk/express'
import { query } from './db.js'

const bootstrapAdmins = new Set(
  (process.env.ADMIN_USER_IDS || '').split(',').map((id) => id.trim()).filter(Boolean),
)
const bootstrapAdminEmails = new Set(
  (process.env.ADMIN_EMAILS || '').split(',').map((email) => email.trim().toLowerCase()).filter(Boolean),
)

export function requireUser(req, res, next) {
  const auth = getAuth(req)
  if (!auth.isAuthenticated || !auth.userId) {
    return res.status(401).json({ error: 'Authentication required' })
  }
  req.userId = auth.userId
  next()
}

export async function syncUser(req, _res, next) {
  if (!req.userId) return next()
  try {
    const localUser = await query('SELECT id, email FROM users WHERE clerk_user_id = $1', [req.userId])
    const localEmail = localUser.rows[0]?.email?.toLowerCase()
    const isBootstrapAdmin = bootstrapAdmins.has(req.userId) || bootstrapAdminEmails.has(localEmail)
    if (localUser.rows[0] && !isBootstrapAdmin) return next()

    const clerkUser = await clerkClient.users.getUser(req.userId)
    const email = clerkUser.primaryEmailAddress?.emailAddress || null
    const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || email?.split('@')[0] || 'User'
    const role = bootstrapAdmins.has(req.userId) || bootstrapAdminEmails.has(email?.toLowerCase()) ? 'admin' : 'user'
    await query(
      `INSERT INTO users (clerk_user_id, email, name, avatar_url, role)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (clerk_user_id) DO UPDATE SET
         email = EXCLUDED.email, name = EXCLUDED.name,
         avatar_url = EXCLUDED.avatar_url,
         role = CASE WHEN users.role IN ('admin', 'ceo') THEN users.role ELSE EXCLUDED.role END,
         updated_at = now()`,
      [req.userId, email, name, clerkUser.imageUrl, role],
    )
    next()
  } catch (error) {
    next(error)
  }
}

export async function requireAdmin(req, res, next) {
  try {
    const result = await query('SELECT role FROM users WHERE clerk_user_id = $1', [req.userId])
    if (!result.rows[0] || !['admin', 'ceo'].includes(result.rows[0].role)) {
      return res.status(403).json({ error: 'Administrator access required' })
    }
    req.role = result.rows[0].role
    next()
  } catch (error) {
    next(error)
  }
}

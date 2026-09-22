import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { pool } from './db.js'

const here = dirname(fileURLToPath(import.meta.url))
const sql = await readFile(resolve(here, '../migrations/001_initial.sql'), 'utf8')

try {
  await pool.query(sql)
  console.log('Database migration complete')
} finally {
  await pool.end()
}

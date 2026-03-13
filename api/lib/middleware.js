/**
 * LOPE — Shared middleware helpers
 * Used by every serverless function in api/
 */

const jwt = require('jsonwebtoken')

/** Add CORS headers to every response */
function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

/** Handle preflight — returns true if request was OPTIONS (caller should return) */
function handleOptions(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return true
  }
  return false
}

/** Verify JWT token — returns decoded payload or null (sends 401 itself) */
function requireAuth(req, res) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized — please log in' })
    return null
  }
  try {
    return jwt.verify(header.slice(7), process.env.JWT_SECRET || 'lope-secret')
  } catch {
    res.status(401).json({ error: 'Session expired — please log in again' })
    return null
  }
}

module.exports = { setCors, handleOptions, requireAuth }

/**
 * POST /api/setup
 * Creates database tables and seeds demo data.
 * Run this ONCE after first deploy on Vercel.
 * Safe to call multiple times — won't duplicate data.
 */
const { setupAndSeed } = require('./lib/db')
const { setCors }      = require('./lib/middleware')

module.exports = async function handler(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST')    return res.status(405).json({ error: 'POST only' })
  try {
    const result = await setupAndSeed()
    if (result.alreadySeeded) {
      return res.json({ message: 'Database already set up. Nothing changed.' })
    }
    res.json({
      message: '✅ Database tables created and demo data seeded!',
      login:   'demo@lope.com / password123',
    })
  } catch (e) {
    console.error('[setup]', e)
    res.status(500).json({ error: e.message })
  }
}

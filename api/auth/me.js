/** GET /api/auth/me */
const { brands }                             = require('../lib/db')
const { setCors, handleOptions, requireAuth } = require('../lib/middleware')
const safe = b => ({ id: b.id, name: b.name, email: b.email, createdAt: b.created_at })
module.exports = async function handler(req, res) {
  if (handleOptions(req, res)) return; setCors(res)
  if (req.method !== 'GET') return res.status(405).end()
  const user = requireAuth(req, res); if (!user) return
  try {
    const brand = await brands.byId(user.id)
    if (!brand) return res.status(404).json({ error: 'Not found' })
    res.json({ brand: safe(brand) })
  } catch (e) { res.status(500).json({ error: 'Failed' }) }
}

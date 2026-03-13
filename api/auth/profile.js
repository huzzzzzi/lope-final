/** PATCH /api/auth/profile */
const { brands }                             = require('../lib/db')
const { setCors, handleOptions, requireAuth } = require('../lib/middleware')
const safe = b => ({ id: b.id, name: b.name, email: b.email, createdAt: b.created_at })
module.exports = async function handler(req, res) {
  if (handleOptions(req, res)) return; setCors(res)
  if (req.method !== 'PATCH') return res.status(405).end()
  const user = requireAuth(req, res); if (!user) return
  try {
    const { name, email } = req.body
    if (!name?.trim() || name.trim().length < 2) return res.status(400).json({ error: 'Name too short' })
    if (!email || !/\S+@\S+\.\S+/.test(email))   return res.status(400).json({ error: 'Valid email required' })
    const ex = await brands.byEmail(email)
    if (ex && ex.id !== user.id) return res.status(409).json({ error: 'Email already in use' })
    const updated = await brands.update(user.id, { name: name.trim(), email })
    res.json({ brand: safe(updated) })
  } catch (e) { res.status(500).json({ error: 'Update failed' }) }
}

/** PATCH /api/auth/password */
const bcrypt = require('bcryptjs')
const { brands }                             = require('../lib/db')
const { setCors, handleOptions, requireAuth } = require('../lib/middleware')
module.exports = async function handler(req, res) {
  if (handleOptions(req, res)) return; setCors(res)
  if (req.method !== 'PATCH') return res.status(405).end()
  const user = requireAuth(req, res); if (!user) return
  try {
    const { currentPassword, newPassword } = req.body
    if (!currentPassword)                       return res.status(400).json({ error: 'Current password required' })
    if (!newPassword || newPassword.length < 8) return res.status(400).json({ error: 'New password must be 8+ characters' })
    const brand = await brands.byId(user.id)
    if (!(await bcrypt.compare(currentPassword, brand.password_hash)))
      return res.status(401).json({ error: 'Current password incorrect' })
    await brands.update(user.id, { passwordHash: await bcrypt.hash(newPassword, 10) })
    res.json({ message: 'Password updated successfully' })
  } catch (e) { res.status(500).json({ error: 'Update failed' }) }
}

/** POST /api/auth/register */
const bcrypt = require('bcryptjs')
const jwt    = require('jsonwebtoken')
const { brands }                  = require('../lib/db')
const { setCors, handleOptions }  = require('../lib/middleware')

const sign = payload => jwt.sign(payload, process.env.JWT_SECRET || 'lope-secret', { expiresIn: '7d' })
const safe = b => ({ id: b.id, name: b.name, email: b.email, createdAt: b.created_at })

module.exports = async function handler(req, res) {
  if (handleOptions(req, res)) return
  setCors(res)
  if (req.method !== 'POST') return res.status(405).end()
  try {
    const { name, email, password } = req.body
    const errs = []
    if (!name?.trim() || name.trim().length < 2) errs.push('Brand name must be 2+ characters')
    if (!email || !/\S+@\S+\.\S+/.test(email))   errs.push('Valid email required')
    if (!password || password.length < 8)          errs.push('Password must be 8+ characters')
    if (errs.length) return res.status(400).json({ error: errs.join('. ') })
    if (await brands.byEmail(email)) return res.status(409).json({ error: 'Email already registered' })
    const passwordHash = await bcrypt.hash(password, 10)
    const brand = await brands.create({ name: name.trim(), email, passwordHash })
    res.status(201).json({
      token: sign({ id: brand.id, email: brand.email, name: brand.name }),
      brand: safe(brand),
    })
  } catch (e) {
    console.error('[register]', e)
    res.status(500).json({ error: 'Registration failed' })
  }
}

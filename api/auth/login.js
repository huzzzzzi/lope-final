/** POST /api/auth/login */
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
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' })
    const brand = await brands.byEmail(email)
    if (!brand || !(await bcrypt.compare(password, brand.password_hash)))
      return res.status(401).json({ error: 'Invalid email or password' })
    res.json({
      token: sign({ id: brand.id, email: brand.email, name: brand.name }),
      brand: safe(brand),
    })
  } catch (e) {
    console.error('[login]', e)
    res.status(500).json({ error: 'Login failed' })
  }
}

/** GET /api/stats — dashboard metrics for authenticated brand */
const { stats }                              = require('../lib/db')
const { setCors, handleOptions, requireAuth } = require('../lib/middleware')

module.exports = async function handler(req, res) {
  if (handleOptions(req, res)) return
  setCors(res)
  if (req.method !== 'GET') return res.status(405).end()
  const user = requireAuth(req, res); if (!user) return
  try {
    res.json(await stats.get(user.id))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}

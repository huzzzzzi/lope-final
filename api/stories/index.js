/** GET /api/stories — list all stories for authenticated brand */
const { stories }                            = require('../lib/db')
const { setCors, handleOptions, requireAuth } = require('../lib/middleware')

module.exports = async function handler(req, res) {
  if (handleOptions(req, res)) return
  setCors(res)
  if (req.method !== 'GET') return res.status(405).end()
  const user = requireAuth(req, res); if (!user) return
  try {
    const { status, limit } = req.query
    res.json(await stories.all(user.id, { status, limit }))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}

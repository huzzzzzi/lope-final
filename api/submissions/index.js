/** GET /api/submissions — list all submissions for authenticated brand */
const { submissions }                        = require('../lib/db')
const { setCors, handleOptions, requireAuth } = require('../lib/middleware')

module.exports = async function handler(req, res) {
  if (handleOptions(req, res)) return
  setCors(res)
  if (req.method !== 'GET') return res.status(405).end()
  const user = requireAuth(req, res); if (!user) return
  try {
    const { status, campaignId } = req.query
    res.json(await submissions.all(user.id, {
      status,
      campaignId: campaignId ? parseInt(campaignId) : undefined,
    }))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}

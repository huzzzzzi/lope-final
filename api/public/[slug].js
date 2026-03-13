/** GET /api/public/:slug — fetch live campaign by slug (no auth required) */
const { campaigns }              = require('../lib/db')
const { setCors, handleOptions } = require('../lib/middleware')

module.exports = async function handler(req, res) {
  if (handleOptions(req, res)) return
  setCors(res)
  if (req.method !== 'GET') return res.status(405).end()
  try {
    const camp = await campaigns.bySlug(req.query.slug)
    if (!camp)                   return res.status(404).json({ error: 'Campaign not found' })
    if (camp.status === 'ended') return res.status(410).json({ error: 'This campaign has ended' })
    if (camp.status === 'draft') return res.status(403).json({ error: 'Campaign is not live yet' })
    const { brandId: _, ...safe } = camp
    res.json({ campaign: safe })
  } catch (e) {
    console.error('[public]', e)
    res.status(500).json({ error: e.message })
  }
}

/** GET /api/campaigns  —  POST /api/campaigns */
const { campaigns }                          = require('../lib/db')
const { setCors, handleOptions, requireAuth } = require('../lib/middleware')

module.exports = async function handler(req, res) {
  if (handleOptions(req, res)) return
  setCors(res)
  const user = requireAuth(req, res); if (!user) return

  // ── GET — list all campaigns for this brand ───────────────────────────────
  if (req.method === 'GET') {
    try {
      res.json(await campaigns.all(user.id, req.query.status))
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
    return
  }

  // ── POST — create a new campaign ──────────────────────────────────────────
  if (req.method === 'POST') {
    try {
      const { name, description, startDate, endDate, moderationType, customFields, coverColor } = req.body
      if (!name?.trim())          return res.status(400).json({ error: 'Campaign name required' })
      if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end date required' })
      if (new Date(startDate) >= new Date(endDate))
        return res.status(400).json({ error: 'End date must be after start date' })

      // Auto-generate unique slug from name
      const base = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      let slug = base, n = 0
      while (await campaigns.slugTaken(slug)) slug = base + '-' + (++n)

      res.status(201).json(await campaigns.create({
        brandId: user.id, name: name.trim(), description: description?.trim() || null,
        slug, status: 'draft', startDate, endDate,
        moderationType: moderationType || 'manual',
        customFields: customFields || [],
        coverColor: coverColor || '#1c4a3b',
      }))
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
    return
  }

  res.status(405).end()
}

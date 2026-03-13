/**
 * POST /api/public/:slug/submit
 * Public UGC submission endpoint — no auth required.
 * Files are already uploaded to Cloudinary from the browser.
 * This endpoint just receives: { name, contact, message, customAnswers, mediaUrl, mediaType }
 */
const { campaigns, submissions, stories } = require('../../lib/db')
const { setCors, handleOptions }          = require('../../lib/middleware')

module.exports = async function handler(req, res) {
  if (handleOptions(req, res)) return
  setCors(res)
  if (req.method !== 'POST') return res.status(405).end()
  try {
    const camp = await campaigns.bySlug(req.query.slug)
    if (!camp)                   return res.status(404).json({ error: 'Campaign not found' })
    if (camp.status === 'ended') return res.status(410).json({ error: 'This campaign has ended' })
    if (camp.status === 'draft') return res.status(403).json({ error: 'Campaign is not live yet' })

    const { name, contact, message, customAnswers, mediaUrl, mediaType } = req.body
    if (!name?.trim())    return res.status(400).json({ error: 'Name is required' })
    if (!contact?.trim()) return res.status(400).json({ error: 'Email or phone is required' })
    if (!mediaUrl)        return res.status(400).json({ error: 'Media upload is required' })

    const status = camp.moderationType === 'auto' ? 'approved' : 'pending'
    const sub = await submissions.create({
      campaignId:    camp.id,
      name:          name.trim(),
      contact:       contact.trim(),
      message:       message?.trim() || null,
      customAnswers: customAnswers || {},
      mediaUrl,
      mediaType:     mediaType || 'image',
      status,
    })

    if (status === 'approved') {
      await stories.create({ submissionId: sub.id, campaignName: camp.name, generatedMediaUrl: null, status: 'processing' })
    }

    res.status(201).json({ submission: { id: sub.id, status: sub.status } })
  } catch (e) {
    console.error('[submit]', e)
    res.status(500).json({ error: 'Submission failed. Please try again.' })
  }
}

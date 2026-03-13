/**
 * LOPE — Express Server for Railway
 * Replaces all Vercel serverless functions with one standard Express app.
 */

const express = require('express')
const cors    = require('cors')
const bcrypt  = require('bcryptjs')
const jwt     = require('jsonwebtoken')

const { brands, campaigns, submissions, stories, stats, setupAndSeed } = require('./api/lib/db')

const app  = express()
const PORT = process.env.PORT || 4000

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: '*', credentials: true }))
app.use(express.json())

// ── Auth helper ──────────────────────────────────────────────────────────────
const sign = p => jwt.sign(p, process.env.JWT_SECRET || 'lope-secret', { expiresIn: '7d' })
const safe = b => ({ id: b.id, name: b.name, email: b.email, createdAt: b.created_at })

function requireAuth(req, res) {
  const h = req.headers.authorization
  if (!h?.startsWith('Bearer ')) { res.status(401).json({ error: 'Unauthorized' }); return null }
  try { return jwt.verify(h.slice(7), process.env.JWT_SECRET || 'lope-secret') }
  catch { res.status(401).json({ error: 'Session expired' }); return null }
}

// ════════════════════════════════════════════════════════════════════════════
//  SETUP — seed database once
// ════════════════════════════════════════════════════════════════════════════
app.post('/api/setup', async (req, res) => {
  try {
    const result = await setupAndSeed()
    if (result.alreadySeeded) return res.json({ message: 'Already seeded.' })
    res.json({ message: '✅ Database seeded!', login: 'demo@lope.com / password123' })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ════════════════════════════════════════════════════════════════════════════
//  AUTH
// ════════════════════════════════════════════════════════════════════════════
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' })
    const brand = await brands.byEmail(email)
    if (!brand || !(await bcrypt.compare(password, brand.password_hash)))
      return res.status(401).json({ error: 'Invalid email or password' })
    res.json({ token: sign({ id: brand.id, email: brand.email, name: brand.name }), brand: safe(brand) })
  } catch (e) { res.status(500).json({ error: 'Login failed' }) }
})

app.post('/api/auth/register', async (req, res) => {
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
    res.status(201).json({ token: sign({ id: brand.id, email: brand.email, name: brand.name }), brand: safe(brand) })
  } catch (e) { res.status(500).json({ error: 'Registration failed' }) }
})

app.get('/api/auth/me', async (req, res) => {
  const user = requireAuth(req, res); if (!user) return
  try {
    const brand = await brands.byId(user.id)
    if (!brand) return res.status(404).json({ error: 'Not found' })
    res.json({ brand: safe(brand) })
  } catch (e) { res.status(500).json({ error: 'Failed' }) }
})

app.patch('/api/auth/profile', async (req, res) => {
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
})

app.patch('/api/auth/password', async (req, res) => {
  const user = requireAuth(req, res); if (!user) return
  try {
    const { currentPassword, newPassword } = req.body
    if (!currentPassword)                       return res.status(400).json({ error: 'Current password required' })
    if (!newPassword || newPassword.length < 8) return res.status(400).json({ error: 'New password must be 8+ characters' })
    const brand = await brands.byId(user.id)
    if (!(await bcrypt.compare(currentPassword, brand.password_hash)))
      return res.status(401).json({ error: 'Current password incorrect' })
    await brands.update(user.id, { passwordHash: await bcrypt.hash(newPassword, 10) })
    res.json({ message: 'Password updated' })
  } catch (e) { res.status(500).json({ error: 'Update failed' }) }
})

// ════════════════════════════════════════════════════════════════════════════
//  CAMPAIGNS
// ════════════════════════════════════════════════════════════════════════════
app.get('/api/campaigns', async (req, res) => {
  const user = requireAuth(req, res); if (!user) return
  try { res.json(await campaigns.all(user.id, req.query.status)) }
  catch (e) { res.status(500).json({ error: e.message }) }
})

app.post('/api/campaigns', async (req, res) => {
  const user = requireAuth(req, res); if (!user) return
  try {
    const { name, description, startDate, endDate, moderationType, customFields, coverColor } = req.body
    if (!name?.trim())          return res.status(400).json({ error: 'Campaign name required' })
    if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end date required' })
    if (new Date(startDate) >= new Date(endDate)) return res.status(400).json({ error: 'End date must be after start date' })
    const base = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    let slug = base, n = 0
    while (await campaigns.slugTaken(slug)) slug = base + '-' + (++n)
    res.status(201).json(await campaigns.create({ brandId: user.id, name: name.trim(), description: description?.trim() || null, slug, status: 'draft', startDate, endDate, moderationType: moderationType || 'manual', customFields: customFields || [], coverColor: coverColor || '#1c4a3b' }))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.patch('/api/campaigns/:id', async (req, res) => {
  const user = requireAuth(req, res); if (!user) return
  try {
    const camp = await campaigns.byId(parseInt(req.params.id))
    if (!camp || camp.brandId !== user.id) return res.status(404).json({ error: 'Campaign not found' })
    const { name, description, status, startDate, endDate, moderationType, customFields, coverColor } = req.body
    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) return res.status(400).json({ error: 'End date must be after start date' })
    res.json(await campaigns.update(parseInt(req.params.id), { name, description, status, startDate, endDate, moderationType, customFields, coverColor }))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.delete('/api/campaigns/:id', async (req, res) => {
  const user = requireAuth(req, res); if (!user) return
  try {
    const camp = await campaigns.byId(parseInt(req.params.id))
    if (!camp || camp.brandId !== user.id) return res.status(404).json({ error: 'Campaign not found' })
    const count = await campaigns.submissionCount(parseInt(req.params.id))
    if (count > 0) return res.status(409).json({ error: `Cannot delete — campaign has ${count} submissions` })
    await campaigns.delete(parseInt(req.params.id))
    res.json({ message: 'Campaign deleted' })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── Public campaign routes (no auth) ─────────────────────────────────────────
app.get('/api/public/:slug', async (req, res) => {
  try {
    const camp = await campaigns.bySlug(req.params.slug)
    if (!camp)                   return res.status(404).json({ error: 'Campaign not found' })
    if (camp.status === 'ended') return res.status(410).json({ error: 'This campaign has ended' })
    if (camp.status === 'draft') return res.status(403).json({ error: 'Campaign is not live yet' })
    const { brandId: _, ...safe } = camp
    res.json({ campaign: safe })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.post('/api/public/:slug/submit', async (req, res) => {
  try {
    const camp = await campaigns.bySlug(req.params.slug)
    if (!camp)                   return res.status(404).json({ error: 'Campaign not found' })
    if (camp.status === 'ended') return res.status(410).json({ error: 'Campaign has ended' })
    if (camp.status === 'draft') return res.status(403).json({ error: 'Campaign not live' })
    const { name, contact, message, customAnswers, mediaUrl, mediaType } = req.body
    if (!name?.trim())    return res.status(400).json({ error: 'Name required' })
    if (!contact?.trim()) return res.status(400).json({ error: 'Contact required' })
    if (!mediaUrl)        return res.status(400).json({ error: 'Media required' })
    const status = camp.moderationType === 'auto' ? 'approved' : 'pending'
    const sub = await submissions.create({ campaignId: camp.id, name: name.trim(), contact: contact.trim(), message: message?.trim() || null, customAnswers: customAnswers || {}, mediaUrl, mediaType: mediaType || 'image', status })
    if (status === 'approved') await stories.create({ submissionId: sub.id, campaignName: camp.name, generatedMediaUrl: null, status: 'processing' })
    res.status(201).json({ submission: { id: sub.id, status: sub.status } })
  } catch (e) { res.status(500).json({ error: 'Submission failed' }) }
})

// ════════════════════════════════════════════════════════════════════════════
//  SUBMISSIONS
// ════════════════════════════════════════════════════════════════════════════
app.get('/api/submissions', async (req, res) => {
  const user = requireAuth(req, res); if (!user) return
  try {
    const { status, campaignId } = req.query
    res.json(await submissions.all(user.id, { status, campaignId: campaignId ? parseInt(campaignId) : undefined }))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.patch('/api/submissions/:id', async (req, res) => {
  const user = requireAuth(req, res); if (!user) return
  try {
    const id = parseInt(req.params.id)
    const { status } = req.body
    if (!['pending', 'approved', 'rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status' })
    const allSubs = await submissions.all(user.id)
    if (!allSubs.find(s => s.id === id)) return res.status(403).json({ error: 'Forbidden' })
    const updated = await submissions.update(id, { status })
    if (status === 'approved' && !(await stories.bySubmissionId(id))) {
      const sub  = await submissions.byId(id)
      const camp = await campaigns.byId(sub.campaignId)
      await stories.create({ submissionId: id, campaignName: camp?.name || null, generatedMediaUrl: null, status: 'processing' })
    }
    res.json(updated)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ════════════════════════════════════════════════════════════════════════════
//  STORIES
// ════════════════════════════════════════════════════════════════════════════
app.get('/api/stories', async (req, res) => {
  const user = requireAuth(req, res); if (!user) return
  try { res.json(await stories.all(user.id, { status: req.query.status, limit: req.query.limit })) }
  catch (e) { res.status(500).json({ error: e.message }) }
})

app.post('/api/stories/:id/generate', async (req, res) => {
  const user = requireAuth(req, res); if (!user) return
  try {
    const story = await stories.byId(parseInt(req.params.id))
    if (!story) return res.status(404).json({ error: 'Story not found' })
    const colors = ['1c4a3b/ffffff', '2d4fa8/ffffff', '7a3b8c/ffffff', 'e8a838/18180f', 'd64e2a/ffffff']
    const url = `https://placehold.co/400x700/${colors[story.id % colors.length]}?text=Story+%23${story.id}`
    res.json(await stories.update(story.id, { status: 'completed', generatedMediaUrl: url }))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ════════════════════════════════════════════════════════════════════════════
//  STATS
// ════════════════════════════════════════════════════════════════════════════
app.get('/api/stats', async (req, res) => {
  const user = requireAuth(req, res); if (!user) return
  try { res.json(await stats.get(user.id)) }
  catch (e) { res.status(500).json({ error: e.message }) }
})

// ════════════════════════════════════════════════════════════════════════════
//  START
// ════════════════════════════════════════════════════════════════════════════
app.listen(PORT, () => console.log(`LOPE backend running on port ${PORT}`))

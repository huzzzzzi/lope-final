/** POST /api/stories/:id/generate — trigger AI story generation */
const { stories }                            = require('../../lib/db')
const { setCors, handleOptions, requireAuth } = require('../../lib/middleware')

module.exports = async function handler(req, res) {
  if (handleOptions(req, res)) return
  setCors(res)
  if (req.method !== 'POST') return res.status(405).end()
  const user = requireAuth(req, res); if (!user) return
  try {
    const story = await stories.byId(parseInt(req.query.id))
    if (!story) return res.status(404).json({ error: 'Story not found' })

    // ── TODO: Replace this block with real AI generation ──────────────────
    // Example with Replicate:
    //   const Replicate = require('replicate')
    //   const replicate  = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })
    //   const output     = await replicate.run("stability-ai/sdxl:...", { input: { prompt: "..." } })
    //   const url        = output[0]
    // ─────────────────────────────────────────────────────────────────────
    const colors = ['1c4a3b/ffffff', '2d4fa8/ffffff', '7a3b8c/ffffff', 'e8a838/18180f', 'd64e2a/ffffff']
    const url    = `https://placehold.co/400x700/${colors[story.id % colors.length]}?text=Story+%23${story.id}`
    const updated = await stories.update(story.id, { status: 'completed', generatedMediaUrl: url })
    res.json(updated)
  } catch (e) {
    console.error('[generate]', e)
    res.status(500).json({ error: e.message })
  }
}

/**
 * ═══════════════════════════════════════════
 *  LOPE — DATABASE LAYER (Neon PostgreSQL)
 * ═══════════════════════════════════════════
 * Uses @neondatabase/serverless — works in
 * Vercel serverless functions (no connection pool needed).
 *
 * Tables are auto-created on first call.
 * Seed demo data via POST /api/setup
 */

const { neon } = require('@neondatabase/serverless')
const bcrypt   = require('bcryptjs')

const sql = neon(process.env.DATABASE_URL)

// ── Auto-create tables on first run ─────────────────────────────────────────
let _ready = false
async function ensureSchema() {
  if (_ready) return
  await sql`
    CREATE TABLE IF NOT EXISTS brands (
      id            SERIAL PRIMARY KEY,
      name          TEXT NOT NULL,
      email         TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at    TIMESTAMPTZ DEFAULT NOW(),
      updated_at    TIMESTAMPTZ DEFAULT NOW()
    )`
  await sql`
    CREATE TABLE IF NOT EXISTS campaigns (
      id              SERIAL PRIMARY KEY,
      brand_id        INTEGER NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
      name            TEXT NOT NULL,
      description     TEXT,
      slug            TEXT NOT NULL UNIQUE,
      status          TEXT NOT NULL DEFAULT 'draft',
      start_date      DATE NOT NULL,
      end_date        DATE NOT NULL,
      moderation_type TEXT NOT NULL DEFAULT 'manual',
      custom_fields   JSONB NOT NULL DEFAULT '[]',
      cover_color     TEXT NOT NULL DEFAULT '#1c4a3b',
      created_at      TIMESTAMPTZ DEFAULT NOW(),
      updated_at      TIMESTAMPTZ DEFAULT NOW()
    )`
  await sql`
    CREATE TABLE IF NOT EXISTS submissions (
      id             SERIAL PRIMARY KEY,
      campaign_id    INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
      name           TEXT NOT NULL,
      contact        TEXT NOT NULL,
      message        TEXT,
      custom_answers JSONB NOT NULL DEFAULT '{}',
      media_url      TEXT NOT NULL,
      media_type     TEXT NOT NULL DEFAULT 'image',
      status         TEXT NOT NULL DEFAULT 'pending',
      created_at     TIMESTAMPTZ DEFAULT NOW(),
      updated_at     TIMESTAMPTZ DEFAULT NOW()
    )`
  await sql`
    CREATE TABLE IF NOT EXISTS stories (
      id                  SERIAL PRIMARY KEY,
      submission_id       INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
      campaign_name       TEXT,
      generated_media_url TEXT,
      status              TEXT NOT NULL DEFAULT 'processing',
      created_at          TIMESTAMPTZ DEFAULT NOW(),
      updated_at          TIMESTAMPTZ DEFAULT NOW()
    )`
  _ready = true
}

// ── One-time seed (called from POST /api/setup) ──────────────────────────────
async function setupAndSeed() {
  await ensureSchema()
  const [row] = await sql`SELECT COUNT(*)::int AS count FROM brands`
  if (row.count > 0) return { alreadySeeded: true }

  const hash = await bcrypt.hash('password123', 10)
  const [brand] = await sql`
    INSERT INTO brands (name, email, password_hash)
    VALUES ('Demo Brand', 'demo@lope.com', ${hash})
    RETURNING id`

  const customFields = JSON.stringify([
    { id: 'pace',     label: 'Your pace?',       type: 'text', required: false, placeholder: '5:30/km'      },
    { id: 'location', label: 'Where did you run?',type: 'text', required: false, placeholder: 'Central Park' },
  ])

  const [c1] = await sql`
    INSERT INTO campaigns (brand_id,name,description,slug,status,start_date,end_date,moderation_type,custom_fields,cover_color)
    VALUES (${brand.id},'Summer Run 2025','Share your best running moments!','summer-run-2025','live','2025-06-01','2025-08-31','manual',${customFields},'#1c4a3b')
    RETURNING id`
  const [c2] = await sql`
    INSERT INTO campaigns (brand_id,name,description,slug,status,start_date,end_date,moderation_type,custom_fields,cover_color)
    VALUES (${brand.id},'Win the Court','Show us your best moves.','win-the-court','live','2025-05-10','2025-07-15','ai','[]','#2d4fa8')
    RETURNING id`
  await sql`
    INSERT INTO campaigns (brand_id,name,description,slug,status,start_date,end_date,moderation_type,custom_fields,cover_color)
    VALUES (${brand.id},'Just Flow — Yoga',null,'just-flow-yoga','ended','2025-04-01','2025-04-30','auto','[]','#7a3b8c')`

  const [s1] = await sql`
    INSERT INTO submissions (campaign_id,name,contact,message,custom_answers,media_url,media_type,status)
    VALUES (${c1.id},'Maria Kowalski','maria@gmail.com','Best run ever!',
            ${JSON.stringify({pace:'4:42/km',location:'Central Park'})},
            'https://placehold.co/600x400/e6f2ee/1c4a3b?text=Summer+Run','image','approved')
    RETURNING id`
  await sql`
    INSERT INTO submissions (campaign_id,name,contact,message,custom_answers,media_url,media_type,status)
    VALUES (${c1.id},'James Rivera','james@email.com',null,'{}',
            'https://placehold.co/600x400/fdf3dc/e8a838?text=Running','image','pending')`
  await sql`
    INSERT INTO submissions (campaign_id,name,contact,message,custom_answers,media_url,media_type,status)
    VALUES (${c2.id},'Anya Bassi','+1 555 0123',null,'{}',
            'https://placehold.co/600x400/fff1f1/d64e2a?text=Court','image','pending')`
  await sql`
    INSERT INTO stories (submission_id,campaign_name,generated_media_url,status)
    VALUES (${s1.id},'Summer Run 2025','https://placehold.co/400x700/1c4a3b/ffffff?text=Story+1','completed')`

  return { seeded: true, login: 'demo@lope.com / password123' }
}

// ── Row parsers ──────────────────────────────────────────────────────────────
function parseCampaign(c) {
  if (!c) return null
  return {
    id: c.id, brandId: c.brand_id, name: c.name, description: c.description,
    slug: c.slug, status: c.status, startDate: c.start_date, endDate: c.end_date,
    moderationType: c.moderation_type,
    customFields: Array.isArray(c.custom_fields) ? c.custom_fields : JSON.parse(c.custom_fields || '[]'),
    coverColor: c.cover_color, createdAt: c.created_at, updatedAt: c.updated_at,
  }
}
function parseSub(s) {
  if (!s) return null
  return {
    id: s.id, campaignId: s.campaign_id, name: s.name, contact: s.contact,
    message: s.message,
    customAnswers: typeof s.custom_answers === 'object' ? s.custom_answers : JSON.parse(s.custom_answers || '{}'),
    mediaUrl: s.media_url, mediaType: s.media_type, status: s.status,
    createdAt: s.created_at, updatedAt: s.updated_at,
  }
}
function parseStory(s) {
  if (!s) return null
  return {
    id: s.id, submissionId: s.submission_id, campaignName: s.campaign_name,
    generatedMediaUrl: s.generated_media_url, status: s.status,
    createdAt: s.created_at, updatedAt: s.updated_at,
  }
}

// ── brands ───────────────────────────────────────────────────────────────────
const brands = {
  async byEmail(email) {
    await ensureSchema()
    const rows = await sql`SELECT * FROM brands WHERE email = ${email.toLowerCase()} LIMIT 1`
    return rows[0] || null
  },
  async byId(id) {
    await ensureSchema()
    const rows = await sql`SELECT * FROM brands WHERE id = ${id} LIMIT 1`
    return rows[0] || null
  },
  async create({ name, email, passwordHash }) {
    await ensureSchema()
    const rows = await sql`
      INSERT INTO brands (name, email, password_hash)
      VALUES (${name}, ${email.toLowerCase()}, ${passwordHash})
      RETURNING *`
    return rows[0]
  },
  async update(id, data) {
    await ensureSchema()
    const cur = await brands.byId(id)
    if (!cur) return null
    const name  = data.name         !== undefined ? data.name                : cur.name
    const email = data.email        !== undefined ? data.email.toLowerCase() : cur.email
    const hash  = data.passwordHash !== undefined ? data.passwordHash        : cur.password_hash
    await sql`UPDATE brands SET name=${name}, email=${email}, password_hash=${hash}, updated_at=NOW() WHERE id=${id}`
    return brands.byId(id)
  },
}

// ── campaigns ────────────────────────────────────────────────────────────────
const campaigns = {
  async all(brandId, status) {
    await ensureSchema()
    const rows = status
      ? await sql`SELECT c.*, (SELECT COUNT(*)::int FROM submissions s WHERE s.campaign_id=c.id) AS sub_count FROM campaigns c WHERE c.brand_id=${brandId} AND c.status=${status} ORDER BY c.created_at DESC`
      : await sql`SELECT c.*, (SELECT COUNT(*)::int FROM submissions s WHERE s.campaign_id=c.id) AS sub_count FROM campaigns c WHERE c.brand_id=${brandId} ORDER BY c.created_at DESC`
    return rows.map(r => ({ ...parseCampaign(r), _count: { submissions: r.sub_count } }))
  },
  async bySlug(slug) {
    await ensureSchema()
    const rows = await sql`SELECT c.*, (SELECT COUNT(*)::int FROM submissions s WHERE s.campaign_id=c.id) AS sub_count FROM campaigns c WHERE c.slug=${slug} LIMIT 1`
    if (!rows[0]) return null
    return { ...parseCampaign(rows[0]), submissionCount: rows[0].sub_count }
  },
  async byId(id) {
    await ensureSchema()
    const rows = await sql`SELECT * FROM campaigns WHERE id=${id} LIMIT 1`
    return parseCampaign(rows[0] || null)
  },
  async slugTaken(slug) {
    await ensureSchema()
    const rows = await sql`SELECT id FROM campaigns WHERE slug=${slug} LIMIT 1`
    return rows.length > 0
  },
  async submissionCount(id) {
    await ensureSchema()
    const rows = await sql`SELECT COUNT(*)::int AS n FROM submissions WHERE campaign_id=${id}`
    return rows[0].n
  },
  async create(data) {
    await ensureSchema()
    const rows = await sql`
      INSERT INTO campaigns (brand_id,name,description,slug,status,start_date,end_date,moderation_type,custom_fields,cover_color)
      VALUES (${data.brandId},${data.name},${data.description||null},${data.slug},${data.status||'draft'},
              ${data.startDate},${data.endDate},${data.moderationType||'manual'},
              ${JSON.stringify(data.customFields||[])},${data.coverColor||'#1c4a3b'})
      RETURNING *`
    return parseCampaign(rows[0])
  },
  async update(id, data) {
    await ensureSchema()
    const c = await campaigns.byId(id)
    if (!c) return null
    const name           = data.name           !== undefined ? data.name                       : c.name
    const description    = data.description    !== undefined ? data.description                : c.description
    const status         = data.status         !== undefined ? data.status                     : c.status
    const startDate      = data.startDate      !== undefined ? data.startDate                  : c.startDate
    const endDate        = data.endDate        !== undefined ? data.endDate                    : c.endDate
    const modType        = data.moderationType !== undefined ? data.moderationType             : c.moderationType
    const customFields   = data.customFields   !== undefined ? JSON.stringify(data.customFields) : JSON.stringify(c.customFields)
    const coverColor     = data.coverColor     !== undefined ? data.coverColor                 : c.coverColor
    await sql`
      UPDATE campaigns
      SET name=${name}, description=${description}, status=${status},
          start_date=${startDate}, end_date=${endDate},
          moderation_type=${modType}, custom_fields=${customFields},
          cover_color=${coverColor}, updated_at=NOW()
      WHERE id=${id}`
    return campaigns.byId(id)
  },
  async delete(id) {
    await ensureSchema()
    await sql`DELETE FROM campaigns WHERE id=${id}`
  },
}

// ── submissions ──────────────────────────────────────────────────────────────
const submissions = {
  async all(brandId, { status, campaignId } = {}) {
    await ensureSchema()
    let rows
    if (status && campaignId) {
      rows = await sql`SELECT s.*,c.name AS campaign_name,c.slug AS campaign_slug FROM submissions s JOIN campaigns c ON c.id=s.campaign_id WHERE c.brand_id=${brandId} AND s.status=${status} AND s.campaign_id=${campaignId} ORDER BY s.created_at DESC`
    } else if (status) {
      rows = await sql`SELECT s.*,c.name AS campaign_name,c.slug AS campaign_slug FROM submissions s JOIN campaigns c ON c.id=s.campaign_id WHERE c.brand_id=${brandId} AND s.status=${status} ORDER BY s.created_at DESC`
    } else if (campaignId) {
      rows = await sql`SELECT s.*,c.name AS campaign_name,c.slug AS campaign_slug FROM submissions s JOIN campaigns c ON c.id=s.campaign_id WHERE c.brand_id=${brandId} AND s.campaign_id=${campaignId} ORDER BY s.created_at DESC`
    } else {
      rows = await sql`SELECT s.*,c.name AS campaign_name,c.slug AS campaign_slug FROM submissions s JOIN campaigns c ON c.id=s.campaign_id WHERE c.brand_id=${brandId} ORDER BY s.created_at DESC`
    }
    return rows.map(r => ({ ...parseSub(r), campaign: { id: r.campaign_id, name: r.campaign_name, slug: r.campaign_slug } }))
  },
  async byId(id) {
    await ensureSchema()
    const rows = await sql`SELECT * FROM submissions WHERE id=${id} LIMIT 1`
    return parseSub(rows[0] || null)
  },
  async countByCampaign(id) {
    await ensureSchema()
    const rows = await sql`SELECT COUNT(*)::int AS n FROM submissions WHERE campaign_id=${id}`
    return rows[0].n
  },
  async create(data) {
    await ensureSchema()
    const rows = await sql`
      INSERT INTO submissions (campaign_id,name,contact,message,custom_answers,media_url,media_type,status)
      VALUES (${data.campaignId},${data.name},${data.contact},${data.message||null},
              ${JSON.stringify(data.customAnswers||{})},${data.mediaUrl},${data.mediaType||'image'},${data.status||'pending'})
      RETURNING *`
    return parseSub(rows[0])
  },
  async update(id, data) {
    await ensureSchema()
    if (data.status !== undefined) {
      await sql`UPDATE submissions SET status=${data.status}, updated_at=NOW() WHERE id=${id}`
    }
    return submissions.byId(id)
  },
}

// ── stories ──────────────────────────────────────────────────────────────────
const stories = {
  async all(brandId, { status, limit } = {}) {
    await ensureSchema()
    const lim = limit ? parseInt(limit) : 100
    let rows
    if (status) {
      rows = await sql`SELECT st.*,s.name AS submitter_name FROM stories st JOIN submissions s ON s.id=st.submission_id JOIN campaigns c ON c.id=s.campaign_id WHERE c.brand_id=${brandId} AND st.status=${status} ORDER BY st.created_at DESC LIMIT ${lim}`
    } else {
      rows = await sql`SELECT st.*,s.name AS submitter_name FROM stories st JOIN submissions s ON s.id=st.submission_id JOIN campaigns c ON c.id=s.campaign_id WHERE c.brand_id=${brandId} ORDER BY st.created_at DESC LIMIT ${lim}`
    }
    return rows.map(r => ({ ...parseStory(r), submissionName: r.submitter_name }))
  },
  async bySubmissionId(id) {
    await ensureSchema()
    const rows = await sql`SELECT * FROM stories WHERE submission_id=${id} LIMIT 1`
    return parseStory(rows[0] || null)
  },
  async byId(id) {
    await ensureSchema()
    const rows = await sql`SELECT * FROM stories WHERE id=${id} LIMIT 1`
    return parseStory(rows[0] || null)
  },
  async create(data) {
    await ensureSchema()
    const rows = await sql`
      INSERT INTO stories (submission_id,campaign_name,generated_media_url,status)
      VALUES (${data.submissionId},${data.campaignName||null},${data.generatedMediaUrl||null},${data.status||'processing'})
      RETURNING *`
    return parseStory(rows[0])
  },
  async update(id, data) {
    await ensureSchema()
    const cur = await stories.byId(id)
    if (!cur) return null
    const status            = data.status            !== undefined ? data.status            : cur.status
    const generatedMediaUrl = data.generatedMediaUrl !== undefined ? data.generatedMediaUrl : cur.generatedMediaUrl
    await sql`UPDATE stories SET status=${status}, generated_media_url=${generatedMediaUrl}, updated_at=NOW() WHERE id=${id}`
    return stories.byId(id)
  },
}

// ── stats ────────────────────────────────────────────────────────────────────
const stats = {
  async get(brandId) {
    await ensureSchema()
    const [bc] = await sql`SELECT COUNT(*)::int AS t, COUNT(*) FILTER (WHERE status='live')::int AS a, COUNT(*) FILTER (WHERE status='ended')::int AS e, COUNT(*) FILTER (WHERE status='draft')::int AS d FROM campaigns WHERE brand_id=${brandId}`
    const [bs] = await sql`SELECT COUNT(*)::int AS t, COUNT(*) FILTER (WHERE s.status='pending')::int AS p, COUNT(*) FILTER (WHERE s.status='approved')::int AS a, COUNT(*) FILTER (WHERE s.status='rejected')::int AS r FROM submissions s JOIN campaigns c ON c.id=s.campaign_id WHERE c.brand_id=${brandId}`
    const [st] = await sql`SELECT COUNT(*)::int AS t, COUNT(*) FILTER (WHERE st.status='completed')::int AS c, COUNT(*) FILTER (WHERE st.status='processing')::int AS p FROM stories st JOIN submissions s ON s.id=st.submission_id JOIN campaigns ca ON ca.id=s.campaign_id WHERE ca.brand_id=${brandId}`
    return {
      campaigns:   { total: bc.t, active: bc.a, ended: bc.e, draft: bc.d },
      submissions: { total: bs.t, pending: bs.p, approved: bs.a, rejected: bs.r },
      stories:     { total: st.t, completed: st.c, processing: st.p },
    }
  },
}

module.exports = { brands, campaigns, submissions, stories, stats, setupAndSeed }

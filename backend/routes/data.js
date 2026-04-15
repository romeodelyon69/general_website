const express     = require('express')
const requireAuth = require('../middleware/auth')
const { states }  = require('../db')

const router = express.Router()

// ── GET /api/data  →  load user's app state ───────────────────────────────
router.get('/', requireAuth, (req, res) => {
  res.json(states.get(req.userId))
})

// ── PUT /api/data  →  save user's app state ───────────────────────────────
router.put('/', requireAuth, (req, res) => {
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({ error: 'Corps de requête invalide' })
  }
  states.save(req.userId, req.body)
  res.json({ ok: true })
})

module.exports = router

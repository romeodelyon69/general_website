const express  = require('express')
const bcrypt   = require('bcryptjs')
const jwt      = require('jsonwebtoken')
const crypto   = require('crypto')
const { users, tokens } = require('../db')

const router         = express.Router()
const JWT_SECRET     = process.env.JWT_SECRET || 'dev_secret_change_me_in_production'
const ACCESS_TTL     = '2h'
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000  // 30 days

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax',
  maxAge:   REFRESH_TTL_MS,
  // secure: true  ← uncomment if served over HTTPS
}

function issueTokens(userId) {
  const accessToken  = jwt.sign({ userId }, JWT_SECRET, { expiresIn: ACCESS_TTL })
  const refreshToken = crypto.randomBytes(40).toString('hex')
  const expiresAt    = new Date(Date.now() + REFRESH_TTL_MS).toISOString()
  tokens.create(refreshToken, userId, expiresAt)
  return { accessToken, refreshToken }
}

// ── POST /api/auth/register ───────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { username, password } = req.body ?? {}

  if (!username?.trim() || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'Nom d\'utilisateur requis et mot de passe ≥ 6 caractères' })
  }

  if (users.getByUsername(username)) {
    return res.status(409).json({ error: 'Ce nom d\'utilisateur est déjà pris' })
  }

  const id           = crypto.randomUUID()
  const passwordHash = await bcrypt.hash(password, 12)
  users.create(id, username.trim(), passwordHash)

  const { accessToken, refreshToken } = issueTokens(id)
  res.cookie('refreshToken', refreshToken, COOKIE_OPTS)
  res.status(201).json({ accessToken, username: username.trim() })
})

// ── POST /api/auth/login ──────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { username, password } = req.body ?? {}
  const user = users.getByUsername(username ?? '')

  // Constant-time failure to prevent user enumeration
  const hash = user?.passwordHash ?? '$2a$12$invalidhashpaddingtomatchtime000000000000000000000000'
  const ok   = await bcrypt.compare(password ?? '', hash)

  if (!user || !ok) {
    return res.status(401).json({ error: 'Identifiants incorrects' })
  }

  const { accessToken, refreshToken } = issueTokens(user.id)
  res.cookie('refreshToken', refreshToken, COOKIE_OPTS)
  res.json({ accessToken, username: user.username })
})

// ── POST /api/auth/refresh ────────────────────────────────────────────────
router.post('/refresh', (req, res) => {
  const token = req.cookies?.refreshToken
  if (!token) return res.status(401).json({ error: 'Non authentifié' })

  const stored = tokens.get(token)
  if (!stored || new Date(stored.expiresAt) < new Date()) {
    tokens.delete(token)
    res.clearCookie('refreshToken')
    return res.status(401).json({ error: 'Session expirée, veuillez vous reconnecter' })
  }

  const user = users.getById(stored.userId)
  if (!user) return res.status(401).json({ error: 'Utilisateur introuvable' })

  // Rotate: delete old token, issue new pair
  tokens.delete(token)
  const { accessToken, refreshToken } = issueTokens(user.id)
  res.cookie('refreshToken', refreshToken, COOKIE_OPTS)
  res.json({ accessToken, username: user.username })
})

// ── POST /api/auth/logout ─────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  const token = req.cookies?.refreshToken
  if (token) tokens.delete(token)
  res.clearCookie('refreshToken')
  res.json({ ok: true })
})

module.exports = router

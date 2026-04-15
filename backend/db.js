/**
 * Lightweight JSON-file storage — no native deps, perfect for a personal NAS.
 * All writes are atomic (write to .tmp then rename) to prevent corruption.
 */
const fs   = require('fs')
const path = require('path')

const DATA_DIR  = path.join(__dirname, 'data')
const USERS_F   = path.join(DATA_DIR, 'users.json')
const TOKENS_F  = path.join(DATA_DIR, 'tokens.json')
const STATES_DIR= path.join(DATA_DIR, 'states')

// ── Bootstrap directories & files ─────────────────────────────────────────
;[DATA_DIR, STATES_DIR].forEach(d => fs.mkdirSync(d, { recursive: true }))
if (!fs.existsSync(USERS_F))  writeJSON(USERS_F, {})
if (!fs.existsSync(TOKENS_F)) writeJSON(TOKENS_F, {})

// ── Core helpers ──────────────────────────────────────────────────────────
function readJSON(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')) }
  catch { return {} }
}

function writeJSON(file, data) {
  const tmp = file + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8')
  fs.renameSync(tmp, file)   // atomic on same filesystem
}

// ── Users ─────────────────────────────────────────────────────────────────
const users = {
  getAll:  ()       => readJSON(USERS_F),
  getById: (id)     => Object.values(readJSON(USERS_F)).find(u => u.id === id) ?? null,
  getByUsername: (username) => readJSON(USERS_F)[username.toLowerCase()] ?? null,

  create(id, username, passwordHash) {
    const all = readJSON(USERS_F)
    all[username.toLowerCase()] = { id, username, passwordHash, createdAt: new Date().toISOString() }
    writeJSON(USERS_F, all)
  },
}

// ── Refresh tokens ────────────────────────────────────────────────────────
const tokens = {
  get: (token) => readJSON(TOKENS_F)[token] ?? null,

  create(token, userId, expiresAt) {
    const all = readJSON(TOKENS_F)
    all[token] = { userId, expiresAt }
    writeJSON(TOKENS_F, all)
  },

  delete(token) {
    const all = readJSON(TOKENS_F)
    delete all[token]
    writeJSON(TOKENS_F, all)
  },

  // Clean expired tokens (called at startup + periodically)
  purge() {
    const all  = readJSON(TOKENS_F)
    const now  = new Date()
    const kept = Object.fromEntries(
      Object.entries(all).filter(([, v]) => new Date(v.expiresAt) > now)
    )
    writeJSON(TOKENS_F, kept)
  },
}

// ── User state (app data) ─────────────────────────────────────────────────
const states = {
  get(userId) {
    const file = path.join(STATES_DIR, `${userId}.json`)
    return fs.existsSync(file) ? readJSON(file) : {}
  },

  save(userId, data) {
    const file = path.join(STATES_DIR, `${userId}.json`)
    writeJSON(file, { ...data, savedAt: new Date().toISOString() })
  },
}

// Purge expired tokens on startup, then every hour
tokens.purge()
setInterval(() => tokens.purge(), 60 * 60 * 1000)

module.exports = { users, tokens, states }

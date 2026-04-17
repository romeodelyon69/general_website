const express      = require('express')
const cors         = require('cors')
const cookieParser = require('cookie-parser')
const authRoutes   = require('./routes/auth')
const dataRoutes   = require('./routes/data')
const adminRoutes  = require('./routes/admin')

const app  = express()
const PORT = process.env.PORT || 3001

// ── Middleware ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }))   // app state can be a few MB
app.use(cookieParser())
app.use(cors({
  origin:      process.env.FRONTEND_ORIGIN || true,
  credentials: true,
}))

// ── Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes)
app.use('/api/data', dataRoutes)
app.use('/api/admin', adminRoutes)

// ── Health check ──────────────────────────────────────────────────────────
app.get('/api/health', (_, res) => res.json({ ok: true }))

// ── Start ─────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[SelfCare API] running on port ${PORT}`)
})

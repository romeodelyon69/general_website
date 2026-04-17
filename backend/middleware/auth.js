const jwt = require('jsonwebtoken')
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me_in_production'

module.exports = function requireAuth(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Non authentifié' })
  }
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET)
    req.userId = payload.userId
    req.isAdmin = payload.isAdmin === true
    next()
  } catch {
    res.status(401).json({ error: 'Token invalide ou expiré' })
  }
}

module.exports = function requireAdmin(req, res, next) {
  if (!req.isAdmin) return res.status(403).json({ error: 'Accès refusé' })
  next()
}

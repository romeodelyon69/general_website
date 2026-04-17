const express      = require('express')
const requireAuth  = require('../middleware/auth')
const requireAdmin = require('../middleware/requireAdmin')
const { users, states } = require('../db')

const router = express.Router()

// GET /api/admin/users
router.get('/users', requireAuth, requireAdmin, (req, res) => {
  const all  = users.getAll()
  const list = Object.values(all).map(u => ({
    id:        u.id,
    username:  u.username,
    createdAt: u.createdAt,
    isAdmin:   u.isAdmin ?? false,
  }))
  res.json(list)
})

// GET /api/admin/ideas
router.get('/ideas', requireAuth, requireAdmin, (req, res) => {
  const all    = users.getAll()
  const result = Object.values(all).map(u => {
    const state = states.get(u.id)
    return {
      userId:   u.id,
      username: u.username,
      ideas:    state.ideas ?? [],
    }
  })
  res.json(result)
})

module.exports = router

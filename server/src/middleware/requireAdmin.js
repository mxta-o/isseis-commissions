const jwt = require('jsonwebtoken')
const { env } = require('../config/env')

function requireAdmin(req, res, next) {
  if (!env.adminJwtSecret) {
    return res.status(500).json({
      message: 'ADMIN_JWT_SECRET is missing. Configure backend environment first.',
    })
  }

  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length)
    : null

  if (!token) {
    return res.status(401).json({ message: 'Missing admin bearer token.' })
  }

  try {
    const payload = jwt.verify(token, env.adminJwtSecret)
    req.admin = payload
    next()
  } catch {
    return res.status(401).json({ message: 'Invalid or expired admin token.' })
  }
}

module.exports = {
  requireAdmin,
}

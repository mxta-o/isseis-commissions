const express = require('express')
const cors = require('cors')
const { env } = require('./config/env')
const { healthRouter } = require('./routes/health')
const { publicRouter } = require('./routes/public')
const { errorHandler } = require('./middleware/errorHandler')

const app = express()
app.disable('x-powered-by')

// Render/Railway put a proxy in front of the app. Trust exactly one hop so req.ip is the real
// client (from X-Forwarded-For) — the rate limiter depends on it — without letting a client
// spoof its IP by sending its own X-Forwarded-For header.
app.set('trust proxy', 1)

app.use(cors({ origin: env.clientUrl }))
app.use(express.json({ limit: '16kb' }))

app.use('/api/health', healthRouter)
app.use('/api', publicRouter)

app.use('/api', (req, res) => res.status(404).json({ message: 'Not found.' }))
app.use(errorHandler)

module.exports = {
  app,
}

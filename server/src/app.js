const express = require('express')
const cors = require('cors')
const { env } = require('./config/env')
const { healthRouter } = require('./routes/health')
const { commissionRouter } = require('./routes/commissions')

const app = express()

app.use(cors({ origin: env.clientUrl }))
app.use(express.json({ limit: '2mb' }))

app.use('/api/health', healthRouter)
app.use('/api/commissions', commissionRouter)

module.exports = {
  app,
}

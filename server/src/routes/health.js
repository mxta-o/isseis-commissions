const express = require('express')

const healthRouter = express.Router()

healthRouter.get('/', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'isseis-commissions-api' })
})

module.exports = {
  healthRouter,
}

const { Resend } = require('resend')
const { env } = require('../config/env')

const resend = new Resend(env.resendApiKey)

module.exports = {
  resend,
}

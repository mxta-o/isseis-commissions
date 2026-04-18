const { Resend } = require('resend')
const { env } = require('../config/env')

let resendClient = null

if (env.resendApiKey) {
  resendClient = new Resend(env.resendApiKey)
}

function getResendClient() {
  return resendClient
}

module.exports = {
  getResendClient,
}

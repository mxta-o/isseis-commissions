// transactional email via Resend. sent in plain text for now. every message is one func so templates
// can be swapped for HTML later without touching routes
const { resend } = require('../lib/resend')
const { env } = require('../config/env')
const { HttpError } = require('../lib/httpError')

const statusUrl = id => `${env.publicSiteUrl}/?id=${id}`

// resend's SDK reports failures as error instead of throwing.
async function send({ to, subject, text }) {
  const { error } = await resend.emails.send({ from: env.resendFromEmail, to, subject, text })
  if (error) {
    const err = new Error(`Resend: ${error.message}`)
    err.resend = error
    throw err
  }
}

// For emails whose failure shouldn't fail the request (the commission already exists; the
// tracking ID is on screen). Logs and moves on.
async function sendQuietly(message) {
  try {
    await send(message)
  } catch (err) {
    console.error(`Email "${message.subject}" to ${message.to} failed:`, err.message)
  }
}

// The user is waiting on this one, so failure is surfaced as a 502.
async function sendVerificationCode(email, code) {
  try {
    await send({
      to: email,
      subject: `Your verification code: ${code}`,
      text: [
        `Your Issei's Comms verification code is ${code}.`,
        '',
        'It expires in 10 minutes. If you didn\'t request this, you can ignore this email.',
      ].join('\n'),
    })
  } catch (err) {
    console.error('Verification email failed:', err.message)
    // in development resend's test sender only reaches the account owner
    const hint = env.nodeEnv !== 'production' && err.resend ? ` (${err.resend.message})` : ''
    throw new HttpError(502, `We couldn't send the code to that address.${hint}`)
  }
}

function sendTrackingId(commission) {
  return sendQuietly({
    to: commission.email,
    subject: `Request received — ${commission.title}`,
    text: [
      'Your commission request has been received and is waiting for review.',
      '',
      `Tracking ID: ${commission.id}`,
      `Check status: ${statusUrl(commission.id)}`,
      '',
      'Keep this email. If your request is accepted, you\'ll get another email with the price and how to pay.',
    ].join('\n'),
  })
}

function notifyNewCommission(commission, fileCount) {
  if (!env.notifyEmail) return Promise.resolve()
  return sendQuietly({
    to: env.notifyEmail,
    subject: `New commission request — ${commission.title}`,
    text: [
      `Title: ${commission.title}`,
      `Tier: ${commission.tier}`,
      `From: ${commission.email}`,
      `Reference files: ${fileCount}`,
      `ID: ${commission.id}`,
      '',
      'Review it in the admin console.',
    ].join('\n'),
  })
}

module.exports = {
  statusUrl,
  sendVerificationCode,
  sendTrackingId,
  notifyNewCommission,
}

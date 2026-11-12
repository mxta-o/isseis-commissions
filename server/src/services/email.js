// transactional email via Resend. sent in plain text for now. every message is one func so templates
// can be swapped for HTML later without touching routes
const { resend } = require('../lib/resend')
const { env } = require('../config/env')
const { HttpError } = require('../lib/httpError')
const { paymentRef, formatPrice } = require('../domain/payment')

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
// The log line names the email kind and the payment ref only: no address and no subject (it holds
// the buyer's title), and not the full tracking ID, since that's the secret to their status page.
async function sendQuietly(kind, commissionId, message) {
  try {
    await send(message)
  } catch (err) {
    console.error(`Email "${kind}" for ref ${paymentRef(commissionId)} failed:`, err.resend?.message ?? err.message)
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
    // the real reason (e.g. resend's test sender only reaching the account owner) goes to the server log, never to the visitor
    console.error('Verification email failed:', err.resend?.message ?? err.message)
    throw new HttpError(502, 'We couldn\'t send the code to that address. Check it for typos and try again in a moment.')
  }
}

function sendTrackingId(commission) {
  return sendQuietly('request received', commission.id, {
    to: commission.email,
    subject: `Request received — ${commission.title}`,
    text: [
      'Your commission request has been received and is waiting for review.',
      '',
      `Tracking ID: ${commission.id}`,
      `Payment reference: ${paymentRef(commission.id)}`,
      `Check status: ${statusUrl(commission.id)}`,
      '',
      'Keep this email. If your request is accepted, you\'ll get another email with the price and how to pay. Put the payment reference above in your Ko-fi message then, so the payment can be matched to your request.',
      'Please don\'t pay before your request is accepted.',
    ].join('\n'),
  })
}

function notifyNewCommission(commission, fileCount) {
  if (!env.notifyEmail) return Promise.resolve()
  return sendQuietly('new request alert', commission.id, {
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

// status updates (sent after an admin action; never fail the action) vv

function sendApproved(c) {
  const ref = paymentRef(c.id)
  const price = `${formatPrice(c.price_cents)} CAD`
  return sendQuietly('accepted', c.id, {
    to: c.email,
    subject: `Accepted — ${c.title} (payment due within 24 h)`,
    text: [
      'Good news: your commission request has been accepted.',
      '',
      `Price: ${price}`,
      `Payment reference: ${ref}`,
      `Pay by: ${new Date(c.payment_deadline).toUTCString()}`,
      '',
      'How to pay:',
      `1. Open ${env.kofiUrl}`,
      `2. Send exactly ${price}.`,
      `3. Put ${ref} in the message so the payment can be matched to your request.`,
      '',
      'Work starts once the payment is confirmed. If it isn\'t received within 24 hours the request is cancelled.',
      '',
      `Check status: ${statusUrl(c.id)}`,
    ].join('\n'),
  })
}

function sendRejected(c) {
  return sendQuietly('declined', c.id, {
    to: c.email,
    subject: `Request declined — ${c.title}`,
    text: [
      'Your commission request was reviewed and declined.',
      '',
      `Reason: ${c.cancellation_reason}`,
      '',
      'You haven\'t been charged anything.',
      '',
      `Status page: ${statusUrl(c.id)}`,
    ].join('\n'),
  })
}

function sendPaymentConfirmed(c) {
  return sendQuietly('payment received', c.id, {
    to: c.email,
    subject: `Payment received — ${c.title}`,
    text: [
      `Your payment of ${formatPrice(c.price_cents)} CAD was received and your commission is now in progress.`,
      '',
      'You\'ll get another email with a download link when it\'s finished.',
      '',
      `Check status: ${statusUrl(c.id)}`,
    ].join('\n'),
  })
}

function sendExpired(c) {
  return sendQuietly('expired', c.id, {
    to: c.email,
    subject: `Request cancelled — ${c.title}`,
    text: [
      'Your commission request was cancelled because payment wasn\'t received within 24 hours of acceptance.',
      '',
      'You\'re welcome to submit a new request.',
      '',
      `Status page: ${statusUrl(c.id)}`,
    ].join('\n'),
  })
}

function sendCompleted(c) {
  return sendQuietly('completed', c.id, {
    to: c.email,
    subject: `Your commission is ready — ${c.title}`,
    text: [
      'Your commission is finished!',
      '',
      `Download it here: ${statusUrl(c.id)}`,
      '',
      'The page gives you fresh download links whenever you visit, so you can come back to it any time.',
    ].join('\n'),
  })
}

module.exports = {
  statusUrl,
  sendVerificationCode,
  sendTrackingId,
  notifyNewCommission,
  sendApproved,
  sendRejected,
  sendPaymentConfirmed,
  sendExpired,
  sendCompleted,
}

// Commission lifecycle.
//
// Every status change is one of the actions below. The data layer applies it as a conditional
// update — UPDATE ... WHERE id = $id AND status = $from — so an action that's stale (someone
// else already moved the row) or repeated (double-click, retried request) matches zero rows
// instead of applying twice. That's what makes admin actions safe to retry.
//
// This module is pure: no DB, no clock except what's passed in. Routes call planTransition()
// and hand the result to the data layer.

const STATUS = Object.freeze({
  PENDING_REVIEW: 'pending_review',
  AWAITING_PAYMENT: 'awaiting_payment',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
})

const TRANSITIONS = Object.freeze({
  approve: { from: STATUS.PENDING_REVIEW, to: STATUS.AWAITING_PAYMENT },
  reject: { from: STATUS.PENDING_REVIEW, to: STATUS.CANCELLED },
  markPaid: { from: STATUS.AWAITING_PAYMENT, to: STATUS.IN_PROGRESS },
  expire: { from: STATUS.AWAITING_PAYMENT, to: STATUS.CANCELLED },
  complete: { from: STATUS.IN_PROGRESS, to: STATUS.COMPLETED },
})

const PAYMENT_WINDOW_MS = 24 * 60 * 60 * 1000
// Ko-fi won't accept less than $5.
const MIN_PRICE_CENTS = 500
const MAX_REASON_LENGTH = 500
const EXPIRED_REASON = 'Payment window expired (24 h). The request may be resubmitted.'

// Bad input for an otherwise valid action (missing reason, price too low). Routes map it to 400.
class TransitionInputError extends Error {
  constructor(message) {
    super(message)
    this.name = 'TransitionInputError'
  }
}

function getTransition(action) {
  if (!Object.hasOwn(TRANSITIONS, action)) {
    throw new Error(`Unknown commission action: ${action}`)
  }
  return TRANSITIONS[action]
}

// Returns { from, patch }: the status the row must currently have, and the columns to write.
function planTransition(action, input = {}, now = new Date()) {
  const { from, to } = getTransition(action)
  const patch = { status: to }

  switch (action) {
    case 'approve': {
      const { priceCents } = input
      if (!Number.isInteger(priceCents) || priceCents < MIN_PRICE_CENTS) {
        throw new TransitionInputError(`Price must be a whole number of cents, at least ${MIN_PRICE_CENTS}.`)
      }
      patch.price_cents = priceCents
      patch.payment_deadline = new Date(now.getTime() + PAYMENT_WINDOW_MS).toISOString()
      break
    }
    case 'reject': {
      const reason = typeof input.reason === 'string' ? input.reason.trim() : ''
      if (!reason) throw new TransitionInputError('A rejection reason is required.')
      if (reason.length > MAX_REASON_LENGTH) {
        throw new TransitionInputError(`Rejection reason must be at most ${MAX_REASON_LENGTH} characters.`)
      }
      patch.cancellation_reason = reason
      break
    }
    case 'markPaid':
      patch.paid_at = now.toISOString()
      break
    case 'expire':
      patch.cancellation_reason = EXPIRED_REASON
      break
    case 'complete':
      break
  }

  return { from, patch }
}

function isOverdue(commission, now = new Date()) {
  return (
    commission.status === STATUS.AWAITING_PAYMENT &&
    commission.payment_deadline != null &&
    new Date(commission.payment_deadline).getTime() < now.getTime()
  )
}

module.exports = {
  STATUS,
  TRANSITIONS,
  PAYMENT_WINDOW_MS,
  MIN_PRICE_CENTS,
  EXPIRED_REASON,
  TransitionInputError,
  getTransition,
  planTransition,
  isOverdue,
}

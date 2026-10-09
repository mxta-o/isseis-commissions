const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const {
  STATUS,
  TRANSITIONS,
  PAYMENT_WINDOW_MS,
  EXPIRED_REASON,
  TransitionInputError,
  planTransition,
  isOverdue,
} = require('./transitions')

const NOW = new Date('2026-10-08T12:00:00.000Z')

describe('transition graph', () => {
  it('maps each action to the expected from/to', () => {
    assert.deepEqual(TRANSITIONS, {
      approve: { from: 'pending_review', to: 'awaiting_payment' },
      reject: { from: 'pending_review', to: 'cancelled' },
      markPaid: { from: 'awaiting_payment', to: 'in_progress' },
      expire: { from: 'awaiting_payment', to: 'cancelled' },
      complete: { from: 'in_progress', to: 'completed' },
    })
  })

  it('treats completed and cancelled as terminal', () => {
    const sources = new Set(Object.values(TRANSITIONS).map(t => t.from))
    assert.equal(sources.has(STATUS.COMPLETED), false)
    assert.equal(sources.has(STATUS.CANCELLED), false)
  })

  it('reaches every status from pending_review', () => {
    const reached = new Set([STATUS.PENDING_REVIEW])
    let grew = true
    while (grew) {
      grew = false
      for (const { from, to } of Object.values(TRANSITIONS)) {
        if (reached.has(from) && !reached.has(to)) { reached.add(to); grew = true }
      }
    }
    assert.deepEqual([...reached].sort(), Object.values(STATUS).sort())
  })

  it('throws on an unknown action', () => {
    assert.throws(() => planTransition('reopen'), /Unknown commission action/)
    // Inherited Object properties aren't actions either.
    assert.throws(() => planTransition('toString'), /Unknown commission action/)
  })
})

describe('planTransition', () => {
  it('approve: snapshots the price and sets a 24 h deadline', () => {
    const { from, patch } = planTransition('approve', { priceCents: 2500 }, NOW)
    assert.equal(from, STATUS.PENDING_REVIEW)
    assert.deepEqual(patch, {
      status: STATUS.AWAITING_PAYMENT,
      price_cents: 2500,
      payment_deadline: new Date(NOW.getTime() + PAYMENT_WINDOW_MS).toISOString(),
    })
  })

  it('approve: rejects prices below the Ko-fi minimum or not in whole cents', () => {
    for (const priceCents of [undefined, 0, 499, 12.5, '2500', -100]) {
      assert.throws(() => planTransition('approve', { priceCents }, NOW), TransitionInputError)
    }
    assert.doesNotThrow(() => planTransition('approve', { priceCents: 500 }, NOW))
  })

  it('reject: requires a reason and trims it', () => {
    const { from, patch } = planTransition('reject', { reason: '  Conflicts with the ruleset.  ' }, NOW)
    assert.equal(from, STATUS.PENDING_REVIEW)
    assert.deepEqual(patch, { status: STATUS.CANCELLED, cancellation_reason: 'Conflicts with the ruleset.' })

    for (const reason of [undefined, '', '   ', 42, 'x'.repeat(501)]) {
      assert.throws(() => planTransition('reject', { reason }, NOW), TransitionInputError)
    }
  })

  it('markPaid: stamps paid_at', () => {
    const { from, patch } = planTransition('markPaid', {}, NOW)
    assert.equal(from, STATUS.AWAITING_PAYMENT)
    assert.deepEqual(patch, { status: STATUS.IN_PROGRESS, paid_at: NOW.toISOString() })
  })

  it('expire: cancels with the payment-window reason', () => {
    const { from, patch } = planTransition('expire', {}, NOW)
    assert.equal(from, STATUS.AWAITING_PAYMENT)
    assert.deepEqual(patch, { status: STATUS.CANCELLED, cancellation_reason: EXPIRED_REASON })
  })

  it('complete: only changes status', () => {
    const { from, patch } = planTransition('complete', {}, NOW)
    assert.equal(from, STATUS.IN_PROGRESS)
    assert.deepEqual(patch, { status: STATUS.COMPLETED })
  })
})

describe('isOverdue', () => {
  const past = new Date(NOW.getTime() - 1).toISOString()
  const future = new Date(NOW.getTime() + 1).toISOString()

  it('is true only for awaiting_payment past its deadline', () => {
    assert.equal(isOverdue({ status: 'awaiting_payment', payment_deadline: past }, NOW), true)
    assert.equal(isOverdue({ status: 'awaiting_payment', payment_deadline: future }, NOW), false)
    assert.equal(isOverdue({ status: 'awaiting_payment', payment_deadline: null }, NOW), false)
    assert.equal(isOverdue({ status: 'in_progress', payment_deadline: past }, NOW), false)
  })
})

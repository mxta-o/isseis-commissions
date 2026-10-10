const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const { paymentRef, formatPrice } = require('./payment')

describe('paymentRef', () => {
  it('is the first 8 hex characters of the UUID, uppercased', () => {
    assert.equal(paymentRef('3f9a12bc-0d4e-4c1a-9b7f-123456789abc'), '3F9A12BC')
  })
})

describe('formatPrice', () => {
  it('drops cents for whole-dollar prices and keeps two decimals otherwise', () => {
    assert.equal(formatPrice(2500), '$25')
    assert.equal(formatPrice(500), '$5')
    assert.equal(formatPrice(2550), '$25.50')
    assert.equal(formatPrice(2505), '$25.05')
  })
})

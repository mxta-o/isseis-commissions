// How a commission is identified and priced when the buyer pays on Ko-fi.
//
// Ko-fi is a tip jar: the buyer types any amount plus a free-text message, so Loraine matches a
// payment to a commission by the amount and this short reference in the message. It's for
// matching only — the full UUID stays the secret that unlocks the status page.

function paymentRef(commissionId) {
  return commissionId.replaceAll('-', '').slice(0, 8).toUpperCase()
}

function formatPrice(priceCents) {
  const dollars = priceCents / 100
  return `$${Number.isInteger(dollars) ? dollars : dollars.toFixed(2)}`
}

module.exports = {
  paymentRef,
  formatPrice,
}

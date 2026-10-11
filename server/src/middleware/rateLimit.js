const { rateLimit } = require('express-rate-limit')

// Counters live in this process's memory, keyed by client IP (req.ip — correct behind a proxy
// only because app.js sets `trust proxy`). Fine for a single instance; a shared store like Redis
// would be needed to run several.
function limiter(windowMinutes, limit, message) {
  return rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { message },
  })
}

// Every call sends an email, so this is the endpoint worth abusing: cap it per IP so one
// machine can't spam strangers' inboxes or burn the Resend quota.
const verifyLimiter = limiter(15, 5, 'Too many requests. Try again in a few minutes.')

// Submits are already gated by a verified code; this just stops a script hammering the
// code check or the upload path.
const submitLimiter = limiter(15, 10, 'Too many submissions. Try again in a few minutes.')

module.exports = {
  verifyLimiter,
  submitLimiter,
}

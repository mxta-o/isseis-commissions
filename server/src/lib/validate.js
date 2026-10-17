const { z } = require('zod')
const { HttpError } = require('./httpError')

// runs a zod schema and turns the first problem into a 400 with a readable message
function parse(schema, input) {
  const result = schema.safeParse(input)
  if (!result.success) throw new HttpError(400, result.error.issues[0].message)
  return result.data
}

// an invalid ID can't match anything, so it's treated exactly like an unknown one
function parseCommissionId(raw) {
  const result = z.uuid().safeParse(raw)
  if (!result.success) throw new HttpError(404, 'No commission found for that tracking ID.')
  return result.data
}

module.exports = {
  parse,
  parseCommissionId,
}

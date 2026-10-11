const multer = require('multer')
const { HttpError } = require('../lib/httpError')
const { TransitionInputError } = require('../domain/transitions')
const { MAX_REFERENCE_FILES } = require('./upload')

const MULTER_MESSAGES = {
  LIMIT_FILE_SIZE: [413, 'Each file must be 10 MB or smaller.'],
  LIMIT_FILE_COUNT: [400, `Attach at most ${MAX_REFERENCE_FILES} files.`],
  LIMIT_UNEXPECTED_FILE: [400, `Attach at most ${MAX_REFERENCE_FILES} files.`],
}

// express forwards errors thrown in async handlers here automatically.
// known errors keep their message. anything unexpected is logged and hidden behind a generic
// 500 js so that details like SQL, stack traces, keys in URLs never reach the frontend.
function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message })
  }
  if (err instanceof TransitionInputError) {
    return res.status(400).json({ message: err.message })
  }
  if (err instanceof multer.MulterError) {
    const [status, message] = MULTER_MESSAGES[err.code] || [400, 'Invalid upload.']
    return res.status(status).json({ message })
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Malformed JSON body.' })
  }

  console.error(`[${req.method} ${req.originalUrl}]`, err)
  return res.status(500).json({ message: 'Something went wrong on our side. Please try again.' })
}

module.exports = {
  errorHandler,
}

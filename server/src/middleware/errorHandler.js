const multer = require('multer')
const { HttpError } = require('../lib/httpError')
const { TransitionInputError } = require('../domain/transitions')
const { MAX_REFERENCE_FILES, MAX_REFERENCE_BYTES, MAX_FINAL_BYTES } = require('./upload')

const MB = 1024 * 1024

// reference uploads (public form) and final uploads (admin) have different limits
function multerMessage(err, req) {
  const isFinal = req.originalUrl.startsWith('/api/admin/')
  switch (err.code) {
    case 'LIMIT_FILE_SIZE':
      return [413, `Each file must be ${(isFinal ? MAX_FINAL_BYTES : MAX_REFERENCE_BYTES) / MB} MB or smaller.`]
    case 'LIMIT_FILE_COUNT':
    case 'LIMIT_UNEXPECTED_FILE':
      return [400, isFinal ? 'Too many files in one upload.' : `Attach at most ${MAX_REFERENCE_FILES} files.`]
    default:
      return [400, 'Invalid upload.']
  }
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
    const [status, message] = multerMessage(err, req)
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

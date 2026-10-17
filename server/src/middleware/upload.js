const multer = require('multer')
const { HttpError } = require('../lib/httpError')

const MAX_REFERENCE_FILES = 5
const MAX_REFERENCE_BYTES = 10 * 1024 * 1024
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp'])

// Files are held in memory (at most 5x10 MB per request) and streamed to Supabase Storage buckets
// by the route. The MIME check here is a cheap first pass on what the browser claims and the route
// verifies the actual bytes before anything is stored.
const referenceUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: MAX_REFERENCE_FILES,
    fileSize: MAX_REFERENCE_BYTES,
    fields: 10,
    fieldSize: 8 * 1024,
  },
  fileFilter(req, file, cb) {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      return cb(new HttpError(400, 'Only JPG, PNG and WebP images are accepted.'))
    }
    cb(null, true)
  },
}).array('files', MAX_REFERENCE_FILES)

// finished art from loraine. bigger cap but fewer files per request:
// everything sits in memory until it's stored. the admin console uploads one file per request anyway.
const MAX_FINAL_FILES = 3
const MAX_FINAL_BYTES = 50 * 1024 * 1024

const finalUpload = multer({
  storage: multer.memoryStorage(),
  limits: { files: MAX_FINAL_FILES, fileSize: MAX_FINAL_BYTES, fields: 5 },
  fileFilter(req, file, cb) {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      return cb(new HttpError(400, 'Only JPG, PNG and WebP images are accepted.'))
    }
    cb(null, true)
  },
}).array('files', MAX_FINAL_FILES)

module.exports = {
  referenceUpload,
  finalUpload,
  MAX_REFERENCE_FILES,
  MAX_REFERENCE_BYTES,
  MAX_FINAL_BYTES,
}

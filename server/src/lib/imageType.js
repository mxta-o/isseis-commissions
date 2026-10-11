// Identify an image by its first bytes ("magic numbers") instead of trusting the browser-supplied
// MIME type or file extension, both of which the uploader controls.
const SIGNATURES = [
  { mime: 'image/jpeg', ext: 'jpg', test: b => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    mime: 'image/png',
    ext: 'png',
    test: b => b.length >= 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  {
    mime: 'image/webp',
    ext: 'webp',
    test: b => b.length >= 12 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP',
  },
]

// Returns { mime, ext } or null if the bytes aren't a JPEG, PNG or WebP.
function sniffImageType(buffer) {
  const match = SIGNATURES.find(s => s.test(buffer))
  return match ? { mime: match.mime, ext: match.ext } : null
}

module.exports = {
  sniffImageType,
}

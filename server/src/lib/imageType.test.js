const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const { sniffImageType } = require('./imageType')

describe('sniffImageType', () => {
  it('recognizes JPEG, PNG and WebP headers', () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00])
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00])
    const webp = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBPVP8 ')])

    assert.deepEqual(sniffImageType(jpeg), { mime: 'image/jpeg', ext: 'jpg' })
    assert.deepEqual(sniffImageType(png), { mime: 'image/png', ext: 'png' })
    assert.deepEqual(sniffImageType(webp), { mime: 'image/webp', ext: 'webp' })
  })

  it('rejects other files, even when they claim to be images', () => {
    const gif = Buffer.from('GIF89a')
    const html = Buffer.from('<html><script>alert(1)</script>')
    const wav = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WAVE')])

    for (const buf of [gif, html, wav, Buffer.alloc(0), Buffer.from([0xff, 0xd8])]) {
      assert.equal(sniffImageType(buf), null)
    }
  })
})

import React, { useEffect, useState } from 'react'

// Same block glyphs the pretitle card scrambles through (pages/PreTitle.tsx).
const GLYPHS = '▮▯■□◇/<>#%&01¦=+*'
const IS_LETTER = /[\p{L}\p{N}]/u

const LETTER_MS = 380    // one letter's flicker; keep in step with the ltr-* keyframes in nier.css
const MAX_SPREAD_MS = 320 // the stagger across the whole text is capped, so long subheaders aren't slow

// Text that decodes into place: every letter starts as a block glyph and resolves into the real letter, left to
// right, with a short flicker. All the motion is CSS (.ltr-on in nier.css); this only builds the markup.
//  - the real letters hold their final width from the first frame, so nothing around the text jumps
//  - the screen-reader text is the plain string, the animated letters are hidden from it
//  - when it's done, or when the user prefers reduced motion, it goes back to plain text: one text node, exactly
//    what a static heading renders, so nothing shifts by a sub-pixel when the effect ends
export default function DecodeText({ text }: { text: string }): React.ReactElement {
  const [motion] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [done, setDone] = useState(false)

  const total = [...text].filter(c => IS_LETTER.test(c)).length
  const step = Math.max(8, Math.min(28, Math.floor(MAX_SPREAD_MS / Math.max(total, 1))))
  const running = motion && !done

  useEffect(() => {
    if (!running) return
    const id = window.setTimeout(() => setDone(true), step * total + LETTER_MS + 60)
    return () => window.clearTimeout(id)
  }, [running, step, total])

  if (!running) return <>{text}</>

  let n = 0
  return (
    <span className="ltr-on" style={{ '--step': `${step}ms` } as React.CSSProperties}>
      <span className="sr-only">{text}</span>
      <span aria-hidden>
        {text.split(' ').map((word, w) => (
          <React.Fragment key={w}>
            {w > 0 && ' '}
            {/* a word never breaks in the middle, but the line can still wrap between words */}
            <span style={{ whiteSpace: 'nowrap' }}>
              {[...word].map((c, k) => {
                if (!IS_LETTER.test(c)) return c
                const i = n++
                return (
                  <span key={k} className="ltr" data-g={GLYPHS[(i * 7 + c.charCodeAt(0)) % GLYPHS.length]} style={{ '--i': i } as React.CSSProperties}>
                    <span className="ltr-r">{c}</span>
                  </span>
                )
              })}
            </span>
          </React.Fragment>
        ))}
      </span>
    </span>
  )
}

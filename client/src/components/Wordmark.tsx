import React from 'react'

type Props = {
  size: number // font size of "ISSEI" in px; the tagline scales with it
  style?: React.CSSProperties
}

// issei's wordmark as plain text. replaces the old logo image, whose crest was the NieR YoRHa
// emblem. colour comes from the parent (currentColor), so it works on the dark boot screen and
// the beige app chrome alike.
export default function Wordmark({ size, style }: Props): React.ReactElement {
  return (
    <div aria-hidden style={{ fontFamily: 'var(--font-wordmark)', lineHeight: 1, userSelect: 'none', pointerEvents: 'none', ...style }}>
      <div style={{ fontSize: size, fontWeight: 500, letterSpacing: '0.2em', marginRight: '-0.2em' }}>ISSEI</div>
      <div style={{ fontSize: size * 0.2, fontWeight: 400, letterSpacing: '0.14em', marginTop: size * 0.14 }}>For the Vision of Creation</div>
    </div>
  )
}

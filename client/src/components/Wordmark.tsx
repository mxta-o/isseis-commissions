import React from 'react'

type Props = {
  size: number
  style?: React.CSSProperties
}

const SQUASH = 0.9

export default function Wordmark({ size, style }: Props): React.ReactElement {
  return (
    <div aria-hidden style={{ fontFamily: 'var(--font-wordmark)', lineHeight: 1, userSelect: 'none', pointerEvents: 'none', ...style }}>
      {/* bold + squashed vertically (scaleY doesn't change layout height, so marginBottom takes the lost space back) */}
      <div style={{ fontSize: size, fontWeight: 400, letterSpacing: '0.085em', marginRight: '-0.04em', transform: `scaleY(${SQUASH})`, transformOrigin: 'top center', marginBottom: -size * (1 - SQUASH) }}>ISSEI</div>
      <div style={{ fontSize: size * 0.2, fontWeight: 400, letterSpacing: '0.14em', marginTop: size * 0.14 }}>For the Vision of Creation</div>
    </div>
  )
}

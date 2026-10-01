import React from 'react'

type Props = { onAdvance: () => void }

const NOISE =
  "url(data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='140'%20height='140'%3E%3Cfilter%20id='n'%3E%3CfeTurbulence%20type='fractalNoise'%20baseFrequency='0.9'%20numOctaves='1'%20stitchTiles='stitch'/%3E%3C/filter%3E%3Crect%20width='140'%20height='140'%20filter='url(%23n)'%20opacity='0.3'/%3E%3C/svg%3E)"

// Interstitial: bare game-title card on near-black, auto-advances after ~2.7s (App owns the timer)
export default function PreTitle({ onAdvance }: Props): React.ReactElement {
  return (
    <div onClick={onAdvance} style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden', background: '#12101a', display: 'grid', placeItems: 'center', cursor: 'pointer', userSelect: 'none' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.14, mixBlendMode: 'soft-light', backgroundImage: NOISE }} />
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', mixBlendMode: 'multiply', background: 'radial-gradient(circle at 50% 50%,rgba(0,0,0,0) 40%,rgba(0,0,0,0.5) 100%)' }} />
      <div style={{ position: 'relative', animation: 'pre-jitter 1.5s steps(1,end) both' }}>
        <div style={{ position: 'relative', display: 'inline-block', fontFamily: 'var(--font-ui)', fontWeight: 200, fontSize: 'clamp(20px,2.8vw,36px)', letterSpacing: '0.55em', color: '#ece6da', whiteSpace: 'nowrap', animation: 'pre-in 1.5s steps(1,end) both' }}>
          <span aria-hidden style={{ position: 'absolute', inset: 0, color: 'rgba(255,92,92,0.5)', animation: 'pre-chr1 2.8s steps(1,end) infinite' }}>Issei's Commissions</span>
          <span aria-hidden style={{ position: 'absolute', inset: 0, color: 'rgba(96,205,255,0.45)', animation: 'pre-chr2 2.8s steps(1,end) infinite' }}>Issei's Commissions</span>
          <span style={{ position: 'relative' }}>Issei's Commissions</span>
        </div>
      </div>
    </div>
  )
}

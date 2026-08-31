import React from 'react'
import { ScreenHead, Slot } from '../components/AppFrame'
import { WILL_DRAW, WONT_DRAW } from '../lib/commissions'

export default function About(): React.ReactElement {
  return (
    <div className="screen-in">
      <ScreenHead title="ABOUT" kicker="ARTIST PROFILE — UNIT DESIGNATION: LORAINE" />
      <div style={{ display: 'flex', gap: 56, marginTop: 36, flexWrap: 'wrap' }}>
        <div style={{ flex: 1.1, minWidth: 320, maxWidth: 600 }}>
          <div style={{ display: 'flex', gap: 26, alignItems: 'flex-start' }}>
            <div style={{ width: 140, height: 140, flex: 'none', border: '1px solid rgba(69,65,54,0.4)', padding: 5, background: '#c2bda6' }}>
              <Slot label="artist portrait" />
            </div>
            <div>
              <div style={{ fontWeight: 400, fontSize: 22, letterSpacing: '0.14em' }}>LORAINE</div>
              <div className="mono" style={{ fontSize: 11, letterSpacing: '0.2em', color: 'var(--n-ink-2)', marginTop: 8 }}>DIGITAL ILLUSTRATOR</div>
              <div className="mono" style={{ display: 'flex', gap: 18, marginTop: 18, fontSize: 11, letterSpacing: '0.16em' }}>
                <a href="#" onClick={e => e.preventDefault()}>[ TWITTER/X ]</a>
                <a href="#" onClick={e => e.preventDefault()}>[ INSTAGRAM ]</a>
                <a href="#" onClick={e => e.preventDefault()}>[ VGEN ]</a>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 30, fontWeight: 200, fontSize: 16, lineHeight: 1.9, maxWidth: '56ch' }}>
            <p style={{ margin: '0 0 16px' }}>{'// placeholder bio — replace with Loraine\u2019s own words //'}</p>
            <p style={{ margin: '0 0 16px' }}>Loraine is a digital illustrator focused on character art — expressive portraits, full-body designs, and quiet, atmospheric scenes. Comfortable across original characters, fanart, and tabletop-party commissions.</p>
            <p style={{ margin: 0 }}>Every piece is drawn to order. Delivery is final — no revision rounds — so the intake form asks for everything up front: clear references, palette notes, and the mood you're after.</p>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 300, maxWidth: 520 }}>
          <div className="mono" style={{ fontSize: 11, letterSpacing: '0.3em', color: 'var(--n-ink-2)', marginBottom: 16 }}>COMMISSION RULESET</div>
          <div style={{ border: '1px solid rgba(69,65,54,0.4)', background: 'rgba(69,65,54,0.06)', padding: '24px 26px' }}>
            <div className="mono" style={{ fontSize: 12, letterSpacing: '0.2em', marginBottom: 12 }}>[ WILL DRAW ]</div>
            {WILL_DRAW.map(w => (
              <div key={w} style={{ display: 'flex', gap: 12, alignItems: 'baseline', fontWeight: 200, fontSize: 15, lineHeight: 2 }}>
                <span style={{ width: 7, height: 7, background: 'var(--n-ink)', flex: 'none', transform: 'translateY(-2px)' }} /><span>{w}</span>
              </div>
            ))}
            <div style={{ height: 1, background: 'rgba(69,65,54,0.3)', margin: '18px 0' }} />
            <div className="mono" style={{ fontSize: 12, letterSpacing: '0.2em', marginBottom: 12, color: 'var(--n-red)' }}>[ WON'T DRAW ]</div>
            {WONT_DRAW.map(w => (
              <div key={w} style={{ display: 'flex', gap: 12, alignItems: 'baseline', fontWeight: 200, fontSize: 15, lineHeight: 2, color: '#5d4a42' }}>
                <span style={{ width: 7, height: 7, background: 'var(--n-red)', flex: 'none', transform: 'translateY(-2px)' }} /><span>{w}</span>
              </div>
            ))}
          </div>
          <div className="mono" style={{ fontSize: 10, letterSpacing: '0.16em', color: 'var(--n-ink-2)', marginTop: 12 }}>RULESET IS FINAL — REQUESTS OUTSIDE IT ARE REJECTED AT REVIEW.</div>
        </div>
      </div>
    </div>
  )
}

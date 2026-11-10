import React from 'react'
import { ScreenHead, Slot, type Screen } from '../components/AppFrame'
import { WILL_DRAW, WONT_DRAW } from '../lib/commissions'

type Props = { nav: (s: Screen) => void }

export default function About({ nav }: Props): React.ReactElement {
  return (
    <div className="screen-in">
      <ScreenHead title="ABOUT" sub="Artist Profile" />
      <div className="n-cols" style={{ marginTop: 32 }}>
        <div className="n-col n-panel" style={{ flex: '1.6 1 380px' }}>
          <div className="n-panel-head"><span className="grow">LORAINE</span><small>Digital Illustrator</small></div>
          <div className="n-panel-body">
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ width: 150, height: 150, flex: 'none' }}><Slot label="artist portrait" /></div>
              <div className="n-stack" style={{ flex: '1 1 220px', gap: 8 }}>
                <div className="n-kv"><span>Focus:</span><span>Character art</span></div>
                <div className="n-kv"><span>Payment:</span><span>Ko-fi</span></div>
                <div className="n-kv"><span>Revisions:</span><span>None — final</span></div>
                <div className="n-line" />
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
                  <a className="tag-btn" href="#" onClick={e => e.preventDefault()} style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>Twitter/X</a>
                  <a className="tag-btn" href="#" onClick={e => e.preventDefault()} style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>Instagram</a>
                  <a className="tag-btn" href="#" onClick={e => e.preventDefault()} style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>VGen</a>
                </div>
              </div>
            </div>
            <div className="n-line" />
            <div className="n-text" style={{ maxWidth: '60ch' }}>
              <p style={{ margin: '0 0 12px' }}>{'// placeholder bio — replace with Loraine’s own words //'}</p>
              <p style={{ margin: '0 0 12px' }}>Loraine is a digital illustrator focused on character art — expressive portraits, full-body designs, and quiet, atmospheric scenes. Comfortable across original characters, fanart, and tabletop-party commissions.</p>
              <p style={{ margin: 0 }}>Every piece is drawn to order. Delivery is final — no revision rounds — so the intake form asks for everything up front: clear references, palette notes, and the mood you're after.</p>
            </div>
          </div>
        </div>

        <div className="n-col n-panel" style={{ flex: '1 1 260px' }}>
          <div className="n-panel-head"><span className="sq" aria-hidden />Will Draw</div>
          <div className="n-panel-body">
            <ul className="n-bullets">
              {WILL_DRAW.map(w => <li key={w}><span className="dia" aria-hidden />{w}</li>)}
            </ul>
          </div>
        </div>

        <div className="n-col n-panel" style={{ flex: '1 1 260px' }}>
          <div className="n-panel-head red"><span aria-hidden style={{ width: 14, height: 14, boxSizing: 'border-box', border: '2px solid currentColor' }} />Won't Draw</div>
          <div className="n-panel-body">
            <ul className="n-bullets">
              {WONT_DRAW.map(w => <li key={w}><span aria-hidden style={{ width: 12, height: 2, background: 'var(--n-red)', flex: 'none' }} />{w}</li>)}
            </ul>
            <div className="n-small">The ruleset is final — requests outside it are rejected at review.</div>
            <span className="grow" />
            <button className="btn-solid" onClick={() => nav('request')}><span className="sq" aria-hidden />Start a request</button>
          </div>
        </div>
      </div>
    </div>
  )
}

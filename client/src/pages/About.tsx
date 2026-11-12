import React, { useState } from 'react'
import { ScreenHead, type Screen } from '../components/AppFrame'
import portrait from '../assets/artist_portrait.jpg'
import { WILL_DRAW, WONT_DRAW } from '../lib/commissions'

type Props = { nav: (s: Screen) => void }

const SOCIALS = [
  { label: 'Twitter/X', href: 'https://x.com/isseimx' },
  { label: 'Instagram', href: 'https://www.instagram.com/cudiirl/' },
]

export default function About({ nav }: Props): React.ReactElement {
  const [hot, setHot] = useState<number | null>(null)   // which social link is hovered/focused
  return (
    <div className="screen-in">
      <ScreenHead title="ABOUT" sub="Artist Profile" />
      <div className="n-cols" style={{ marginTop: 32 }}>
        <div className="n-col n-panel" style={{ flex: '1.6 1 380px' }}>
          <div className="n-panel-head"><span className="grow">isseimx</span><small>Digital Artist</small></div>
          <div className="n-panel-body">
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ width: 150, height: 150, flex: 'none', background: 'var(--n-bar)' }}>
                <img src={portrait} alt="Portrait of the artist" width={150} height={150} style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div className="n-stack" style={{ flex: '1 1 220px', gap: 8 }}>
                <div className="n-kv"><span>Focus:</span><span>Character art</span></div>
                <div className="n-kv"><span>Payment:</span><span>Ko-fi</span></div>
                <div className="n-kv"><span>Revisions:</span><span>None, final</span></div>
                <div className="n-line" />
                <div style={{ display: 'flex', gap: '10px 14px', flexWrap: 'wrap', marginTop: 4 }}>
                  {SOCIALS.map((l, i) => (
                    <div key={l.label} className={`cursor-choice${hot === i ? ' on' : ''}`}>
                      <span className="n-cursor" aria-hidden />
                      <a className={`pick-btn${hot === i ? ' on' : ''}`} href={l.href} target="_blank" rel="noopener noreferrer"
                        style={{ minHeight: 44, width: 156, padding: '0 18px', fontSize: 17 }}
                        onMouseEnter={() => setHot(i)} onMouseLeave={() => setHot(null)} onFocus={() => setHot(i)} onBlur={() => setHot(null)}>
                        <span className="sq" aria-hidden />{l.label}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="n-line" />
            <div className="n-text" style={{ maxWidth: '60ch' }}>
              <p style={{ margin: '0 0 12px' }}>hi, i'm isseimx, or riri. i'm a university student studying criminology and working as a barista on the side. i like one piece, dc comics and gummygoo.</p>
              <p style={{ margin: 0 }}>more importantly i like 2 draw. i can draw almost anything for the right price. though i want it to be understood that delivery is FINAL, which means there are no revisions, so i advise you be as specific as possible when sending a commission.</p>
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
            <div className="n-small">The ruleset is final. Requests outside it are rejected at review.</div>
            <span className="grow" />
            <button className="btn-solid" onClick={() => nav('request')}><span className="sq" aria-hidden />Start a request</button>
          </div>
        </div>
      </div>
    </div>
  )
}

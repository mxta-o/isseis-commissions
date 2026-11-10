import React, { useState } from 'react'
import { ScreenHead, type Screen } from '../components/AppFrame'
import Wordmark from '../components/Wordmark'

type Props = { nav: (s: Screen) => void }

const ITEMS: { key: Screen; label: string; desc: string }[] = [
  { key: 'gallery', label: 'GALLERY', desc: 'Archive of completed commissions. A curated record of delivered work.' },
  { key: 'about', label: 'ABOUT', desc: 'Artist profile, style notes, and the commission ruleset — what will and won’t be drawn.' },
  { key: 'request', label: 'COMMISSION REQUEST', desc: 'Submit a new request. Email verification is required before intake is accepted.' },
  { key: 'status', label: 'CHECK STATUS', desc: 'Query any commission by its tracking ID. Cancelled requests show their reason.' },
  { key: 'admin', label: 'ADMIN CONSOLE', desc: 'Restricted. Review queue, active board, and fulfillment controls.' },
]

export default function MainMenu({ nav }: Props): React.ReactElement {
  const [hover, setHover] = useState<Screen | null>(null)
  const hovered = ITEMS.find(i => i.key === hover)

  return (
    <div className="screen-in">
      <ScreenHead title="MENU" sub="Destination Select" />
      <div className="n-cols" style={{ marginTop: 32 }}>
        <nav className="n-col n-gutter" aria-label="Destinations" style={{ flex: '1.15 1 340px' }}>
          <div className="n-stack" style={{ gap: 18, padding: '6px 0' }}>
            {ITEMS.map((it, i) => (
              <button key={it.key} className="n-bar-btn big" style={{ animationDelay: `${i * 70}ms` }}
                onClick={() => nav(it.key)} onMouseEnter={() => setHover(it.key)} onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(it.key)} onBlur={() => setHover(null)}>
                <span className="sq" aria-hidden />
                <span className="grow">{it.label}</span>
                <span className="n-small" aria-hidden>{`0${i + 1}`}</span>
              </button>
            ))}
          </div>
        </nav>
        <div className="n-col n-panel" style={{ minHeight: 360 }}>
          <div className="n-panel-head wide"><span className="sq" aria-hidden />SYSTEM MESSAGE</div>
          <div className="n-panel-body" aria-live="polite">
            <div className="n-big">{hovered ? hovered.label : 'AWAITING INPUT'}</div>
            <div className="n-line" />
            <div className="n-text" style={{ fontSize: 20, minHeight: 104 }}>{hovered ? hovered.desc : 'Select a destination.'}</div>
            <span className="grow" />
            <Wordmark size={44} style={{ alignSelf: 'flex-end', textAlign: 'right', color: '#8f8a76' }} />
          </div>
        </div>
      </div>
    </div>
  )
}

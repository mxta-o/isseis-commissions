import React, { useState } from 'react'
import type { Screen } from '../components/AppFrame'

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
    <div className="screen-in" style={{ display: 'flex', gap: 64, alignItems: 'stretch', flexWrap: 'wrap' }}>
      <div style={{ flex: 1.2, minWidth: 340, maxWidth: 640 }}>
        <div className="mono" style={{ fontSize: 11, letterSpacing: '0.3em', color: 'var(--n-ink-2)', marginBottom: 18 }}>DESTINATION SELECT</div>
        {ITEMS.map((it, i) => (
          <div key={it.key} className="menu-item" style={{ animationDelay: `${i * 70}ms` }}
            onClick={() => nav(it.key)} onMouseEnter={() => setHover(it.key)} onMouseLeave={() => setHover(null)}>
            <span style={{ width: 10, height: 10, background: 'currentColor', flex: 'none' }} />
            <span style={{ fontWeight: 400, fontSize: 19, letterSpacing: '0.32em' }}>{it.label}</span>
            <span style={{ flex: 1 }} />
            <span className="mono" style={{ fontSize: 11, letterSpacing: '0.2em', opacity: 0.55 }}>{`0${i + 1}`}</span>
          </div>
        ))}
      </div>
      <div style={{ flex: 1, minWidth: 300, borderLeft: '1px solid rgba(69,65,54,0.3)', paddingLeft: 40, display: 'flex', flexDirection: 'column' }}>
        <div className="mono" style={{ fontSize: 11, letterSpacing: '0.3em', color: 'var(--n-ink-2)' }}>SYSTEM MESSAGE</div>
        <div style={{ marginTop: 18, fontWeight: 200, fontSize: 17, lineHeight: 1.85, maxWidth: '36ch', minHeight: 110 }}>
          {hovered ? hovered.desc : 'Awaiting input. Select a destination.'}
        </div>
        <div style={{ flex: 1 }} />
      </div>
    </div>
  )
}

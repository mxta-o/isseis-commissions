import React, { useRef, useState } from 'react'
import { ScreenHead, type Screen } from '../components/AppFrame'
import { stepIndex, useArrowKeys } from '../lib/useArrowKeys'

type Props = { nav: (s: Screen) => void }

const ITEMS: { key: Screen; label: string; desc: string }[] = [
  { key: 'gallery', label: 'GALLERY', desc: 'Archive of completed commissions. A curated record of delivered work.' },
  { key: 'about', label: 'ABOUT', desc: 'Artist profile, style notes, and the commission ruleset — what will and won’t be drawn.' },
  { key: 'request', label: 'COMMISSION REQUEST', desc: 'Submit a new request. Email verification is required before intake is accepted.' },
  { key: 'status', label: 'CHECK STATUS', desc: 'Query any commission by its tracking ID. Cancelled requests show their reason.' },
  { key: 'admin', label: 'ADMIN CONSOLE', desc: 'Restricted. Review queue, active board, and fulfillment controls.' },
]

// the small buttons at the foot of the screen; they highlight and talk to the system message like the bars above
const LEGAL: { key: Screen; label: string; desc: string }[] = [
  { key: 'terms', label: 'TERMS', desc: 'The rules for requests, payment, delivery and who owns the finished artwork.' },
  { key: 'privacy', label: 'PRIVACY', desc: 'What this site collects when you request a commission, why, and who handles it.' },
  { key: 'credits', label: 'CREDITS', desc: 'Who designed and built this site, with links to the code and their socials.' },
]
const ALL = [...ITEMS, ...LEGAL]

export default function MainMenu({ nav }: Props): React.ReactElement {
  const [hover, setHover] = useState<Screen | null>(null)
  const hovered = ALL.find(i => i.key === hover)
  const buttons = useRef<(HTMLButtonElement | null)[]>([])

  // arrows move focus (which also drives the system message); Enter then clicks the focused button.
  // up/down walk the five bars and then the small buttons; left/right step along the small buttons
  useArrowKeys(key => {
    // Enter on a focused button already clicks it; this covers a destination picked by mouse hover
    if (key === 'enter' && hover && !(document.activeElement instanceof HTMLButtonElement)) { nav(hover); return true }
    const cur = ALL.findIndex(i => i.key === hover)
    if (key === 'left' || key === 'right') {
      if (cur >= ITEMS.length) buttons.current[ITEMS.length + stepIndex(cur - ITEMS.length, key === 'right' ? 1 : -1, LEGAL.length)]?.focus()
      return
    }
    if (key !== 'up' && key !== 'down') return
    const next = cur < 0 ? (key === 'down' ? 0 : ALL.length - 1) : stepIndex(cur, key === 'down' ? 1 : -1, ALL.length)
    buttons.current[next]?.focus()
  })

  return (
    <div className="screen-in fill-screen">
      <ScreenHead title="MENU" sub="Destination Select" />
      <div className="n-cols center-cols">
        <nav className="n-col n-gutter" aria-label="Destinations" style={{ flex: '1.15 1 340px' }}>
          <div className="n-stack" style={{ gap: 18, padding: '6px 0' }}>
            {ITEMS.map((it, i) => (
              <button key={it.key} ref={el => { buttons.current[i] = el }} className={`n-bar-btn big${hover === it.key ? ' on' : ''}`} style={{ animationDelay: `${i * 70}ms` }}
                onClick={() => nav(it.key)} onMouseEnter={() => setHover(it.key)} onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(it.key)} onBlur={() => setHover(null)}>
                <span className="sq" aria-hidden />
                <span className="grow">{it.label}</span>
                <span className="n-small" aria-hidden>{`0${i + 1}`}</span>
              </button>
            ))}
          </div>
        </nav>
        <div className="n-col n-panel menu-panel" style={{ minHeight: 360 }}>
          <div className="n-panel-head wide"><span className="sq" aria-hidden />SYSTEM MESSAGE</div>
          <div className="n-panel-body" aria-live="polite">
            {/* keyed so it remounts, and replays the swap animation, whenever the destination changes */}
            <div key={hover ?? 'idle'} className="sys-msg">
              <div className="n-big sys-title">{hovered ? hovered.label : 'AWAITING INPUT'}</div>
              <div className="n-line sys-rule" />
              <div className="n-text sys-desc" style={{ fontSize: 20, minHeight: 104 }}>{hovered ? hovered.desc : 'Select a destination.'}</div>
            </div>
          </div>
        </div>
      </div>
      {/* the legal pages have no tab row on this screen, so they get their own small buttons above the hint bar */}
      <div className="menu-legal">
        {LEGAL.map((it, j) => {
          const i = ITEMS.length + j
          return (
            <button key={it.key} ref={el => { buttons.current[i] = el }} className={`n-bar-btn big compact${hover === it.key ? ' on' : ''}`} style={{ animationDelay: `${i * 70}ms` }}
              onClick={() => nav(it.key)} onMouseEnter={() => setHover(it.key)} onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(it.key)} onBlur={() => setHover(null)}>
              <span className="sq" aria-hidden />{it.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

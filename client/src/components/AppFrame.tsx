import React from 'react'

export type Screen = 'menu' | 'gallery' | 'about' | 'request' | 'status' | 'admin'

type Props = {
  screen: Screen
  onMenu: () => void
  children: React.ReactNode
}

const TITLES: Record<Screen, string> = {
  menu: 'MAIN MENU', gallery: 'GALLERY', about: 'ABOUT',
  request: 'COMMISSION REQUEST', status: 'CHECK STATUS', admin: 'ADMIN CONSOLE',
}

// Beige in-app chrome: header strip, rule, footer hint bar
export default function AppFrame({ screen, onMenu, children }: Props): React.ReactElement {
  return (
    <div className="nier-app">
      <div className="nier-grid" />
      <div className="nier-scan" />

      <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: 20, padding: '22px 48px 14px', flexWrap: 'wrap' }}>
        <span style={{ width: 10, height: 10, background: 'var(--n-ink)', display: 'inline-block', flex: 'none' }} />
        <span className="mono" style={{ fontSize: 13, letterSpacing: '0.32em' }}>ISSEI'S COMMS</span>
        <span className="mono" style={{ fontSize: 11, letterSpacing: '0.22em', color: 'var(--n-ink-2)' }}>{'// ' + TITLES[screen]}</span>
        <span style={{ flex: 1 }} />
        <span className="mono" style={{ fontSize: 11, letterSpacing: '0.2em', color: 'var(--n-ink-2)' }}>LINK: STABLE</span>
        <span className="mono" style={{ fontSize: 11, letterSpacing: '0.2em', color: 'var(--n-ink-2)' }}>2026-07-20</span>
      </div>
      <div style={{ position: 'relative', zIndex: 2, margin: '0 48px', height: 2, background: 'linear-gradient(90deg,var(--n-ink) 0%,var(--n-ink) 34%,rgba(69,65,54,0.18) 100%)' }} />

      <div style={{ position: 'relative', zIndex: 2, flex: 1, padding: '36px 48px 28px' }}>{children}</div>

      <div className="mono" style={{ position: 'relative', zIndex: 2, display: 'flex', gap: 28, padding: '14px 48px 20px', borderTop: '1px solid rgba(69,65,54,0.35)', fontSize: 11, letterSpacing: '0.2em', color: 'var(--n-ink-2)', flexWrap: 'wrap' }}>
        <span className="hint-link" onClick={onMenu}>[ESC] MAIN MENU</span>
        <span>[CLICK] SELECT</span>
        <span style={{ flex: 1 }} />
        <span>PROTOTYPE v0.2 — SIMULATED DATA</span>
      </div>
    </div>
  )
}

// Shared screen header: square bullet + tracked title + typing kicker
export function ScreenHead({ title, kicker }: { title: string; kicker: string }): React.ReactElement {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <span style={{ width: 12, height: 12, background: 'var(--n-ink)', flex: 'none' }} />
        <h1 style={{ margin: 0, fontWeight: 200, fontSize: 34, letterSpacing: '0.38em' }}>{title}</h1>
      </div>
      <div className="kicker">{kicker}</div>
    </>
  )
}

// Placeholder image well (replace with real <img> / upload previews)
export function Slot({ label }: { label: string }): React.ReactElement {
  return <div className="slot">{label}</div>
}

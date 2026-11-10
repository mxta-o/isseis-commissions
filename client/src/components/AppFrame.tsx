import React from 'react'

export type Screen = 'menu' | 'gallery' | 'about' | 'request' | 'status' | 'admin'

type Props = {
  screen: Screen
  nav: (s: Screen) => void
  onExit: () => void
  children: React.ReactNode
}

// the section tabs across the top. admin is reached from the menu only, so it has no tab.
const TABS: { key: Screen; label: string }[] = [
  { key: 'gallery', label: 'GALLERY' },
  { key: 'request', label: 'COMMISSION' },
  { key: 'status', label: 'STATUS' },
  { key: 'about', label: 'ABOUT' },
]

// one line of guidance in the footer bar, per screen
const HINTS: Record<Screen, string> = {
  menu: 'Select a destination.',
  gallery: 'Select a work to view it.',
  about: 'Who’s drawing, and what they will and won’t take on.',
  request: 'Choose a type and describe what you’d like drawn.',
  status: 'Enter a tracking ID to see where a commission stands.',
  admin: 'Select an entry to review it.',
}

function Ornament(): React.ReactElement {
  return <div aria-hidden><div className="n-rule" /><div className="n-orn" /></div>
}

// Beige in-app chrome: section tabs, ornament rules, footer hint bar
export default function AppFrame({ screen, nav, onExit, children }: Props): React.ReactElement {
  const onMenu = screen === 'menu'
  return (
    <div className="nier-app">
      <div className="nier-weave" />
      <div className="nier-deco" aria-hidden><i className="arc" /><i className="arc b" /><i className="diag" /><i className="diag b" /></div>
      <div className="nier-vig" />

      <div className="n-shell">
        {!onMenu && (
          <nav className="n-tabs" aria-label="Sections">
            {TABS.map(t => (
              <button key={t.key} className={`n-tab${screen === t.key ? ' on' : ''}`} aria-current={screen === t.key ? 'page' : undefined} onClick={() => nav(t.key)}>
                <span className="sq" aria-hidden />{t.label}
              </button>
            ))}
            <span className="grow" />
            <button className="n-tab narrow" onClick={() => nav('menu')}><span className="sq" aria-hidden />MENU</button>
          </nav>
        )}
        <Ornament />

        <main className="n-body">{children}</main>

        <div className="n-hint">
          <div className="n-hint-msg">{HINTS[screen]}</div>
          <div className="n-keys">
            <span><span className="n-key">ENTER</span>Confirm</span>
            <button onClick={onMenu ? onExit : () => nav('menu')}>
              <span className="n-key">ESC</span>{onMenu ? 'Title Screen' : 'Menu'}
            </button>
          </div>
        </div>
        <Ornament />
      </div>
    </div>
  )
}

// Shared screen header: big tracked title with a quiet "- subtitle" after it
export function ScreenHead({ title, sub }: { title: string; sub: string }): React.ReactElement {
  return <h1 className="n-title">{title}<small>{` - ${sub}`}</small></h1>
}

// Placeholder image well (replace with real <img> / upload previews)
export function Slot({ label }: { label: string }): React.ReactElement {
  return <div className="slot">{label}</div>
}

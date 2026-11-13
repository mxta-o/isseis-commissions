import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import DecodeText from './DecodeText'

export type Screen = 'menu' | 'gallery' | 'about' | 'request' | 'status' | 'admin' | 'terms' | 'privacy' | 'credits'

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

// Terms and Privacy sit on the right of the tab row, next to MENU.
const LEGAL_TABS: { key: Screen; label: string }[] = [
  { key: 'terms', label: 'TERMS' },
  { key: 'privacy', label: 'PRIVACY' },
]

// The footer bar: one line of guidance plus the keys that work on this screen.
// arrows/confirm are omitted on screens where those keys do nothing. back replaces the ESC entry.
export type FooterHint = {
  msg: string
  arrows?: string                  // key-chip text, e.g. '↑↓'
  select?: string                  // what the arrows do (default "Select")
  confirm?: string                 // what Enter does
  back?: { label: string; onClick: () => void }
}

const HINTS: Record<Screen, FooterHint> = {
  menu: { msg: 'Select a destination.', arrows: '↑↓', confirm: 'Confirm' },
  gallery: { msg: 'Choose a category to browse.', arrows: '↑↓', confirm: 'Open' },
  about: { msg: 'Who’s drawing, and what they will and won’t take on.' },
  request: { msg: 'Choose a type and describe what you’d like drawn.', arrows: '↑↓', select: 'Type' },
  status: { msg: 'Enter a tracking ID to see where a commission stands.', confirm: 'Search' },
  admin: { msg: 'Select an entry to review it.' },
  terms: { msg: 'The rules for requests, payment and delivery.' },
  privacy: { msg: 'What this site collects, why, and who handles it.' },
  credits: { msg: 'Who built the site, and where to find them.', arrows: '←→', confirm: 'Open' },
}

const HintContext = createContext<(hint: FooterHint | null) => void>(() => {})

// Lets a page replace its footer hint while it's mounted, e.g. when its controls change by step.
export function useFooterHint(hint: FooterHint): void {
  const set = useContext(HintContext)
  const latest = useRef(hint)
  latest.current = hint
  const key = JSON.stringify(hint)   // functions drop out, so this only changes when the text does
  useEffect(() => { set(latest.current) }, [key, set])
  useEffect(() => () => set(null), [set])
}

function Ornament(): React.ReactElement {
  return <div aria-hidden><div className="n-rule" /><div className="n-orn" /></div>
}

// Beige in-app chrome: section tabs, ornament rules, footer hint bar
export default function AppFrame({ screen, nav, onExit, children }: Props): React.ReactElement {
  const [override, setOverride] = useState<FooterHint | null>(null)
  const strip = useRef<HTMLDivElement>(null)
  const onMenu = screen === 'menu'

  // on a phone the section tabs scroll sideways (MENU stays put beside them): centre the current one when it changes
  useEffect(() => {
    const row = strip.current
    const on = row?.querySelector<HTMLElement>('[aria-current="page"]')
    if (!row || !on || row.scrollWidth <= row.clientWidth) return
    row.scrollLeft += on.getBoundingClientRect().left - row.getBoundingClientRect().left - (row.clientWidth - on.offsetWidth) / 2
  }, [screen])

  const hint = override ?? HINTS[screen]
  const back = hint.back ?? (onMenu ? { label: 'Title Screen', onClick: onExit } : { label: 'Menu', onClick: () => nav('menu') })
  return (
    <div className="nier-app">
      <div className="nier-weave" />
      <div className="nier-deco" aria-hidden><i className="arc" /><i className="arc b" /><i className="diag" /><i className="diag b" /></div>
      <div className="nier-vig" />

      <div className="n-shell">
        {!onMenu && (
          <nav className="n-tabs" aria-label="Sections">
            {/* a plain pass-through on desktop; on a phone it's the part that scrolls */}
            <div ref={strip} className="n-tabs-strip">
              {TABS.map(t => (
                <button key={t.key} className={`n-tab${screen === t.key ? ' on' : ''}`} aria-current={screen === t.key ? 'page' : undefined} onClick={() => nav(t.key)}>
                  <span className="sq" aria-hidden />{t.label}
                </button>
              ))}
              <span className="grow" />
              {LEGAL_TABS.map(t => (
                <button key={t.key} className={`n-tab narrow${screen === t.key ? ' on' : ''}`} aria-current={screen === t.key ? 'page' : undefined} onClick={() => nav(t.key)}>
                  <span className="sq" aria-hidden />{t.label}
                </button>
              ))}
            </div>
            <button className="n-tab n-tab-menu narrow" onClick={() => nav('menu')}><span className="sq" aria-hidden />MENU</button>
          </nav>
        )}
        <Ornament />

        <HintContext.Provider value={setOverride}>
          <main className="n-body">{children}</main>
        </HintContext.Provider>

        <div className="n-hint">
          <div className="n-hint-msg">{hint.msg}</div>
          <div className="n-keys">
            {hint.arrows && <span><span className="n-key">{hint.arrows}</span>{hint.select ?? 'Select'}</span>}
            {hint.confirm && <span><span className="n-key">ENTER</span>{hint.confirm}</span>}
            <button onClick={back.onClick}><span className="n-key">ESC</span>{back.label}</button>
          </div>
        </div>
        <Ornament />
      </div>
    </div>
  )
}

// Shared screen header: big tracked title with a quiet "- subtitle" after it
export function ScreenHead({ title, sub }: { title: string; sub: string }): React.ReactElement {
  // The subheader decodes into place when its screen opens and whenever it changes (a gallery category,
  // a form step, an admin view). Keyed by the text so every change restarts it.
  return <h1 className="n-title">{title}<small><DecodeText key={sub} text={` - ${sub}`} /></small></h1>
}

// Placeholder image well (replace with real <img> / upload previews)
export function Slot({ label }: { label: string }): React.ReactElement {
  return <div className="slot">{label}</div>
}

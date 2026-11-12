import React, { useEffect, useRef, useState } from 'react'
import { ScreenHead, useFooterHint, type Screen } from '../components/AppFrame'
import { CATEGORIES, WORKS, worksIn, type CategoryKey } from '../lib/gallery'
import { usePhone } from '../lib/usePhone'
import { stepIndex, useArrowKeys } from '../lib/useArrowKeys'
import GalleryRoll from './GalleryRoll'

type Props = { nav: (s: Screen) => void }

// the real works, read from src/assets/gallery (see lib/gallery.ts for how folders and filenames map)
const ITEMS = WORKS

// Phones get a camera roll (a grid of thumbnails you tap and swipe through); everything else gets the
// menu-style screen below. Split into two components so each only runs its own hooks and key handlers.
export default function Gallery(props: Props): React.ReactElement {
  return usePhone() ? <GalleryRoll nav={props.nav} /> : <GalleryDesktop nav={props.nav} />
}

// Two steps, like an inventory screen: pick a category first, then browse its works.
// Category step: ↑↓ moves the cursor, Enter/→ (or a click) opens it.
// Works step: ↑↓ walks the list, ←/Esc goes back to the categories.
function GalleryDesktop({ nav }: Props): React.ReactElement {
  const [cursor, setCursor] = useState(0)                     // highlighted category
  const [open, setOpen] = useState<CategoryKey | null>(null)  // opened category, null = still choosing
  const [picked, setPicked] = useState<string>(ITEMS[0]?.n ?? '')
  const list = useRef<HTMLDivElement>(null)

  const shown = open ? worksIn(open) : []
  const sel = shown.find(g => g.n === picked) ?? shown[0]
  const openName = CATEGORIES.find(c => c.key === open)?.name

  const openCategory = (i: number) => {
    const key = CATEGORIES[i].key
    setCursor(i)
    setOpen(key)
    setPicked(worksIn(key)[0]?.n ?? '')
  }
  const close = () => setOpen(null)

  useArrowKeys(key => {
    if (!open) {
      if (key === 'up' || key === 'down') setCursor(i => stepIndex(i, key === 'down' ? 1 : -1, CATEGORIES.length))
      else if (key === 'enter' || key === 'right') { openCategory(cursor); return true }
      return
    }
    if (key === 'up' || key === 'down') {
      const i = shown.findIndex(g => g.n === sel.n)
      setPicked(shown[stepIndex(i, key === 'down' ? 1 : -1, shown.length)].n)
    } else if (key === 'left' || key === 'back') { close(); return true }
  })

  useFooterHint(open
    ? { msg: 'Select a work to view it.', arrows: '↑↓', back: { label: 'Back', onClick: close } }
    : { msg: 'Choose a category to browse.', arrows: '↑↓', confirm: 'Open' })

  // keep the picked row visible inside the scrolling list
  useEffect(() => {
    list.current?.querySelector<HTMLElement>('.n-row.on')?.scrollIntoView({ block: 'nearest' })
  }, [sel?.n, open])

  return (
    <div className="screen-in fill-screen">
      <ScreenHead title="GALLERY" sub={openName ?? 'Categories'} />
      <div className="n-cols center-cols">
        <div className="n-col" style={{ flex: '0.8 1 240px', justifyContent: 'center' }}>
          <div className="n-gutter n-stack" role="radiogroup" aria-label="Category" style={{ padding: '4px 0 4px 16px' }}>
            {CATEGORIES.map((c, i) => {
              // while choosing: the cursor gets the full highlight; once open: the opened one stays marked
              const state = open ? (c.key === open ? ' picked' : '') : (i === cursor ? ' on' : '')
              return (
                <button key={c.key} role="radio" aria-checked={c.key === open} className={`n-bar-btn${state}`}
                  onClick={() => openCategory(i)} onMouseEnter={() => { if (!open) setCursor(i) }}>
                  <span className="sq" aria-hidden />{c.name}
                </button>
              )
            })}
          </div>
        </div>

        {/* the works list and detail only appear once a category is open; empty columns hold the layout */}
        <div className="n-col n-gutter" style={{ flex: '1 1 300px', visibility: open ? 'visible' : 'hidden' }}>
          {open && (
            <>
              <div className="n-panel-head soft"><span className="sq" aria-hidden /><span key={open} className="sys-title">{openName}</span></div>
              <div ref={list} className="n-panel" style={{ flex: 1, marginTop: 6, padding: '0 10px 0 38px', maxHeight: 440, overflowY: 'auto' }}>
                {/* keyed by category so the rows cascade in each time one is opened */}
                <div key={open} className="n-list">
                  {shown.map((g, i) => (
                    <button key={g.n} className={`n-row row-in${g.n === sel.n ? ' on' : ''}`} style={{ animationDelay: `${i * 35}ms` }}
                      aria-pressed={g.n === sel.n} onClick={() => setPicked(g.n)}>
                      <span className="dia" aria-hidden />
                      <span className="grow">{g.label}</span>
                      <small>{g.tag}</small>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="n-col n-panel" style={{ flex: '1 1 300px', visibility: open ? 'visible' : 'hidden' }}>
          {open && sel && (
            <>
              {/* keyed by the picked work so its header, image and notes replay the swap animation */}
              <div className="n-panel-head">
                <span key={sel.n} className="sys-title" style={{ display: 'flex', flex: 1, alignItems: 'center' }}><span className="grow">{sel.label}</span><small>{sel.tag}</small></span>
              </div>
              <div className="n-panel-body">
                <div key={sel.n} className="sys-msg">
                  <div className="img-in work-frame"><img src={sel.src} alt={`${sel.label.toLowerCase()}${sel.fan ? ' (fan art)' : ''}`} /></div>
                  {sel.fan && <div className="n-small sys-desc">Fan art only. Characters belong to their owners.</div>}
                  <div className="n-line sys-rule" />
                  <div className="n-kv sys-title"><span>Type:</span><span>{sel.tag}</span></div>
                </div>
                <span className="grow" />
                <button className="btn-solid" onClick={() => nav('request')}><span className="sq" aria-hidden />Request a commission</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

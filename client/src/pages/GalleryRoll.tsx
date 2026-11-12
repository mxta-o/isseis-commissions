import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ScreenHead, type Screen } from '../components/AppFrame'
import { CATEGORIES, worksIn, type CategoryKey, type Work } from '../lib/gallery'
import { useArrowKeys } from '../lib/useArrowKeys'

type Props = { nav: (s: Screen) => void }

// The gallery on a phone: a grid of thumbnails like a photo library. Tap one to open it full screen,
// swipe sideways to move through the works, swipe down (or tap the cross, or use the back gesture) to close.
// Desktop keeps the menu-style screen in Gallery.tsx.
export default function GalleryRoll({ nav }: Props): React.ReactElement {
  const [cat, setCat] = useState<CategoryKey>('ALL')
  const [viewing, setViewing] = useState<number | null>(null)   // index into `shown` of the open work
  const shown = useMemo(() => worksIn(cat), [cat])

  // The open viewer owns one history entry, so the phone's back gesture closes it instead of leaving the gallery.
  // Closing goes through history.back() so that entry is always removed; the popstate below does the actual closing.
  const pushed = useRef(false)
  const toRequest = useRef(false)   // leave for the request page once that entry has been popped
  const cells = useRef<(HTMLButtonElement | null)[]>([])
  const lastOpened = useRef(0)

  useEffect(() => {
    const onPop = () => {
      if (!pushed.current) return
      pushed.current = false
      setViewing(null)
      if (toRequest.current) {
        toRequest.current = false
        // after App's own popstate handler has run, so the screen change below is the last word
        window.setTimeout(() => nav('request'), 0)
      } else {
        cells.current[lastOpened.current]?.focus({ preventScroll: true })
      }
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [nav])

  const openAt = (i: number) => {
    lastOpened.current = i
    setViewing(i)
    if (!pushed.current) {
      window.history.pushState({ roll: true }, '')
      pushed.current = true
    }
  }
  const close = () => {
    if (pushed.current) window.history.back()
    else setViewing(null)
  }
  const request = () => {
    if (pushed.current) {
      toRequest.current = true
      window.history.back()
    } else nav('request')
  }

  const name = CATEGORIES.find(c => c.key === cat)?.name ?? ''
  return (
    <div className="screen-in">
      <ScreenHead title="GALLERY" sub={name} />
      <div className="roll-filters" role="radiogroup" aria-label="Category">
        {CATEGORIES.map(c => (
          <button key={c.key} role="radio" aria-checked={c.key === cat} className={`tag-btn${c.key === cat ? ' on' : ''}`} onClick={() => setCat(c.key)}>{c.key === 'ALL' ? 'All' : c.name}</button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="n-text">Nothing here yet.</div>
      ) : (
        <div className="roll-grid">
          {shown.map((w, i) => (
            <button key={w.n} ref={el => { cells.current[i] = el }} className="roll-cell" onClick={() => openAt(i)}
              aria-label={`${w.label.toLowerCase()}${w.fan ? ' (fan art)' : ''}`}>
              <img src={w.src} alt="" loading="lazy" decoding="async" draggable={false} />
            </button>
          ))}
        </div>
      )}

      {viewing !== null && createPortal(<Viewer works={shown} start={viewing} onClose={close} onRequest={request} />, document.body)}
    </div>
  )
}

type ViewerProps = { works: readonly Work[]; start: number; onClose: () => void; onRequest: () => void }

const SLIDE: Record<number, string> = { [-1]: 'roll-in-prev', 0: '', 1: 'roll-in-next' }

// Full-screen viewer, rendered into <body> so no ancestor's overflow, zoom or transform can clip or move it.
function Viewer({ works, start, onClose, onRequest }: ViewerProps): React.ReactElement {
  const [i, setI] = useState(start)
  const [dir, setDir] = useState<-1 | 0 | 1>(0)   // which way the last step went, for the slide-in
  const [drag, setDrag] = useState(0)             // finger offset while swiping, in px
  const touch = useRef<{ x: number; y: number } | null>(null)
  const closeBtn = useRef<HTMLButtonElement>(null)
  const work = works[i]

  const step = (d: -1 | 1) => {
    const n = i + d
    if (n < 0 || n >= works.length) return
    setDir(d)
    setI(n)
  }

  // keyboard (a paired keyboard, or a narrow desktop window): arrows move, Esc closes and doesn't also leave for the menu
  useArrowKeys(key => {
    if (key === 'left') step(-1)
    else if (key === 'right') step(1)
    else if (key === 'back') { onClose(); return true }
  })

  useEffect(() => { closeBtn.current?.focus() }, [])
  // decode the neighbours ahead of time so a swipe never waits on an image
  useEffect(() => {
    for (const w of [works[i - 1], works[i + 1]]) if (w) new Image().src = w.src
  }, [works, i])

  // while the page is pinch-zoomed a swipe means "pan", so leave it to the browser
  const zoomed = () => (window.visualViewport?.scale ?? 1) > 1.05
  const onTouchStart = (e: React.TouchEvent) => {
    touch.current = e.touches.length === 1 && !zoomed() ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null
  }
  const onTouchMove = (e: React.TouchEvent) => {
    const from = touch.current
    if (!from || e.touches.length !== 1) { touch.current = null; setDrag(0); return }
    const dx = e.touches[0].clientX - from.x
    const dy = e.touches[0].clientY - from.y
    setDrag(Math.abs(dx) > Math.abs(dy) ? dx : 0)
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    const from = touch.current
    touch.current = null
    setDrag(0)
    if (!from) return
    const dx = e.changedTouches[0].clientX - from.x
    const dy = e.changedTouches[0].clientY - from.y
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1)
    else if (dy > 90 && dy > Math.abs(dx)) onClose()
  }

  return (
    <div className="roll-viewer" role="dialog" aria-modal="true" aria-label={`${work.label.toLowerCase()}, ${i + 1} of ${works.length}`}>
      <div className="roll-top">
        <div className="roll-title"><span>{work.label}</span><small>{work.tag}</small></div>
        <button ref={closeBtn} className="roll-close" onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden><path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="2" fill="none" /></svg>
        </button>
      </div>

      <div className="roll-stage" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} onTouchCancel={onTouchEnd}>
        <img key={work.n} className={SLIDE[dir]} src={work.src} alt={`${work.label.toLowerCase()}${work.fan ? ' (fan art)' : ''}`} draggable={false}
          style={{ transform: drag ? `translateX(${drag}px)` : undefined, transition: drag ? 'none' : 'transform 180ms ease' }} />
        <button className="roll-nav prev" onClick={() => step(-1)} disabled={i === 0} aria-label="Previous work">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden><path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" fill="none" /></svg>
        </button>
        <button className="roll-nav next" onClick={() => step(1)} disabled={i === works.length - 1} aria-label="Next work">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden><path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" fill="none" /></svg>
        </button>
      </div>

      <div className="roll-bottom">
        <div className="roll-count">{i + 1} / {works.length}</div>
        {work.fan && <div className="roll-fan">Fan art only. Characters belong to their owners.</div>}
        <button className="btn-solid" onClick={onRequest}><span className="sq" aria-hidden />Request a commission</button>
      </div>
    </div>
  )
}

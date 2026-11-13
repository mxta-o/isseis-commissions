import React, { useRef, useState } from 'react'
import { ScreenHead } from '../components/AppFrame'
import { stepIndex, useArrowKeys } from '../lib/useArrowKeys'

// who built the site (the artist's own profile and links live on About)
const LINKS = [
  { label: 'GitHub', href: 'https://github.com/mxta-o/isseis-commissions' },
  { label: 'Portfolio', href: 'https://jaelancruz.dev/' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/jaelan-cruz/' },
  { label: 'Instagram', href: 'https://www.instagram.com/jxelxn.sh/' },
]

export default function Credits(): React.ReactElement {
  const [hot, setHot] = useState<number | null>(null)   // which link is hovered/focused
  const links = useRef<(HTMLAnchorElement | null)[]>([])

  // any arrow steps along the links (they sit in one row, wrapping on narrow screens);
  // Enter on a focused link already opens it, this covers a link picked by mouse hover
  useArrowKeys(key => {
    if (key === 'enter' && hot !== null && !(document.activeElement instanceof HTMLAnchorElement)) { links.current[hot]?.click(); return true }
    if (key === 'enter' || key === 'back') return
    const delta = key === 'right' || key === 'down' ? 1 : -1
    const next = hot === null ? (delta > 0 ? 0 : LINKS.length - 1) : stepIndex(hot, delta, LINKS.length)
    links.current[next]?.focus()
  })
  return (
    <div className="screen-in">
      <ScreenHead title="CREDITS" sub="Site Information" />
      <div className="n-cols" style={{ marginTop: 32, justifyContent: 'center' }}>
        <div className="n-col n-panel" style={{ flex: '1 1 380px', maxWidth: 1120 }}>
          <div className="n-panel-head"><span className="grow">jarlan</span><small>Design &amp; Development</small></div>
          <div className="n-panel-body">
            <div className="n-stack" style={{ gap: 8 }}>
              <div className="n-kv"><span>Artwork:</span><span>isseimx</span></div>
              <div className="n-kv"><span>Site:</span><span>jarlan</span></div>
              <div className="n-kv"><span>Built with:</span><span>React, Node, Express, Supabase</span></div>
            </div>
            <div className="n-line" />
            <div className="n-text" style={{ maxWidth:  '65ch' }}>
              <p style={{ margin: 0 }}>this site was designed and built by jarlan. it is also open-source (w/ MIT license) and its on github if you want to see how it works. :)</p>
            </div>
            <div className="n-line" />
            <div style={{ display: 'flex', gap: '10px 14px', flexWrap: 'wrap', marginTop: 4, paddingLeft: 38 }}>
              {LINKS.map((l, i) => (
                <div key={l.label} className={`cursor-choice${hot === i ? ' on' : ''}`}>
                  <span className="n-cursor" aria-hidden />
                  <a ref={el => { links.current[i] = el }} className={`pick-btn${hot === i ? ' on' : ''}`} href={l.href} target="_blank" rel="noopener noreferrer"
                    style={{ minHeight: 44, width: 156, padding: '0 18px', fontSize: 17 }}
                    onMouseEnter={() => setHot(i)} onMouseLeave={() => setHot(null)} onFocus={() => setHot(i)} onBlur={() => setHot(null)}>
                    <span className="sq" aria-hidden />{l.label}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

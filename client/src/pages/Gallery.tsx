import React, { useState } from 'react'
import { ScreenHead, Slot, type Screen } from '../components/AppFrame'

type Props = { nav: (s: Screen) => void }

const CATEGORIES = [
  { key: 'ALL', name: 'All Works' },
  { key: 'CHARACTER', name: 'Characters' },
  { key: 'SCENE', name: 'Scenes' },
  { key: 'CHIBI', name: 'Chibi' },
] as const
type CategoryKey = (typeof CATEGORIES)[number]['key']
const CYCLE = ['CHARACTER', 'SCENE', 'CHIBI'] as const

// placeholder archive until real works are wired in
const ITEMS = Array.from({ length: 12 }, (_, i) => {
  const n = String(i + 1).padStart(2, '0')
  return { n, label: `ARCHIVE ${n}`, tag: CYCLE[i % 3] }
})

// Three columns, like an inventory screen: category → list → the picked work.
export default function Gallery({ nav }: Props): React.ReactElement {
  const [cat, setCat] = useState<CategoryKey>('ALL')
  const [picked, setPicked] = useState<string>(ITEMS[0].n)

  const shown = cat === 'ALL' ? ITEMS : ITEMS.filter(g => g.tag === cat)
  const sel = shown.find(g => g.n === picked) ?? shown[0]
  const catName = CATEGORIES.find(c => c.key === cat)!.name

  return (
    <div className="screen-in">
      <ScreenHead title="GALLERY" sub={catName} />
      <div className="n-cols" style={{ marginTop: 32 }}>
        <div className="n-col" style={{ flex: '0.8 1 240px', justifyContent: 'center' }}>
          <div className="n-gutter n-stack" role="radiogroup" aria-label="Category" style={{ padding: '4px 0 4px 16px' }}>
            {CATEGORIES.map(c => (
              <button key={c.key} role="radio" aria-checked={cat === c.key} className={`n-bar-btn${cat === c.key ? ' on' : ''}`} onClick={() => setCat(c.key)}>
                <span className="sq" aria-hidden />{c.name}
              </button>
            ))}
          </div>
        </div>

        <div className="n-col n-gutter" style={{ flex: '1 1 300px' }}>
          <div className="n-panel-head soft"><span className="sq" aria-hidden />{catName}</div>
          <div className="n-panel" style={{ flex: 1, marginTop: 6, padding: '0 10px 0 0', maxHeight: 440, overflowY: 'auto' }}>
            <div className="n-list">
              {shown.map(g => (
                <button key={g.n} className={`n-row${g.n === sel.n ? ' on' : ''}`} aria-pressed={g.n === sel.n} onClick={() => setPicked(g.n)}>
                  <span className="dia" aria-hidden />
                  <span className="grow">{g.label}</span>
                  <small>{g.tag}</small>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="n-col n-panel" style={{ flex: '1 1 300px' }}>
          <div className="n-panel-head"><span className="grow">{sel.label}</span><small>{sel.tag}</small></div>
          <div className="n-panel-body">
            <div style={{ aspectRatio: '16/10', maxHeight: 260 }}><Slot label={`artwork ${sel.n}`} /></div>
            <div className="n-text">{'// placeholder — a short note about this piece goes here //'}</div>
            <div className="n-line" />
            <div className="n-kv"><span>Type:</span><span>{sel.tag}</span></div>
            <span className="grow" />
            <button className="btn-solid" onClick={() => nav('request')}><span className="sq" aria-hidden />Request a commission</button>
          </div>
        </div>
      </div>
    </div>
  )
}

import React, { useState } from 'react'
import { ScreenHead, Slot } from '../components/AppFrame'

const TAGS = ['ALL', 'CHARACTER', 'SCENE', 'CHIBI'] as const
const CYCLE = ['CHARACTER', 'SCENE', 'CHIBI']

const ITEMS = Array.from({ length: 12 }, (_, i) => {
  const n = String(i + 1).padStart(2, '0')
  return { n, label: `ARCHIVE ${n}`, tag: CYCLE[i % 3] }
})

export default function Gallery(): React.ReactElement {
  const [tag, setTag] = useState<string>('ALL')
  const shown = tag === 'ALL' ? ITEMS : ITEMS.filter(g => g.tag === tag)

  return (
    <div className="screen-in">
      <ScreenHead title="GALLERY" kicker="ARCHIVE OF COMPLETED COMMISSIONS — CURATED SET" />
      <div style={{ display: 'flex', gap: 12, marginTop: 26, flexWrap: 'wrap' }}>
        {TAGS.map(t => (
          <button key={t} className={`tag-btn${tag === t ? ' on' : ''}`} onClick={() => setTag(t)}>{`[ ${t} ]`}</button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: 24, marginTop: 30 }}>
        {shown.map(g => (
          <div key={g.n} className="screen-in">
            <div style={{ position: 'relative', aspectRatio: '4/5', border: '1px solid rgba(69,65,54,0.4)', background: '#c2bda6', padding: 6 }}>
              <Slot label={`artwork ${g.n}`} />
            </div>
            <div className="mono" style={{ display: 'flex', alignItems: 'center', marginTop: 10, fontSize: 11, letterSpacing: '0.16em' }}>
              <span>{g.label}</span>
              <span style={{ flex: 1, borderBottom: '1px dotted rgba(69,65,54,0.4)', margin: '0 10px' }} />
              <span style={{ color: 'var(--n-ink-2)' }}>{`[${g.tag}]`}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

import React, { useState } from 'react'
import { ScreenHead } from '../components/AppFrame'
import { FLOW, FLOW_NAMES, statusMeta, type Commission } from '../lib/commissions'

type Props = {
  commissions: Commission[]
  prefill?: string
  toast: (msg: string) => void
}

// Real query should call checkCommissionStatus() in lib/api.ts.
export default function CheckStatus({ commissions, prefill, toast }: Props): React.ReactElement {
  const [input, setInput] = useState(prefill ?? '')
  const [resultId, setResultId] = useState<string | null>(null)
  const [error, setError] = useState('')

  function query(q0?: string) {
    const q = (q0 ?? input).trim().toUpperCase()
    if (!q) { setError('ENTER A TRACKING ID.'); setResultId(null); return }
    const c = commissions.find(x => x.id.toUpperCase() === q)
    if (!c) { setError('NO RECORD FOUND FOR THIS ID — CHECK FOR TYPOS.'); setResultId(null); return }
    setError(''); setResultId(c.id)
    if (c.status === 'cancelled') toast('THIS COMMISSION WAS CANCELLED — SEE REASON')
  }

  const res = resultId ? commissions.find(c => c.id === resultId) : null
  const meta = res ? statusMeta(res.status) : null
  const curIdx = res ? FLOW.indexOf(res.status) : -1

  return (
    <div className="screen-in" style={{ maxWidth: 680 }}>
      <ScreenHead title="CHECK STATUS" kicker="QUERY A COMMISSION BY TRACKING ID" />
      <div style={{ display: 'flex', gap: 14, marginTop: 34, flexWrap: 'wrap' }}>
        <input className="field" value={input} onChange={e => setInput(e.target.value)} placeholder="XXXX-XXXX"
          style={{ flex: 1, minWidth: 220, fontSize: 16, letterSpacing: '0.2em', padding: '13px 16px', width: 'auto' }} />
        <button className="btn-solid" style={{ padding: '0 28px' }} onClick={() => query()}><span className="sq" />QUERY</button>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <span className="mono" style={{ fontSize: 10, letterSpacing: '0.18em', color: 'var(--n-ink-2)' }}>SAMPLES:</span>
        {['7C1A-42F0', 'C4D8-1E96', 'D610-4B77'].map(id => (
          <button key={id} className="tag-btn" style={{ fontSize: 10, letterSpacing: '0.14em', padding: '5px 10px', border: '1px dotted rgba(69,65,54,0.5)', color: 'var(--n-ink-3)' }}
            onClick={() => { setInput(id); query(id) }}>{id}</button>
        ))}
      </div>
      {error && <div className="mono" style={{ marginTop: 30, fontSize: 12, letterSpacing: '0.14em', color: 'var(--n-red)' }}>▮ {error}</div>}
      {res && meta && (
        <div className="screen-in" style={{ marginTop: 34, border: '1px solid rgba(69,65,54,0.5)', background: 'rgba(69,65,54,0.06)', padding: '30px 34px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 20, flexWrap: 'wrap' }}>
            <span className="mono" style={{ fontSize: 22, letterSpacing: '0.18em', color: meta.color }}>{meta.label}</span>
            <span style={{ flex: 1 }} />
            <span className="mono" style={{ fontSize: 11, letterSpacing: '0.16em', color: 'var(--n-ink-2)' }}>LAST UPDATE: {res.date}</span>
          </div>
          <div className="mono" style={{ marginTop: 10, fontSize: 11, letterSpacing: '0.16em', color: 'var(--n-ink-2)' }}>ID: {res.id}</div>
          {res.status !== 'cancelled' && (
            <div style={{ display: 'flex', marginTop: 28, flexWrap: 'wrap' }}>
              {FLOW_NAMES.map((name, i) => (
                <div key={name} style={{ flex: 1, minWidth: 90 }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ width: 11, height: 11, flex: 'none', border: '1px solid var(--n-ink)', background: i <= curIdx ? 'var(--n-ink)' : 'transparent' }} />
                    <span style={{ flex: 1, height: 1, background: i < curIdx ? 'var(--n-ink)' : 'rgba(69,65,54,0.3)' }} />
                  </div>
                  <div className="mono" style={{ fontSize: 9, letterSpacing: '0.1em', marginTop: 8, color: i <= curIdx ? 'var(--n-ink)' : '#8d8875' }}>{name}</div>
                </div>
              ))}
            </div>
          )}
          {res.status === 'cancelled' && (
            <div style={{ marginTop: 26, borderLeft: '3px solid var(--n-red)', padding: '14px 18px', background: 'rgba(126,47,40,0.07)' }}>
              <div className="mono" style={{ fontSize: 10, letterSpacing: '0.24em', color: 'var(--n-red)' }}>CANCELLATION REASON</div>
              <div style={{ marginTop: 8, fontWeight: 200, fontSize: 15, lineHeight: 1.8 }}>{res.reason}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

import React, { useState } from 'react'
import { ScreenHead, Slot } from '../components/AppFrame'
import { statusMeta, type Commission } from '../lib/commissions'

type Props = {
  commissions: Commission[]
  patch: (id: string, p: Partial<Commission>) => void
  toast: (msg: string) => void
}

type View = 'queue' | 'active' | 'cancelled'

export default function AdminConsole({ commissions, patch, toast }: Props): React.ReactElement {
  const [view, setView] = useState<View>('queue')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')

  const q = search.trim().toLowerCase()
  const match = (c: Commission) => !q || c.id.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
  const byStatus = (st: Commission['status']) => commissions.filter(c => c.status === st && match(c))

  const nQueue = commissions.filter(c => c.status === 'pending_review').length
  const nActive = commissions.filter(c => ['approved', 'awaiting_payment', 'in_progress'].includes(c.status)).length
  const nCancelled = commissions.filter(c => c.status === 'cancelled').length
  const tabs: { key: View; label: string }[] = [
    { key: 'queue', label: `[ QUEUE · ${nQueue} ]` },
    { key: 'active', label: `[ ACTIVE · ${nActive} ]` },
    { key: 'cancelled', label: `[ CANCELLED · ${nCancelled} ]` },
  ]

  let groups: { header: string; rows: Commission[] }[]
  if (view === 'queue') groups = [{ header: 'PENDING REVIEW — OLDEST FIRST', rows: byStatus('pending_review') }]
  else if (view === 'active') groups = [
    { header: '[ APPROVED ]', rows: byStatus('approved') },
    { header: '[ AWAITING PAYMENT ]', rows: byStatus('awaiting_payment') },
    { header: '[ IN PROGRESS ]', rows: byStatus('in_progress') },
  ].filter(g => g.rows.length)
  else groups = [{ header: 'CANCELLED — READ ONLY LOG', rows: byStatus('cancelled') }]
  const empty = groups.every(g => g.rows.length === 0)

  const sel = selectedId ? commissions.find(c => c.id === selectedId) : null
  const selMeta = sel ? statusMeta(sel.status) : null

  function select(id: string) { setSelectedId(id); setRejecting(false); setReason('') }
  function approve() { patch(sel!.id, { status: 'awaiting_payment' }); toast('APPROVED — STRIPE LINK SENT · 24H WINDOW SET') }
  function complete() { patch(sel!.id, { status: 'completed' }); toast('MARKED COMPLETE — DOWNLOAD LINK EMAILED') }
  function confirmReject() {
    if (!reason.trim()) return toast('REJECTION REQUIRES A REASON')
    patch(sel!.id, { status: 'cancelled', reason: reason.trim() })
    setRejecting(false)
    toast('REQUEST CANCELLED — REQUESTER NOTIFIED')
  }

  return (
    <div className="screen-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
        <span style={{ width: 12, height: 12, background: 'var(--n-ink)', flex: 'none' }} />
        <h1 style={{ margin: 0, fontWeight: 200, fontSize: 34, letterSpacing: '0.38em' }}>ADMIN CONSOLE</h1>
        <span className="mono" style={{ fontSize: 10, letterSpacing: '0.2em', color: 'var(--n-ink-2)', border: '1px dotted rgba(69,65,54,0.5)', padding: '4px 10px' }}>AUTH: SESSION GRANTED — PROTOTYPE</span>
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 26, flexWrap: 'wrap', alignItems: 'center' }}>
        {tabs.map(t => (
          <button key={t.key} className={`tag-btn${view === t.key ? ' on' : ''}`} style={{ fontSize: 12, padding: '10px 20px' }}
            onClick={() => { setView(t.key); setSelectedId(null); setRejecting(false) }}>{t.label}</button>
        ))}
        <span style={{ flex: 1 }} />
        <input className="field" value={search} onChange={e => setSearch(e.target.value)} placeholder="SEARCH ID / EMAIL"
          style={{ width: 240, fontSize: 12, letterSpacing: '0.1em', padding: '10px 14px' }} />
      </div>
      <div style={{ display: 'flex', gap: 44, marginTop: 28, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 340, maxWidth: 560 }}>
          {groups.map(g => (
            <div key={g.header} style={{ marginBottom: 22 }}>
              <div className="mono" style={{ fontSize: 10, letterSpacing: '0.26em', color: 'var(--n-ink-2)', marginBottom: 10 }}>{g.header}</div>
              {g.rows.map(c => {
                const st = statusMeta(c.status)
                const on = c.id === selectedId
                return (
                  <div key={c.id} className={`admin-row${on ? ' on' : ''}`} onClick={() => select(c.id)}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
                      <span style={{ fontWeight: 400, fontSize: 15, letterSpacing: '0.04em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{c.title}</span>
                      <span className="mono" style={{ fontSize: 9, letterSpacing: '0.1em', color: on ? '#c9c2a0' : st.color, flex: 'none' }}>{st.label}</span>
                    </div>
                    <div className="mono" style={{ fontSize: 10, letterSpacing: '0.12em', opacity: 0.65, marginTop: 5 }}>{`${c.id} · ${c.email} · ${c.date}`}</div>
                  </div>
                )
              })}
            </div>
          ))}
          {empty && <div className="mono" style={{ fontSize: 12, letterSpacing: '0.18em', color: 'var(--n-ink-2)', padding: '30px 0' }}>— NO ENTRIES MATCH —</div>}
        </div>
        <div style={{ flex: 1.3, minWidth: 360, borderLeft: '1px solid rgba(69,65,54,0.3)', paddingLeft: 40 }}>
          {sel && selMeta ? (
            <div className="screen-in">
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 18, flexWrap: 'wrap' }}>
                <span className="mono" style={{ fontSize: 18, letterSpacing: '0.18em', color: selMeta.color }}>{selMeta.label}</span>
                <span style={{ flex: 1 }} />
                <span className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', color: 'var(--n-ink-2)' }}>RECEIVED {sel.date}</span>
              </div>
              <div style={{ marginTop: 20, fontWeight: 400, fontSize: 24, letterSpacing: '0.06em', lineHeight: 1.4 }}>{sel.title}</div>
              <div className="mono" style={{ display: 'flex', gap: 26, marginTop: 12, fontSize: 11, letterSpacing: '0.12em', color: 'var(--n-ink-2)', flexWrap: 'wrap' }}>
                <span>ID: {sel.id}</span><span>{sel.email}</span>
              </div>
              <div style={{ marginTop: 20, fontWeight: 200, fontSize: 15, lineHeight: 1.9, maxWidth: '56ch' }}>{sel.desc}</div>
              {sel.refs > 0 && (
                <div style={{ marginTop: 26 }}>
                  <div className="mono" style={{ fontSize: 10, letterSpacing: '0.26em', color: 'var(--n-ink-2)', marginBottom: 10 }}>REFERENCE FILES</div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {Array.from({ length: sel.refs }, (_, i) => (
                      <div key={i} style={{ width: 120, height: 120, border: '1px solid rgba(69,65,54,0.4)', padding: 4, background: '#c2bda6' }}>
                        <Slot label={`ref ${i + 1}`} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {sel.status === 'pending_review' && (
                <>
                  <div style={{ display: 'flex', gap: 16, marginTop: 32, flexWrap: 'wrap' }}>
                    <button className="btn-solid" style={{ padding: '14px 26px' }} onClick={approve}><span className="sq" />APPROVE</button>
                    <button className="btn-danger-ghost" onClick={() => setRejecting(true)}>REJECT</button>
                  </div>
                  {rejecting && (
                    <div className="screen-in" style={{ marginTop: 22, borderLeft: '3px solid var(--n-red)', padding: '16px 20px', background: 'rgba(126,47,40,0.07)' }}>
                      <div className="mono" style={{ fontSize: 10, letterSpacing: '0.24em', color: 'var(--n-red)', marginBottom: 10 }}>REJECTION REASON — REQUIRED, SHOWN TO REQUESTER</div>
                      <textarea className="field" value={reason} onChange={e => setReason(e.target.value)} rows={3}
                        style={{ resize: 'vertical', fontSize: 13, lineHeight: 1.7, padding: '11px 13px' }}
                        placeholder="e.g. Request conflicts with the commission ruleset." />
                      <button className="btn-danger" style={{ marginTop: 12 }} onClick={confirmReject}>CONFIRM REJECTION</button>
                    </div>
                  )}
                </>
              )}
              {sel.status === 'awaiting_payment' && (
                <div className="mono" style={{ marginTop: 30, fontSize: 12, letterSpacing: '0.16em', color: 'var(--n-ink-3)', border: '1px dotted rgba(69,65,54,0.5)', padding: '16px 20px' }}>STRIPE LINK SENT — PAYMENT WINDOW EXPIRES IN 19:42:07</div>
              )}
              {sel.status === 'in_progress' && (
                <div style={{ marginTop: 30 }}>
                  <div className="mono" style={{ fontSize: 10, letterSpacing: '0.26em', color: 'var(--n-ink-2)', marginBottom: 10 }}>FINAL DELIVERABLE</div>
                  <div style={{ width: 180, height: 140, border: '1px dashed rgba(69,65,54,0.5)', padding: 4, background: 'rgba(69,65,54,0.05)' }}>
                    <Slot label="upload final" />
                  </div>
                  <button className="btn-solid" style={{ marginTop: 20, padding: '14px 26px' }} onClick={complete}><span className="sq" />MARK COMPLETE</button>
                </div>
              )}
              {sel.status === 'completed' && (
                <div className="mono" style={{ marginTop: 30, fontSize: 12, letterSpacing: '0.16em', color: 'var(--n-ink-3)', border: '1px dotted rgba(69,65,54,0.5)', padding: '16px 20px' }}>DELIVERABLE DOWNLOAD LINK EMAILED TO REQUESTER.</div>
              )}
              {sel.status === 'cancelled' && (
                <div style={{ marginTop: 30, borderLeft: '3px solid var(--n-red)', padding: '14px 18px', background: 'rgba(126,47,40,0.07)' }}>
                  <div className="mono" style={{ fontSize: 10, letterSpacing: '0.24em', color: 'var(--n-red)' }}>CANCELLATION REASON — READ ONLY</div>
                  <div style={{ marginTop: 8, fontWeight: 200, fontSize: 15, lineHeight: 1.8 }}>{sel.reason}</div>
                </div>
              )}
            </div>
          ) : (
            <div className="mono" style={{ fontSize: 12, letterSpacing: '0.22em', color: 'var(--n-ink-2)', padding: '40px 0' }}>— SELECT AN ENTRY TO VIEW DETAIL —</div>
          )}
        </div>
      </div>
    </div>
  )
}

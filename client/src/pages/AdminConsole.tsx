import React, { useCallback, useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { ScreenHead } from '../components/AppFrame'
import ConfirmDialog from '../components/ConfirmDialog'
import { TIERS, formatPrice, statusMeta, type Status } from '../lib/commissions'
import { ApiError, admin, type AdminCommission, type AdminCommissionDetail, type AdminFile } from '../lib/api'
import { supabase } from '../lib/supabase'

type Props = {
  toast: (msg: string) => void
}

type View = 'queue' | 'active' | 'completed' | 'cancelled'

const message = (err: unknown) => (err instanceof Error ? err.message : 'Something went wrong.').toUpperCase()
const formatDate = (iso: string) => new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }).toUpperCase()
const formatDay = (iso: string) => new Date(iso).toLocaleDateString('en-CA')
const tierName = (key: string) => TIERS.find(t => t.key === key)?.name ?? key.toUpperCase()

function countdown(deadline: string, now: number): string {
  const ms = new Date(deadline).getTime() - now
  if (ms <= 0) return 'WINDOW CLOSED'
  const h = Math.floor(ms / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  return `${String(h).padStart(2, '0')} H ${String(m).padStart(2, '0')} MIN LEFT`
}

const mono = (size: number, extra: React.CSSProperties = {}): React.CSSProperties => ({ fontSize: size, letterSpacing: '0.2em', ...extra })
const subhead: React.CSSProperties = { fontSize: 10, letterSpacing: '0.26em', color: 'var(--n-ink-2)', marginBottom: 10 }
const note: React.CSSProperties = { marginTop: 30, fontSize: 12, letterSpacing: '0.16em', color: 'var(--n-ink-3)', border: '1px dotted rgba(69,65,54,0.5)', padding: '16px 20px' }
const redPanel: React.CSSProperties = { borderLeft: '3px solid var(--n-red)', padding: '16px 20px', background: 'rgba(126,47,40,0.07)' }

// ── login ────────────────────────────────────────────────────────────────────

function LoginPanel(): React.ReactElement {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function signIn(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setBusy(false)
    // supabase's message is deliberately vague (doesn't say which part was wrong) — keep it that way
    if (error) setError('SIGN-IN FAILED — CHECK YOUR EMAIL AND PASSWORD.')
  }

  return (
    <form className="screen-in" onSubmit={signIn} style={{ maxWidth: 420, marginTop: 34, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div className="mono" style={mono(11, { color: 'var(--n-ink-2)' })}>RESTRICTED — AUTHORIZED PERSONNEL ONLY</div>
      <input className="field" type="email" autoComplete="username" placeholder="EMAIL" value={email} onChange={e => setEmail(e.target.value)} />
      <input className="field" type="password" autoComplete="current-password" placeholder="PASSWORD" value={password} onChange={e => setPassword(e.target.value)} />
      {error && <div className="mono" style={mono(12, { letterSpacing: '0.14em', color: 'var(--n-red)' })}>▮ {error}</div>}
      <div><button className="btn-solid lift" type="submit" disabled={busy || !email || !password}><span className="sq" />{busy ? 'VERIFYING…' : 'SIGN IN'}</button></div>
    </form>
  )
}

// ── images ───────────────────────────────────────────────────────────────────

function Thumbs({ files, onRemove, busy }: { files: AdminFile[]; onRemove?: (f: AdminFile) => void; busy?: boolean }): React.ReactElement {
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      {files.map(f => (
        <div key={f.id} style={{ width: 120, position: 'relative' }}>
          <a href={f.url ?? undefined} target="_blank" rel="noopener noreferrer" title="Open full size"
            style={{ display: 'block', width: 120, height: 120, border: '1px solid rgba(69,65,54,0.4)', padding: 4, background: '#c2bda6', boxSizing: 'border-box' }}>
            {f.url
              ? <img src={f.url} alt={f.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              : <div className="slot">unavailable</div>}
          </a>
          <div className="mono" style={{ display: 'flex', marginTop: 6, fontSize: 10, letterSpacing: '0.12em', color: 'var(--n-ink-2)' }}>
            <span style={{ flex: 1 }}>{f.name}</span>
            {onRemove && <button className="tag-btn" disabled={busy} onClick={() => onRemove(f)} style={{ fontSize: 9, padding: '2px 6px' }}>REMOVE</button>}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── console ──────────────────────────────────────────────────────────────────

export default function AdminConsole({ toast }: Props): React.ReactElement {
  const [session, setSession] = useState<Session | null | undefined>(undefined) // undefined = still checking
  const [list, setList] = useState<AdminCommission[]>([])
  const [listError, setListError] = useState('')
  const [view, setView] = useState<View>('queue')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<AdminCommissionDetail | null>(null)
  const [busy, setBusy] = useState(false)
  const [price, setPrice] = useState('')
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const [confirm, setConfirm] = useState<{ message: string; run: () => void } | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const fileInput = useRef<HTMLInputElement>(null)

  // session: restored from storage on load, then kept in sync (sign in / out / token refresh)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session), () => setSession(null))
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  // countdowns tick without refetching
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000)
    return () => window.clearInterval(id)
  }, [])

  const loadList = useCallback(async () => {
    try {
      const { commissions } = await admin.list()
      setList(commissions); setListError('')
    } catch (err) {
      setListError(message(err))
    }
  }, [])

  const signedIn = !!session
  useEffect(() => {
    if (signedIn) void loadList()
    else { setList([]); setSelectedId(null); setDetail(null) }
  }, [signedIn, loadList])

  async function select(id: string) {
    setSelectedId(id); setDetail(null); setRejecting(false); setReason('')
    try {
      const d = await admin.get(id)
      setDetail(d)
      // prefill: the saved price if approved already, otherwise the tier's default
      const cents = d.priceCents ?? TIERS.find(t => t.key === d.tier)?.priceCents ?? null
      setPrice(cents == null ? '' : String(cents / 100))
    } catch (err) {
      toast(message(err))
    }
  }

  // runs an action, then refreshes the row in the list and the open detail
  async function act(label: string, fn: () => Promise<AdminCommission>) {
    if (!detail) return
    setBusy(true)
    try {
      const updated = await fn()
      setList(cs => cs.map(c => (c.id === updated.id ? { ...c, ...updated } : c)))
      setDetail(await admin.get(updated.id))
      setRejecting(false); setReason('')
      toast(label)
    } catch (err) {
      toast(message(err))
      // a 409 means someone (or another tab) already changed it: show the real state
      if (err instanceof ApiError && err.status === 409) { void loadList(); void select(detail.id) }
    } finally {
      setBusy(false)
    }
  }

  function approve() {
    const dollars = Number(price)
    if (!Number.isFinite(dollars) || dollars < 5) return toast('ENTER A PRICE OF AT LEAST $5 (KO-FI MINIMUM)')
    const cents = Math.round(dollars * 100)
    void act('APPROVED — PAYMENT DETAILS EMAILED · 24 H WINDOW STARTED', () => admin.approve(detail!.id, cents))
  }

  async function uploadFinals(fileList: FileList | null) {
    if (!detail || !fileList?.length) return
    setBusy(true)
    try {
      for (const file of Array.from(fileList)) {
        const { files } = await admin.uploadFinal(detail.id, file)
        setDetail(d => (d ? { ...d, files } : d))
      }
      toast('FINAL FILES UPLOADED')
    } catch (err) {
      toast(message(err))
    } finally {
      setBusy(false)
    }
  }

  async function removeFinal(file: AdminFile) {
    if (!detail) return
    setBusy(true)
    try {
      const { files } = await admin.deleteFinal(detail.id, file.id)
      setDetail(d => (d ? { ...d, files } : d))
    } catch (err) {
      toast(message(err))
    } finally {
      setBusy(false)
    }
  }

  // ── signed-out / loading states ──
  if (session === undefined) {
    return <div className="screen-in"><ScreenHead title="ADMIN CONSOLE" kicker="CHECKING SESSION…" /></div>
  }
  if (!session) {
    return <div className="screen-in"><ScreenHead title="ADMIN CONSOLE" kicker="AUTHENTICATION REQUIRED" /><LoginPanel /></div>
  }

  // ── list ──
  const q = search.trim().toLowerCase()
  const match = (c: AdminCommission) => !q || c.id.includes(q) || c.ref.toLowerCase().includes(q) || c.email.includes(q) || c.title.toLowerCase().includes(q)
  const byStatus = (st: Status) => list.filter(c => c.status === st && match(c))
  const count = (sts: Status[]) => list.filter(c => sts.includes(c.status)).length

  const tabs: { key: View; label: string }[] = [
    { key: 'queue', label: `[ QUEUE · ${count(['pending_review'])} ]` },
    { key: 'active', label: `[ ACTIVE · ${count(['awaiting_payment', 'in_progress'])} ]` },
    { key: 'completed', label: `[ COMPLETED · ${count(['completed'])} ]` },
    { key: 'cancelled', label: `[ CANCELLED · ${count(['cancelled'])} ]` },
  ]
  let groups: { header: string; rows: AdminCommission[] }[]
  if (view === 'queue') groups = [{ header: 'PENDING REVIEW — OLDEST FIRST', rows: [...byStatus('pending_review')].reverse() }]
  else if (view === 'active') groups = [
    { header: '[ AWAITING PAYMENT ]', rows: byStatus('awaiting_payment') },
    { header: '[ IN PROGRESS ]', rows: byStatus('in_progress') },
  ].filter(g => g.rows.length)
  else if (view === 'completed') groups = [{ header: 'DELIVERED', rows: byStatus('completed') }]
  else groups = [{ header: 'CANCELLED — READ ONLY LOG', rows: byStatus('cancelled') }]
  const empty = groups.every(g => g.rows.length === 0)

  const sel = detail && detail.id === selectedId ? detail : null
  const selMeta = sel ? statusMeta(sel.status) : null

  return (
    <div className="screen-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
        <span style={{ width: 12, height: 12, background: 'var(--n-ink)', flex: 'none' }} />
        <h1 style={{ margin: 0, fontWeight: 200, fontSize: 34, letterSpacing: '0.38em' }}>ADMIN CONSOLE</h1>
        <span className="mono" style={{ fontSize: 10, letterSpacing: '0.2em', color: 'var(--n-ink-2)', border: '1px dotted rgba(69,65,54,0.5)', padding: '4px 10px' }}>AUTH: {session.user.email?.toUpperCase()}</span>
        <span style={{ flex: 1 }} />
        <button className="tag-btn" onClick={() => void loadList()} style={{ fontSize: 11 }}>[ REFRESH ]</button>
        <button className="tag-btn" onClick={() => void supabase.auth.signOut()} style={{ fontSize: 11 }}>[ SIGN OUT ]</button>
      </div>

      {listError ? (
        <div className="mono" style={{ ...redPanel, marginTop: 30, fontSize: 12, letterSpacing: '0.14em', color: 'var(--n-red)' }}>▮ {listError}</div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 12, marginTop: 26, flexWrap: 'wrap', alignItems: 'center' }}>
            {tabs.map(t => (
              <button key={t.key} className={`tag-btn${view === t.key ? ' on' : ''}`} style={{ fontSize: 12, padding: '10px 20px' }}
                onClick={() => { setView(t.key); setSelectedId(null); setDetail(null) }}>{t.label}</button>
            ))}
            <span style={{ flex: 1 }} />
            <input className="field" value={search} onChange={e => setSearch(e.target.value)} placeholder="SEARCH REF / EMAIL / TITLE"
              style={{ width: 260, fontSize: 12, letterSpacing: '0.1em', padding: '10px 14px' }} />
          </div>

          <div style={{ display: 'flex', gap: 44, marginTop: 28, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 340, maxWidth: 560 }}>
              {groups.map(g => (
                <div key={g.header} style={{ marginBottom: 22 }}>
                  <div className="mono" style={subhead}>{g.header}</div>
                  {g.rows.map(c => {
                    const st = statusMeta(c.status)
                    const on = c.id === selectedId
                    return (
                      <div key={c.id} className={`admin-row${on ? ' on' : ''}`} role="button" tabIndex={0}
                        onClick={() => void select(c.id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); void select(c.id) } }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
                          <span style={{ fontWeight: 400, fontSize: 15, letterSpacing: '0.04em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{c.title}</span>
                          {c.overdue && <span className="mono" style={{ fontSize: 9, letterSpacing: '0.1em', color: on ? '#e7b3ad' : 'var(--n-red)', flex: 'none' }}>[ OVERDUE ]</span>}
                          <span className="mono" style={{ fontSize: 9, letterSpacing: '0.1em', color: on ? '#c9c2a0' : st.color, flex: 'none' }}>{st.label}</span>
                        </div>
                        <div className="mono" style={{ fontSize: 10, letterSpacing: '0.12em', opacity: 0.65, marginTop: 5 }}>{`${c.ref} · ${c.email} · ${formatDay(c.createdAt)}`}</div>
                      </div>
                    )
                  })}
                </div>
              ))}
              {empty && <div className="mono" style={{ fontSize: 12, letterSpacing: '0.18em', color: 'var(--n-ink-2)', padding: '30px 0' }}>— NO ENTRIES {q ? 'MATCH' : 'HERE YET'} —</div>}
            </div>

            <div style={{ flex: 1.3, minWidth: 360, borderLeft: '1px solid rgba(69,65,54,0.3)', paddingLeft: 40 }}>
              {!selectedId && <div className="mono" style={{ fontSize: 12, letterSpacing: '0.22em', color: 'var(--n-ink-2)', padding: '40px 0' }}>— SELECT AN ENTRY TO VIEW DETAIL —</div>}
              {selectedId && !sel && <div className="mono" style={{ fontSize: 12, letterSpacing: '0.22em', color: 'var(--n-ink-2)', padding: '40px 0' }}>LOADING…</div>}
              {sel && selMeta && (
                <div className="screen-in">
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 18, flexWrap: 'wrap' }}>
                    <span className="mono" style={{ fontSize: 18, letterSpacing: '0.18em', color: selMeta.color }}>{selMeta.label}</span>
                    {sel.overdue && <span className="mono" style={{ fontSize: 12, letterSpacing: '0.18em', color: 'var(--n-red)' }}>[ OVERDUE ]</span>}
                    <span style={{ flex: 1 }} />
                    <span className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', color: 'var(--n-ink-2)' }}>RECEIVED {formatDate(sel.createdAt)}</span>
                  </div>
                  <div style={{ marginTop: 20, fontWeight: 400, fontSize: 24, letterSpacing: '0.06em', lineHeight: 1.4 }}>{sel.title}</div>
                  <div className="mono" style={{ display: 'flex', gap: 26, marginTop: 12, fontSize: 11, letterSpacing: '0.12em', color: 'var(--n-ink-2)', flexWrap: 'wrap' }}>
                    <span>REF: {sel.ref}</span><span>{tierName(sel.tier)}</span><span>{sel.email}</span>
                  </div>
                  <div style={{ marginTop: 20, fontWeight: 200, fontSize: 15, lineHeight: 1.9, maxWidth: '56ch', whiteSpace: 'pre-wrap' }}>{sel.description}</div>

                  {sel.files.reference.length > 0 && (
                    <div style={{ marginTop: 26 }}>
                      <div className="mono" style={subhead}>REFERENCE FILES — CLICK TO OPEN FULL SIZE</div>
                      <Thumbs files={sel.files.reference} />
                    </div>
                  )}

                  {sel.status === 'pending_review' && (
                    <div style={{ marginTop: 32 }}>
                      <div className="mono" style={subhead}>PRICE (USD) — SENT TO THE BUYER WITH THE KO-FI LINK</div>
                      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                        <input className="field" inputMode="decimal" value={price} onChange={e => setPrice(e.target.value.replace(/[^\d.]/g, ''))} placeholder="25"
                          style={{ width: 120, fontSize: 16 }} />
                        <button className="btn-solid" style={{ padding: '14px 26px' }} disabled={busy} onClick={approve}><span className="sq" />APPROVE</button>
                        <button className="btn-danger-ghost" disabled={busy} onClick={() => setRejecting(true)}>REJECT</button>
                      </div>
                      {rejecting && (
                        <div className="screen-in" style={{ ...redPanel, marginTop: 22 }}>
                          <div className="mono" style={{ ...subhead, color: 'var(--n-red)' }}>REJECTION REASON — REQUIRED, SHOWN TO REQUESTER</div>
                          <textarea className="field" value={reason} onChange={e => setReason(e.target.value.slice(0, 500))} rows={3}
                            style={{ resize: 'vertical', fontSize: 13, lineHeight: 1.7, padding: '11px 13px' }}
                            placeholder="e.g. Request conflicts with the commission ruleset." />
                          <button className="btn-danger" style={{ marginTop: 12 }} disabled={busy || !reason.trim()}
                            onClick={() => void act('REQUEST REJECTED — REQUESTER NOTIFIED', () => admin.reject(sel.id, reason))}>CONFIRM REJECTION</button>
                        </div>
                      )}
                    </div>
                  )}

                  {sel.status === 'awaiting_payment' && sel.priceCents != null && sel.paymentDeadline && (
                    <div style={{ marginTop: 30, border: '1px dotted rgba(69,65,54,0.5)', padding: '18px 22px' }}>
                      <div className="mono" style={subhead}>EXPECTED KO-FI PAYMENT — MATCH BOTH BEFORE MARKING PAID</div>
                      <div style={{ display: 'flex', gap: 34, flexWrap: 'wrap' }}>
                        <div><div className="mono" style={subhead}>AMOUNT</div><div className="mono" style={mono(22, { letterSpacing: '0.08em' })}>{formatPrice(sel.priceCents)}</div></div>
                        <div><div className="mono" style={subhead}>REF IN MESSAGE</div><div className="mono" style={mono(22)}>{sel.ref}</div></div>
                      </div>
                      <div className="mono" style={{ marginTop: 14, fontSize: 11, letterSpacing: '0.12em', color: sel.overdue ? 'var(--n-red)' : 'var(--n-ink-2)' }}>
                        DUE {formatDate(sel.paymentDeadline)} · {countdown(sel.paymentDeadline, now)}
                      </div>
                      <div style={{ display: 'flex', gap: 16, marginTop: 18, flexWrap: 'wrap' }}>
                        <button className="btn-solid" disabled={busy} onClick={() => setConfirm({
                          message: `Mark as paid? Only do this once Ko-fi shows ${formatPrice(sel.priceCents)} with REF ${sel.ref}. The buyer is told work has started.`,
                          run: () => void act('MARKED PAID — COMMISSION IN PROGRESS', () => admin.markPaid(sel.id)),
                        })}><span className="sq" />MARK PAID</button>
                        {sel.overdue && (
                          <button className="btn-danger-ghost" disabled={busy} onClick={() => setConfirm({
                            message: 'Cancel this commission because the payment window passed? The buyer is emailed and this can\'t be undone.',
                            run: () => void act('CANCELLED — PAYMENT WINDOW EXPIRED', () => admin.expire(sel.id)),
                          })}>EXPIRE</button>
                        )}
                      </div>
                    </div>
                  )}

                  {sel.status === 'in_progress' && (
                    <div style={{ marginTop: 30 }}>
                      <div className="mono" style={subhead}>FINAL DELIVERABLE — JPG/PNG/WEBP · 50 MB EACH</div>
                      {sel.files.final.length > 0 && <Thumbs files={sel.files.final} onRemove={f => void removeFinal(f)} busy={busy} />}
                      <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden
                        onChange={e => { void uploadFinals(e.target.files); e.target.value = '' }} />
                      <div style={{ display: 'flex', gap: 16, marginTop: 18, flexWrap: 'wrap' }}>
                        <button className="btn-ghost" disabled={busy} onClick={() => fileInput.current?.click()}>{busy ? 'WORKING…' : '+ UPLOAD FINAL FILES'}</button>
                        <button className="btn-solid" style={{ padding: '14px 26px' }} disabled={busy || sel.files.final.length === 0} onClick={() => setConfirm({
                          message: `Mark complete? The buyer is emailed a download link for ${sel.files.final.length} file${sel.files.final.length === 1 ? '' : 's'}, and files can't be changed after.`,
                          run: () => void act('MARKED COMPLETE — DOWNLOAD LINK EMAILED', () => admin.complete(sel.id)),
                        })}><span className="sq" />MARK COMPLETE</button>
                      </div>
                    </div>
                  )}

                  {sel.status === 'completed' && (
                    <div style={{ marginTop: 30 }}>
                      <div className="mono" style={subhead}>DELIVERED FILES</div>
                      <Thumbs files={sel.files.final} />
                      <div className="mono" style={note}>DOWNLOAD LINK EMAILED TO REQUESTER.</div>
                    </div>
                  )}

                  {sel.status === 'cancelled' && (
                    <div style={{ ...redPanel, marginTop: 30 }}>
                      <div className="mono" style={{ fontSize: 10, letterSpacing: '0.24em', color: 'var(--n-red)' }}>CANCELLATION REASON — READ ONLY</div>
                      <div style={{ marginTop: 8, fontWeight: 200, fontSize: 15, lineHeight: 1.8 }}>{sel.cancellationReason}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {confirm && (
        <ConfirmDialog message={confirm.message} onCancel={() => setConfirm(null)} onConfirm={() => { const run = confirm.run; setConfirm(null); run() }} />
      )}
    </div>
  )
}

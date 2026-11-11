import React, { useCallback, useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { ScreenHead } from '../components/AppFrame'
import ConfirmDialog from '../components/ConfirmDialog'
import { TIERS, formatPrice, statusMeta, type Status } from '../lib/commissions'
import { ApiError, admin, type AdminCommission, type AdminCommissionDetail, type AdminFile } from '../lib/api'
import { supabase } from '../lib/supabase'
import { looksLikeEmail } from '../lib/validate'

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


// ── login ────────────────────────────────────────────────────────────────────

function LoginPanel(): React.ReactElement {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function signIn(e: React.FormEvent) {
    e.preventDefault()
    // same pattern as the request form: the button always works, and says what's missing
    if (!looksLikeEmail(email.trim())) return setError('A VALID EMAIL IS REQUIRED.')
    if (!password) return setError('PASSWORD IS REQUIRED.')
    setError('')
    setBusy(true)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setBusy(false)
    // supabase's message is deliberately vague (doesn't say which part was wrong) — keep it that way
    if (error) setError('SIGN-IN FAILED. CHECK YOUR EMAIL AND PASSWORD.')
  }

  return (
    <form className="n-panel screen-in" onSubmit={signIn} style={{ maxWidth: 640, margin: '40px auto 0' }}>
      <div className="n-panel-head wide"><span className="sq" aria-hidden />RESTRICTED</div>
      <div className="n-panel-body" style={{ gap: 16 }}>
        <div className="n-text">Authorized personnel only. Sign in to open the review queue.</div>
        <div>
          <div className="n-label"><label htmlFor="al-email">Email</label></div>
          <input id="al-email" className="field" type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div>
          <div className="n-label"><label htmlFor="al-pass">Password</label></div>
          <input id="al-pass" className="field" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        {error && <div className="n-err" role="alert">▮ {error}</div>}
        <div className="n-actions">
          <span className="n-cursor" aria-hidden />
          <button className="btn-solid lift" type="submit" disabled={busy}><span className="sq" aria-hidden />{busy ? 'Verifying…' : 'Sign In'}</button>
        </div>
      </div>
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
    return <div className="screen-in"><ScreenHead title="ADMIN" sub="Checking Session…" /></div>
  }
  if (!session) {
    return <div className="screen-in"><ScreenHead title="ADMIN" sub="Authentication Required" /><LoginPanel /></div>
  }

  // ── list ──
  const q = search.trim().toLowerCase()
  const match = (c: AdminCommission) => !q || c.id.includes(q) || c.ref.toLowerCase().includes(q) || c.email.includes(q) || c.title.toLowerCase().includes(q)
  const byStatus = (st: Status) => list.filter(c => c.status === st && match(c))
  const count = (sts: Status[]) => list.filter(c => sts.includes(c.status)).length

  const tabs: { key: View; label: string; count: number }[] = [
    { key: 'queue', label: 'Queue', count: count(['pending_review']) },
    { key: 'active', label: 'Active', count: count(['awaiting_payment', 'in_progress']) },
    { key: 'completed', label: 'Completed', count: count(['completed']) },
    { key: 'cancelled', label: 'Cancelled', count: count(['cancelled']) },
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

  const plain = (bracketed: string) => bracketed.replace(/^\[\s*|\s*\]$/g, '')
  const viewName = tabs.find(t => t.key === view)?.label ?? ''

  return (
    <div className="screen-in">
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px 12px', flexWrap: 'wrap' }}>
        <ScreenHead title="ADMIN" sub={viewName} />
        <span className="grow" />
        <span className="n-chip" style={{ wordBreak: 'break-all' }}>Auth: {session.user.email}</span>
        <button className="tag-btn" onClick={() => void loadList()}>Refresh</button>
        <button className="tag-btn" onClick={() => void supabase.auth.signOut()}>Sign Out</button>
      </div>

      {listError ? (
        <div className="n-red-box n-err" role="alert" style={{ marginTop: 30 }}>▮ {listError}</div>
      ) : (
        <div className="n-cols" style={{ marginTop: 28 }}>
          {/* left: which pile, and search */}
          <div className="n-col" style={{ flex: '0.7 1 230px' }}>
            <div className="n-gutter n-stack" style={{ flex: 1, padding: '4px 0 4px 16px' }}>
              <div className="n-stack" role="radiogroup" aria-label="View">
                {tabs.map(t => (
                  <button key={t.key} role="radio" aria-checked={view === t.key} className={`n-bar-btn${view === t.key ? ' on' : ''}`}
                    onClick={() => { setView(t.key); setSelectedId(null); setDetail(null) }}>
                    <span className="sq" aria-hidden /><span className="grow">{t.label}</span><span>{t.count}</span>
                  </button>
                ))}
              </div>
              <span className="grow" style={{ minHeight: 12 }} />
              <div>
                <div className="n-label"><label htmlFor="ad-search">Search ref / email / title</label></div>
                <input id="ad-search" className="field" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search" />
              </div>
            </div>
          </div>

          {/* middle: the entries in that pile */}
          <div className="n-col n-gutter" style={{ flex: '1 1 320px', gap: 18 }}>
            {groups.filter(g => g.rows.length > 0).map(g => (
              <div key={g.header}>
                <div className="n-panel-head soft"><span className="sq" aria-hidden />{plain(g.header)}</div>
                <div className="n-panel" style={{ marginTop: 6, paddingRight: 10 }}>
                  <div className="n-list">
                    {g.rows.map(c => {
                      const on = c.id === selectedId
                      return (
                        <button key={c.id} className={`n-row${on ? ' on' : ''}`} aria-pressed={on} onClick={() => void select(c.id)}
                          style={{ flexDirection: 'column', alignItems: 'stretch', gap: 0, minHeight: 64, justifyContent: 'center' }}>
                          <span style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                            <span className="grow" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</span>
                            {c.overdue && <small style={{ color: on ? undefined : 'var(--n-red)', flex: 'none' }}>OVERDUE</small>}
                          </span>
                          <span className="sub" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{`${c.ref} · ${c.email} · ${formatDay(c.createdAt)}`}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            ))}
            {empty && <div className="n-small" style={{ padding: '30px 0' }}>— No entries {q ? 'match' : 'here yet'} —</div>}
          </div>

          {/* right: the picked request and what can be done with it */}
          <div className="n-col n-panel" style={{ flex: '1.3 1 380px' }}>
            {!sel || !selMeta ? (
              <>
                <div className="n-panel-head">Detail</div>
                <div className="n-panel-body"><div className="n-text">{selectedId ? 'Loading…' : 'Select an entry to view its detail.'}</div></div>
              </>
            ) : (
              <>
                <div className="n-panel-head">
                  <span className="grow">{plain(selMeta.label)}{sel.overdue ? ' — Overdue' : ''}</span>
                  <small>Received {formatDate(sel.createdAt)}</small>
                </div>
                <div className="n-panel-body screen-in" key={sel.id}>
                  <div className="n-big" style={{ fontSize: 23, lineHeight: 1.4 }}>{sel.title}</div>
                  <div className="n-small" style={{ wordBreak: 'break-word' }}>Ref: {sel.ref} · {tierName(sel.tier)} · {sel.email}</div>
                  <div className="n-text" style={{ fontSize: 17, whiteSpace: 'pre-wrap' }}>{sel.description}</div>

                  {sel.files.reference.length > 0 && (
                    <div>
                      <div className="n-label"><span>Reference files — click to open full size</span></div>
                      <Thumbs files={sel.files.reference} />
                    </div>
                  )}
                  <div className="n-line" />

                  {sel.status === 'pending_review' && (
                    <>
                      <div>
                        <div className="n-label"><label htmlFor="ad-price">Price (USD) — sent to the buyer with the Ko-fi link</label></div>
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                          <input id="ad-price" className="field" inputMode="decimal" value={price} onChange={e => setPrice(e.target.value.replace(/[^\d.]/g, ''))} placeholder="25" style={{ width: 120 }} />
                          <button className="btn-solid" disabled={busy} onClick={approve}><span className="sq" aria-hidden />Approve</button>
                          <button className="btn-danger-ghost" disabled={busy} onClick={() => setRejecting(true)}>Reject</button>
                        </div>
                      </div>
                      {rejecting && (
                        <div className="n-red-box screen-in">
                          <label htmlFor="ad-reason" className="n-small">Rejection reason — required, shown to the requester</label>
                          <textarea id="ad-reason" className="field" value={reason} onChange={e => setReason(e.target.value.slice(0, 500))} rows={3}
                            style={{ resize: 'vertical', fontSize: 16, lineHeight: 1.6 }} placeholder="e.g. Request conflicts with the commission ruleset." />
                          <div>
                            <button className="btn-danger" disabled={busy || !reason.trim()}
                              onClick={() => void act('REQUEST REJECTED — REQUESTER NOTIFIED', () => admin.reject(sel.id, reason))}>Confirm Rejection</button>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {sel.status === 'awaiting_payment' && sel.priceCents != null && sel.paymentDeadline && (
                    <>
                      <div className="n-small">Expected Ko-fi payment — match both before marking paid</div>
                      <div style={{ display: 'flex', gap: '8px 40px', flexWrap: 'wrap', alignItems: 'baseline' }}>
                        <span>Amount <span className="n-big" style={{ marginLeft: 8 }}>{formatPrice(sel.priceCents)}</span></span>
                        <span>Ref <span className="n-big" style={{ marginLeft: 8, letterSpacing: '0.1em' }}>{sel.ref}</span></span>
                      </div>
                      <div className="n-small" style={{ color: sel.overdue ? 'var(--n-red)' : undefined }}>
                        Due {formatDate(sel.paymentDeadline)} · {countdown(sel.paymentDeadline, now)}
                      </div>
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <button className="btn-solid" disabled={busy} onClick={() => setConfirm({
                          message: `Mark as paid? Only do this once Ko-fi shows ${formatPrice(sel.priceCents)} with REF ${sel.ref}. The buyer is told work has started.`,
                          run: () => void act('MARKED PAID — COMMISSION IN PROGRESS', () => admin.markPaid(sel.id)),
                        })}><span className="sq" aria-hidden />Mark Paid</button>
                        {sel.overdue && (
                          <button className="btn-danger-ghost" disabled={busy} onClick={() => setConfirm({
                            message: 'Cancel this commission because the payment window passed? The buyer is emailed and this can\'t be undone.',
                            run: () => void act('CANCELLED — PAYMENT WINDOW EXPIRED', () => admin.expire(sel.id)),
                          })}>Expire</button>
                        )}
                      </div>
                    </>
                  )}

                  {sel.status === 'in_progress' && (
                    <>
                      <div className="n-small">Final deliverable — JPG / PNG / WEBP · 50 MB each</div>
                      {sel.files.final.length > 0 && <Thumbs files={sel.files.final} onRemove={f => void removeFinal(f)} busy={busy} />}
                      <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden
                        onChange={e => { void uploadFinals(e.target.files); e.target.value = '' }} />
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <button className="btn-ghost" disabled={busy} onClick={() => fileInput.current?.click()}>{busy ? 'Working…' : '+ Upload Final Files'}</button>
                        <button className="btn-solid" disabled={busy || sel.files.final.length === 0} onClick={() => setConfirm({
                          message: `Mark complete? The buyer is emailed a download link for ${sel.files.final.length} file${sel.files.final.length === 1 ? '' : 's'}, and files can't be changed after.`,
                          run: () => void act('MARKED COMPLETE — DOWNLOAD LINK EMAILED', () => admin.complete(sel.id)),
                        })}><span className="sq" aria-hidden />Mark Complete</button>
                      </div>
                    </>
                  )}

                  {sel.status === 'completed' && (
                    <>
                      <div className="n-small">Delivered files</div>
                      <Thumbs files={sel.files.final} />
                      <div className="n-small">Download link emailed to requester.</div>
                    </>
                  )}

                  {sel.status === 'cancelled' && (
                    <div className="n-red-box">
                      <div className="n-small">Cancellation reason — read only</div>
                      <div className="n-text">{sel.cancellationReason}</div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {confirm && (
        <ConfirmDialog message={confirm.message} onCancel={() => setConfirm(null)} onConfirm={() => { const run = confirm.run; setConfirm(null); run() }} />
      )}
    </div>
  )
}

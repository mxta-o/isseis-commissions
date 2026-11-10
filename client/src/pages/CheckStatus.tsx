import React, { useEffect, useRef, useState } from 'react'
import { ScreenHead } from '../components/AppFrame'
import { FLOW, FLOW_NAMES, formatPrice, statusMeta } from '../lib/commissions'
import { getCommissionStatus, getDownloadLinks, type PublicStatus } from '../lib/api'

type Props = {
  prefill?: string
  toast: (msg: string) => void
}

const message = (err: unknown) => (err instanceof Error ? err.message : 'Something went wrong.').toUpperCase()
const formatDate = (iso: string) => new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }).toUpperCase()


// deadline for paying a commission
function timeLeft(deadline: string): string {
  const ms = new Date(deadline).getTime() - Date.now()
  if (ms <= 0) return 'WINDOW HAS PASSED'
  const h = Math.floor(ms / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  return h > 0 ? `${h} H ${m} MIN LEFT` : `${m} MIN LEFT`
}


export default function CheckStatus({ prefill, toast }: Props): React.ReactElement {
  const [input, setInput] = useState(prefill ?? '')
  const [result, setResult] = useState<PublicStatus | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [downloads, setDownloads] = useState<{ name: string; url: string }[] | null>(null)
  const autoQueried = useRef(false)

  async function query(q0?: string) {
    const q = (q0 ?? input).trim()
    if (!q) { setError('ENTER A TRACKING ID.'); setResult(null); return }
    setBusy(true); setDownloads(null)
    try {
      const res = await getCommissionStatus(q)
      setError(''); setResult(res)
      if (res.status === 'cancelled') toast('THIS COMMISSION WAS CANCELLED — SEE REASON')
    } catch (err) {
      setError(message(err)); setResult(null)
    } finally {
      setBusy(false)
    }
  }

  async function fetchDownloads() {
    if (!result) return
    setBusy(true)
    try {
      const { files } = await getDownloadLinks(result.id)
      setDownloads(files)
      if (!files.length) toast('NO FILES FOUND — CONTACT THE ARTIST')
    } catch (err) {
      toast(message(err))
    } finally {
      setBusy(false)
    }
  }

  // Arriving from an email link (?id=…) or the request form: look it up straight away.
  useEffect(() => {
    if (prefill && !autoQueried.current) {
      autoQueried.current = true
      void query(prefill)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill])

  const meta = result ? statusMeta(result.status) : null
  const curIdx = result ? FLOW.indexOf(result.status) : -1

  return (
    <div className="screen-in">
      <ScreenHead title="STATUS" sub="Track a Commission" />
      <div className="n-cols" style={{ marginTop: 28 }}>
        <div className="n-col" style={{ flex: '1.5 1 380px', gap: 22 }}>
          <div>
            <div className="n-label"><label htmlFor="st-id">Tracking ID — from your confirmation email</label></div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <input id="st-id" className="field" value={input} onChange={e => setInput(e.target.value)} placeholder="Tracking ID"
                onKeyDown={e => { if (e.key === 'Enter' && !busy) void query() }}
                style={{ flex: 1, minWidth: 220, width: 'auto', letterSpacing: '0.06em' }} />
              <button className="btn-solid" onClick={() => query()} disabled={busy}><span className="sq" aria-hidden />{busy ? '…' : 'Query'}</button>
            </div>
          </div>

          {error && <div className="n-err" role="alert">▮ {error}</div>}

          {result && meta && (
            <div className="n-panel screen-in">
              <div className="n-panel-head">
                <span className="grow">{meta.publicLabel.replace(/^\[\s*|\s*\]$/g, '')}</span>
                <small>Last update: {formatDate(result.updatedAt)}</small>
              </div>
              <div className="n-panel-body">
                <div className="n-big">{result.title}</div>
                <div className="n-small" style={{ wordBreak: 'break-all' }}>ID: {result.id}</div>

                {result.status !== 'cancelled' && (
                  <>
                    <div className="n-line" />
                    <ol aria-label="Progress" style={{ listStyle: 'none', margin: '14px 0 6px', padding: 0, display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
                      {FLOW_NAMES.map((name, i) => (
                        <li key={name} aria-current={i === curIdx ? 'step' : undefined} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span aria-hidden style={{ width: 20, height: 20, flex: 'none', border: '2px solid var(--n-ink)', background: i <= curIdx ? 'var(--n-ink)' : 'transparent', outline: i === curIdx ? '2px solid var(--n-ink)' : undefined, outlineOffset: 3 }} />
                            {i < FLOW_NAMES.length - 1 && (
                              <span aria-hidden style={{ flex: 1, height: 2, background: i < curIdx ? 'var(--n-ink)' : 'repeating-linear-gradient(90deg,var(--n-ink) 0 4px,transparent 4px 10px)' }} />
                            )}
                          </div>
                          <span className="n-small" style={{ fontWeight: i === curIdx ? 500 : 400, paddingRight: 8 }}>{name}</span>
                        </li>
                      ))}
                    </ol>
                  </>
                )}

                {result.status === 'cancelled' && (
                  <div className="n-red-box" style={{ marginTop: 6 }}>
                    <div className="n-small">Cancellation reason</div>
                    <div className="n-text">{result.cancellationReason}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {result?.payment && (
          <div className="n-col n-panel screen-in" style={{ flex: '1 1 320px' }}>
            <div className="n-panel-head">Payment Due — via Ko-fi</div>
            <div className="n-panel-body">
              <div className="n-kv"><span>Amount:</span><span className="n-big">{formatPrice(result.payment.priceCents)}</span></div>
              <div className="n-kv"><span>Reference:</span><span className="n-big" style={{ letterSpacing: '0.12em' }}>{result.payment.ref}</span></div>
              <div className="n-kv" style={{ flexWrap: 'wrap' }}><span>Due by:</span><span>{formatDate(result.payment.deadline)} · {timeLeft(result.payment.deadline)}</span></div>
              <div className="n-line" />
              <div className="n-text" style={{ fontSize: 17 }}>
                Send exactly {formatPrice(result.payment.priceCents)} on Ko-fi and include <strong style={{ fontWeight: 500 }}>{result.payment.ref}</strong> in the message so the payment can be matched. Your status changes to IN PROGRESS once it's confirmed.
              </div>
              <span className="grow" />
              <a className="btn-solid" href={result.payment.kofiUrl} target="_blank" rel="noopener noreferrer"><span className="sq" aria-hidden />Pay on Ko-fi</a>
            </div>
          </div>
        )}

        {result?.status === 'completed' && (
          <div className="n-col n-panel screen-in" style={{ flex: '1 1 320px' }}>
            <div className="n-panel-head">Final Deliverable</div>
            <div className="n-panel-body">
              {downloads === null ? (
                <div><button className="btn-solid" onClick={fetchDownloads} disabled={busy}><span className="sq" aria-hidden />{busy ? 'Preparing…' : 'Get Download Links'}</button></div>
              ) : (
                <>
                  {downloads.map(f => (
                    <a key={f.url} className="n-row" href={f.url} download={f.name} style={{ padding: '6px 0' }}><span className="dia" aria-hidden />Download {f.name}</a>
                  ))}
                  <div className="n-small">Links expire in 1 hour — come back any time for new ones.</div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

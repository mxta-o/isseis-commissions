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

const panel: React.CSSProperties = { marginTop: 26, borderLeft: '3px solid var(--n-ink)', padding: '16px 20px', background: 'rgba(69,65,54,0.07)' }
const panelHead: React.CSSProperties = { fontSize: 10, letterSpacing: '0.24em', color: 'var(--n-ink-2)' }

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
    <div className="screen-in" style={{ maxWidth: 680 }}>
      <ScreenHead title="CHECK STATUS" kicker="QUERY A COMMISSION BY TRACKING ID" />
      <div style={{ display: 'flex', gap: 14, marginTop: 34, flexWrap: 'wrap' }}>
        <input className="field" value={input} onChange={e => setInput(e.target.value)} placeholder="TRACKING ID (FROM YOUR EMAIL)"
          onKeyDown={e => { if (e.key === 'Enter' && !busy) void query() }}
          style={{ flex: 1, minWidth: 220, fontSize: 14, letterSpacing: '0.08em', padding: '13px 16px', width: 'auto' }} />
        <button className="btn-solid" style={{ padding: '0 28px' }} onClick={() => query()} disabled={busy}><span className="sq" />{busy ? '…' : 'QUERY'}</button>
      </div>
      {error && <div className="mono" style={{ marginTop: 30, fontSize: 12, letterSpacing: '0.14em', color: 'var(--n-red)' }}>▮ {error}</div>}
      {result && meta && (
        <div className="screen-in" style={{ marginTop: 34, border: '1px solid rgba(69,65,54,0.5)', background: 'rgba(69,65,54,0.06)', padding: '30px 34px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 20, flexWrap: 'wrap' }}>
            <span className="mono" style={{ fontSize: 20, letterSpacing: '0.16em', color: meta.color }}>{meta.publicLabel}</span>
            <span style={{ flex: 1 }} />
            <span className="mono" style={{ fontSize: 11, letterSpacing: '0.16em', color: 'var(--n-ink-2)' }}>LAST UPDATE: {formatDate(result.updatedAt)}</span>
          </div>
          <div style={{ marginTop: 14, fontWeight: 400, fontSize: 18, letterSpacing: '0.04em' }}>{result.title}</div>
          <div className="mono" style={{ marginTop: 8, fontSize: 11, letterSpacing: '0.1em', color: 'var(--n-ink-2)', wordBreak: 'break-all' }}>ID: {result.id}</div>

          {result.status !== 'cancelled' && (
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

          {result.payment && (
            <div style={panel}>
              <div className="mono" style={panelHead}>PAYMENT DUE — VIA KO-FI</div>
              <div style={{ display: 'flex', gap: 34, marginTop: 14, flexWrap: 'wrap' }}>
                <div>
                  <div className="mono" style={panelHead}>AMOUNT</div>
                  <div className="mono" style={{ fontSize: 24, letterSpacing: '0.08em', marginTop: 4 }}>{formatPrice(result.payment.priceCents)}</div>
                </div>
                <div>
                  <div className="mono" style={panelHead}>REF — PUT THIS IN YOUR KO-FI MESSAGE</div>
                  <div className="mono" style={{ fontSize: 24, letterSpacing: '0.16em', marginTop: 4 }}>{result.payment.ref}</div>
                </div>
              </div>
              <div className="mono" style={{ marginTop: 14, fontSize: 11, letterSpacing: '0.12em', color: 'var(--n-ink-2)' }}>
                DUE BY {formatDate(result.payment.deadline)} · {timeLeft(result.payment.deadline)}
              </div>
              <div style={{ marginTop: 12, fontWeight: 200, fontSize: 15, lineHeight: 1.8, maxWidth: '54ch' }}>
                Send exactly {formatPrice(result.payment.priceCents)} on Ko-fi and include <span className="mono">{result.payment.ref}</span> in the message so the payment can be matched. Your status changes to IN PROGRESS once it's confirmed.
              </div>
              <a className="btn-solid" href={result.payment.kofiUrl} target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', marginTop: 18, textDecoration: 'none' }}><span className="sq" />PAY ON KO-FI</a>
            </div>
          )}

          {result.status === 'completed' && (
            <div style={panel}>
              <div className="mono" style={panelHead}>FINAL DELIVERABLE</div>
              {downloads === null ? (
                <button className="btn-solid" style={{ marginTop: 14 }} onClick={fetchDownloads} disabled={busy}><span className="sq" />{busy ? 'PREPARING…' : 'GET DOWNLOAD LINKS'}</button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
                  {downloads.map(f => (
                    <a key={f.url} className="mono" href={f.url} download={f.name} style={{ fontSize: 13, letterSpacing: '0.12em', color: 'var(--n-ink)' }}>▮ DOWNLOAD {f.name.toUpperCase()}</a>
                  ))}
                  <div className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', color: 'var(--n-ink-2)' }}>LINKS EXPIRE IN 1 HOUR — COME BACK ANY TIME FOR NEW ONES</div>
                </div>
              )}
            </div>
          )}

          {result.status === 'cancelled' && (
            <div style={{ ...panel, borderLeftColor: 'var(--n-red)', background: 'rgba(126,47,40,0.07)' }}>
              <div className="mono" style={{ ...panelHead, color: 'var(--n-red)' }}>CANCELLATION REASON</div>
              <div style={{ marginTop: 8, fontWeight: 200, fontSize: 15, lineHeight: 1.8 }}>{result.cancellationReason}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

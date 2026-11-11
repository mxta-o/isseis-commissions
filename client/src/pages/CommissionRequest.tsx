import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ScreenHead, Slot } from '../components/AppFrame'
import { TIERS, formatPrice, type Tier } from '../lib/commissions'
import { requestVerificationCode, submitCommission } from '../lib/api'
import { stepIndex, useArrowKeys } from '../lib/useArrowKeys'
import { looksLikeEmail } from '../lib/validate'
import type { Screen } from '../components/AppFrame'

type Props = {
  toast: (msg: string) => void
  nav: (s: Screen, statusPrefill?: string) => void
}

type Step = 'form' | 'verify' | 'done'

const KICKERS: Record<Step, string> = {
  form: 'New Request',
  verify: 'Step 2 of 2 — Email Verification',
  done: 'Request Registered',
}

// Mirrors the server's limits so most mistakes are caught before uploading anything.
const MAX_FILES = 5
const MAX_FILE_BYTES = 10 * 1024 * 1024
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const message = (err: unknown) => (err instanceof Error ? err.message : 'Something went wrong.').toUpperCase()

export default function CommissionRequest({ toast, nav }: Props): React.ReactElement {
  const [step, setStep] = useState<Step>('form')
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [email, setEmail] = useState('')
  const [tier, setTier] = useState<Tier>('sketch')
  const [files, setFiles] = useState<File[]>([])
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [trackingId, setTrackingId] = useState('')
  // One key per form session: every retry of this submission reuses it, so a submit whose
  // response got lost returns the same tracking ID instead of creating a second request.
  const [idempotencyKey] = useState(() => crypto.randomUUID())
  const fileInput = useRef<HTMLInputElement>(null)

  const previews = useMemo(() => files.map(f => URL.createObjectURL(f)), [files])
  useEffect(() => () => previews.forEach(url => URL.revokeObjectURL(url)), [previews])

  function addFiles(list: FileList | null) {
    if (!list) return
    const incoming = Array.from(list)
    const bad = incoming.find(f => !ACCEPTED_TYPES.includes(f.type))
    if (bad) return setError(`"${bad.name}" IS NOT A JPG, PNG OR WEBP IMAGE.`)
    const big = incoming.find(f => f.size > MAX_FILE_BYTES)
    if (big) return setError(`"${big.name}" IS LARGER THAN 10 MB.`)
    if (files.length + incoming.length > MAX_FILES) return setError(`UP TO ${MAX_FILES} REFERENCE FILES.`)
    setError('')
    setFiles(fs => [...fs, ...incoming])
  }

  async function sendCode() {
    const trimmed = email.trim()
    if (!title.trim()) return setError('TITLE IS REQUIRED (MAX 100 CHARS).')
    if (!desc.trim()) return setError('DESCRIPTION IS REQUIRED (MAX 750 CHARS).')
    if (!looksLikeEmail(trimmed)) return setError('A VALID EMAIL IS REQUIRED FOR VERIFICATION.')
    setBusy(true)
    try {
      await requestVerificationCode(trimmed)
      setError(''); setCode(''); setStep('verify')
      toast('VERIFICATION CODE SENT')
    } catch (err) {
      setError(message(err))
    } finally {
      setBusy(false)
    }
  }

  async function resendCode() {
    setBusy(true)
    try {
      await requestVerificationCode(email.trim())
      setError('')
      toast('NEW CODE SENT')
    } catch (err) {
      setError(message(err))
    } finally {
      setBusy(false)
    }
  }

  async function verify() {
    if (!/^\d{6}$/.test(code.trim())) return setError('ENTER THE 6-DIGIT CODE FROM YOUR EMAIL.')
    setBusy(true)
    try {
      const { trackingId: id } = await submitCommission(
        { title: title.trim(), description: desc.trim(), tier, email: email.trim(), code: code.trim(), files },
        idempotencyKey,
      )
      setError(''); setTrackingId(id); setStep('done')
      toast('TRACKING ID ISSUED — CHECK YOUR EMAIL')
    } catch (err) {
      setError(message(err))
    } finally {
      setBusy(false)
    }
  }

  const label = (text: string, htmlFor?: string, count?: string, full?: boolean) => (
    <div className="n-label">
      {htmlFor ? <label htmlFor={htmlFor}>{text}</label> : <span>{text}</span>}
      {count && <span style={{ color: full ? 'var(--n-red)' : undefined }}>{count}</span>}
    </div>
  )
  const picked = TIERS.find(t => t.key === tier) ?? TIERS[0]

  // up/down cycles the commission type (ignored while typing in a field)
  useArrowKeys(key => {
    if (key !== 'up' && key !== 'down') return
    const i = TIERS.findIndex(t => t.key === tier)
    setTier(TIERS[stepIndex(i, key === 'down' ? 1 : -1, TIERS.length)].key)
  }, step === 'form')

  return (
    <div className="screen-in">
      <ScreenHead title="COMMISSION" sub={KICKERS[step]} />

      {step === 'form' && (
        <div className="n-cols" style={{ marginTop: 32 }}>
          {/* left: what kind of piece */}
          <div className="n-col" style={{ flex: '0.8 1 240px' }}>
            <div className="n-gutter n-stack" style={{ flex: 1, padding: '4px 0 4px 16px' }}>
              <div id="tier-label" className="n-small">Commission Type</div>
              <div className="n-stack" role="radiogroup" aria-labelledby="tier-label">
                {TIERS.map(t => (
                  <button key={t.key} type="button" role="radio" aria-checked={tier === t.key} className={`n-bar-btn${tier === t.key ? ' on' : ''}`} onClick={() => setTier(t.key)}>
                    <span className="sq" aria-hidden />{t.name}
                  </button>
                ))}
              </div>
              <span className="grow" />
              <div className="n-small" style={{ lineHeight: 1.7 }}>Prices are confirmed when the request is accepted. Nothing is charged at submission.</div>
            </div>
          </div>

          {/* middle: the request itself */}
          <div className="n-col n-gutter n-stack" style={{ flex: '1.3 1 340px' }}>
            <div>
              {label('Title / Subject', 'rq-title', `${title.length}/100`, title.length >= 100)}
              <input id="rq-title" className="field" value={title} onChange={e => setTitle(e.target.value.slice(0, 100))} placeholder="e.g. Half-body portrait of my OC" />
            </div>
            <div>
              {label('Description', 'rq-desc', `${desc.length}/750`, desc.length >= 750)}
              <textarea id="rq-desc" className="field" value={desc} onChange={e => setDesc(e.target.value.slice(0, 750))} rows={5} style={{ resize: 'vertical', lineHeight: 1.5 }}
                placeholder="Pose, mood, palette, references. Delivery is final, so include everything." />
            </div>
            <div>
              {label('Reference Files — JPG / PNG / WEBP, 10 MB each', undefined, `${files.length}/${MAX_FILES}`)}
              <input ref={fileInput} type="file" accept={ACCEPTED_TYPES.join(',')} multiple hidden
                onChange={e => { addFiles(e.target.files); e.target.value = '' }} />
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {Array.from({ length: MAX_FILES }, (_, i) => {
                  const file = files[i]
                  const slotStyle: React.CSSProperties = { width: 64, height: 64, boxSizing: 'border-box', border: '1px dashed var(--n-ink)', background: 'var(--n-field)', position: 'relative', padding: 0 }
                  if (file) return (
                    <div key={i} style={{ ...slotStyle, borderStyle: 'solid' }}>
                      <img src={previews[i]} alt={file.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      <button type="button" aria-label={`Remove ${file.name}`} onClick={() => setFiles(fs => fs.filter((_, j) => j !== i))}
                        style={{ position: 'absolute', top: -8, right: -8, width: 24, height: 24, border: 'none', background: 'var(--n-ink)', color: 'var(--n-cream)', fontSize: 14, lineHeight: '24px', padding: 0, cursor: 'pointer' }}>×</button>
                    </div>
                  )
                  if (i === files.length) return (
                    <button key={i} type="button" aria-label="Add reference file" onClick={() => fileInput.current?.click()}
                      style={{ ...slotStyle, border: '2px solid var(--n-ink)', background: 'var(--n-panel)', color: 'var(--n-ink)', fontFamily: 'inherit', fontSize: 28, lineHeight: 1, cursor: 'pointer' }}>+</button>
                  )
                  return <span key={i} aria-hidden style={slotStyle} />
                })}
              </div>
            </div>
            <div>
              {label('Email — for verification and your tracking ID', 'rq-email')}
              <input id="rq-email" className="field" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            {error && <div className="n-err" role="alert">▮ {error}</div>}
            <div>
              <button className="btn-solid lift" onClick={sendCode} disabled={busy}><span className="sq" aria-hidden />{busy ? 'Sending…' : 'Request Verification Code'}</button>
            </div>
          </div>

          {/* right: what the picked type means, and the terms */}
          <div className="n-col n-panel" style={{ flex: '0.9 1 280px' }}>
            {/* keyed by tier so the name/detail replay the system-message swap animation on each pick */}
            <div className="n-panel-head">
              <span key={tier} className="sys-title" style={{ display: 'flex', flex: 1, alignItems: 'center' }}>
                <span className="grow">{picked.name}</span><small>{formatPrice(picked.priceCents)}</small>
              </span>
            </div>
            <div className="n-panel-body">
              <div key={tier} className="sys-msg">
                <div className="n-text sys-desc">{picked.detail}</div>
                <div className="n-line sys-rule" />
              </div>
              <ul className="n-bullets n-small" style={{ lineHeight: 1.35 }}>
                {['1 request per email / 30 min', 'Email verification required', 'Pay via Ko-fi only if accepted', 'Payment window: 24 h after acceptance', 'Delivery is final — no revisions'].map(rule => (
                  <li key={rule} style={{ minHeight: 34 }}><span className="sq" aria-hidden style={{ width: 7, height: 7 }} />{rule}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {step === 'verify' && (
        <div className="n-panel screen-in" style={{ maxWidth: 640, margin: '40px auto 0' }}>
          <div className="n-panel-head wide"><span className="sq" aria-hidden />SYSTEM MESSAGE</div>
          <div className="n-panel-body" style={{ gap: 16 }}>
            <div className="n-text">A 6-digit code was sent to <strong style={{ fontWeight: 500, wordBreak: 'break-all' }}>{email.trim()}</strong>. Enter it to submit your request.</div>
            <div>
              {label('Verification code', 'rq-code')}
              <input id="rq-code" className="field" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="······" maxLength={6}
                inputMode="numeric" autoComplete="one-time-code" onKeyDown={e => { if (e.key === 'Enter' && !busy) void verify() }}
                style={{ width: 300, maxWidth: '100%', minHeight: 60, fontSize: 32, letterSpacing: '0.6em', textAlign: 'center', padding: '0 0 0 0.6em' }} />
              <div className="n-small" style={{ marginTop: 8 }}>Code expires in 10 minutes · check spam if it doesn't arrive</div>
            </div>
            {error && <div className="n-err" role="alert">▮ {error}</div>}
            <div className="n-actions">
              <span className="n-cursor" aria-hidden />
              <button className="btn-solid" onClick={verify} disabled={busy}><span className="sq" aria-hidden />{busy ? 'Submitting…' : 'Verify & Submit'}</button>
              <button className="btn-ghost" onClick={resendCode} disabled={busy}><span className="sq" aria-hidden />Resend Code</button>
              <button className="btn-ghost" onClick={() => { setStep('form'); setError('') }} disabled={busy}><span className="sq" aria-hidden />Back</button>
            </div>
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className="n-panel screen-in" style={{ maxWidth: 640, margin: '40px auto 0' }}>
          <div className="n-panel-head wide"><span className="sq" aria-hidden />REQUEST REGISTERED</div>
          <div className="n-panel-body" style={{ gap: 14 }}>
            <div className="n-small">Tracking ID</div>
            <div className="n-big" style={{ wordBreak: 'break-all', fontSize: 22 }}>{trackingId}</div>
            <div>
              <button className="btn-ghost"
                onClick={() => { navigator.clipboard?.writeText(trackingId).then(() => toast('ID COPIED TO CLIPBOARD'), () => toast('COPY FAILED — SELECT THE ID MANUALLY')) }}><span className="sq" aria-hidden />Copy ID</button>
            </div>
            <div className="n-line" />
            <div className="n-text">
              <strong style={{ fontWeight: 500 }}>Save this ID.</strong> It is the only way to check your commission status. A copy has also been emailed to <span style={{ wordBreak: 'break-all' }}>{email.trim()}</span>. If your request is accepted, you'll get another email with the price and how to pay on Ko-fi.
            </div>
            <div className="n-actions">
              <span className="n-cursor" aria-hidden />
              <button className="btn-solid" onClick={() => nav('status', trackingId)}><span className="sq" aria-hidden />Check Status</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

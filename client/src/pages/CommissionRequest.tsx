import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ScreenHead, Slot } from '../components/AppFrame'
import { TIERS, formatPrice, type Tier } from '../lib/commissions'
import { requestVerificationCode, submitCommission } from '../lib/api'
import type { Screen } from '../components/AppFrame'

type Props = {
  toast: (msg: string) => void
  nav: (s: Screen, statusPrefill?: string) => void
}

type Step = 'form' | 'verify' | 'done'

const KICKERS: Record<Step, string> = {
  form: 'INTAKE FORM — ALL FIELDS VETTED AT REVIEW',
  verify: 'STEP 2 OF 2 — EMAIL VERIFICATION',
  done: 'REQUEST REGISTERED — SAVE YOUR TRACKING ID',
}

// Mirrors the server's limits so most mistakes are caught before uploading anything.
const MAX_FILES = 5
const MAX_FILE_BYTES = 10 * 1024 * 1024
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

// Loose shape check only; the server does real validation.
function looksLikeEmail(s: string): boolean {
  const at = s.indexOf('@')
  return at > 0 && s.lastIndexOf('.') > at + 1 && !s.endsWith('.') && !/\s/.test(s)
}

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

  const label = (text: string, count?: string, countColor?: string) => (
    <div className="mono" style={{ display: 'flex', fontSize: 11, letterSpacing: '0.24em', color: 'var(--n-ink-2)', marginBottom: 9 }}>
      <span>{text}</span><span style={{ flex: 1 }} />{count && <span style={{ color: countColor }}>{count}</span>}
    </div>
  )

  return (
    <div className="screen-in">
      <ScreenHead title="COMMISSION REQUEST" kicker={KICKERS[step]} />

      {step === 'form' && (
        <div style={{ display: 'flex', gap: 56, marginTop: 34, flexWrap: 'wrap' }}>
          <div style={{ flex: 1.2, minWidth: 340, maxWidth: 600, display: 'flex', flexDirection: 'column', gap: 26 }}>
            <div>
              {label('TITLE / SUBJECT', `${title.length}/100`, title.length >= 100 ? 'var(--n-red)' : 'var(--n-ink-2)')}
              <input className="field" value={title} onChange={e => setTitle(e.target.value.slice(0, 100))} placeholder="e.g. Half-body portrait of my OC" />
            </div>
            <div>
              {label('DESCRIPTION', `${desc.length}/750`, desc.length >= 750 ? 'var(--n-red)' : 'var(--n-ink-2)')}
              <textarea className="field" value={desc} onChange={e => setDesc(e.target.value.slice(0, 750))} rows={7} style={{ resize: 'vertical', lineHeight: 1.7 }}
                placeholder="Pose, mood, palette, references — delivery is final, so include everything." />
            </div>
            <div>
              {label('REFERENCE FILES — UP TO 5 · 10 MB EACH · JPG/PNG/WEBP', `${files.length}/${MAX_FILES}`)}
              <input ref={fileInput} type="file" accept={ACCEPTED_TYPES.join(',')} multiple hidden
                onChange={e => { addFiles(e.target.files); e.target.value = '' }} />
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {Array.from({ length: MAX_FILES }, (_, i) => {
                  const file = files[i]
                  const slotStyle: React.CSSProperties = { width: 92, height: 92, border: '1px dashed rgba(69,65,54,0.5)', padding: 3, background: 'rgba(69,65,54,0.05)', position: 'relative' }
                  if (file) return (
                    <div key={i} style={{ ...slotStyle, borderStyle: 'solid' }}>
                      <img src={previews[i]} alt={file.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      <button className="mono" aria-label={`Remove ${file.name}`} onClick={() => setFiles(fs => fs.filter((_, j) => j !== i))}
                        style={{ position: 'absolute', top: 3, right: 3, width: 20, height: 20, border: 'none', background: 'var(--n-ink)', color: 'var(--n-cream)', fontSize: 11, lineHeight: '20px', padding: 0, cursor: 'pointer' }}>×</button>
                    </div>
                  )
                  if (i === files.length) return (
                    <button key={i} onClick={() => fileInput.current?.click()} style={{ ...slotStyle, cursor: 'pointer' }}>
                      <Slot label="+ add" />
                    </button>
                  )
                  return <div key={i} style={slotStyle}><Slot label={`ref ${i + 1}`} /></div>
                })}
              </div>
            </div>
            <div>
              {label('EMAIL — FOR VERIFICATION & TRACKING ID')}
              <input className="field" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            {error && <div className="mono" style={{ fontSize: 12, letterSpacing: '0.14em', color: 'var(--n-red)' }}>▮ {error}</div>}
            <div>
              <button className="btn-solid lift" onClick={sendCode} disabled={busy}><span className="sq" />{busy ? 'SENDING…' : 'REQUEST VERIFICATION CODE'}</button>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 300, maxWidth: 460 }}>
            <div id="tier-label" className="mono" style={{ fontSize: 11, letterSpacing: '0.3em', color: 'var(--n-ink-2)', marginBottom: 16 }}>COMMISSION TYPE</div>
            <div role="radiogroup" aria-labelledby="tier-label">
            {TIERS.map(t => {
              const on = tier === t.key
              return (
                <div key={t.key} role="radio" aria-checked={on} tabIndex={0} className={`admin-row${on ? ' on' : ''}`}
                  onClick={() => setTier(t.key)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setTier(t.key) } }}
                  style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', marginBottom: 12, border: '1px solid rgba(69,65,54,0.4)', background: on ? undefined : 'rgba(69,65,54,0.06)' }}>
                  <span style={{ width: 9, height: 9, background: 'currentColor', flex: 'none' }} />
                  <span style={{ flex: 1 }}>
                    <span style={{ display: 'block', fontWeight: 400, fontSize: 16, letterSpacing: '0.18em' }}>{t.name}</span>
                    <span style={{ display: 'block', fontWeight: 200, fontSize: 13, marginTop: 4, opacity: 0.8 }}>{t.detail}</span>
                  </span>
                  <span className="mono" style={{ fontSize: 12, letterSpacing: '0.1em' }}>{formatPrice(t.priceCents)}</span>
                </div>
              )
            })}
            </div>
            <div className="mono" style={{ border: '1px solid rgba(69,65,54,0.4)', background: 'rgba(69,65,54,0.06)', padding: '20px 22px', marginTop: 26, fontSize: 11, letterSpacing: '0.14em', lineHeight: 2.1, color: 'var(--n-ink-3)' }}>
              <div>· 1 REQUEST PER EMAIL / 30 MIN</div>
              <div>· EMAIL VERIFICATION REQUIRED</div>
              <div>· PAY VIA KO-FI ONLY IF ACCEPTED</div>
              <div>· PAYMENT WINDOW: 24 H AFTER ACCEPTANCE</div>
              <div>· DELIVERY IS FINAL — NO REVISIONS</div>
            </div>
          </div>
        </div>
      )}

      {step === 'verify' && (
        <div className="screen-in" style={{ maxWidth: 520, marginTop: 44 }}>
          <div style={{ fontWeight: 200, fontSize: 17, lineHeight: 1.9 }}>
            A 6-digit verification code has been sent to <span className="mono" style={{ fontWeight: 400 }}>{email.trim()}</span>. Enter it below to submit your request.
          </div>
          <div className="mono" style={{ fontSize: 10, letterSpacing: '0.18em', color: 'var(--n-ink-2)', marginTop: 10 }}>CODE EXPIRES IN 10 MINUTES · CHECK SPAM IF IT DOESN'T ARRIVE</div>
          <input className="field" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="······" maxLength={6}
            inputMode="numeric" autoComplete="one-time-code" onKeyDown={e => { if (e.key === 'Enter' && !busy) void verify() }}
            style={{ marginTop: 26, width: 280, fontSize: 30, letterSpacing: '0.6em', textAlign: 'center', padding: '14px 0 14px 0.6em' }} />
          {error && <div className="mono" style={{ fontSize: 12, letterSpacing: '0.14em', color: 'var(--n-red)', marginTop: 14 }}>▮ {error}</div>}
          <div style={{ display: 'flex', gap: 16, marginTop: 30, flexWrap: 'wrap' }}>
            <button className="btn-solid" onClick={verify} disabled={busy}><span className="sq" />{busy ? 'SUBMITTING…' : 'VERIFY & SUBMIT'}</button>
            <button className="btn-ghost" onClick={resendCode} disabled={busy}>RESEND CODE</button>
            <button className="btn-ghost" onClick={() => { setStep('form'); setError('') }} disabled={busy}>BACK</button>
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className="screen-in" style={{ maxWidth: 640, marginTop: 44 }}>
          <div className="mono" style={{ fontSize: 15, letterSpacing: '0.24em' }}>[ REQUEST REGISTERED ]</div>
          <div style={{ marginTop: 26, border: '1px solid rgba(69,65,54,0.5)', background: 'rgba(69,65,54,0.06)', padding: '30px 34px' }}>
            <div className="mono" style={{ fontSize: 11, letterSpacing: '0.28em', color: 'var(--n-ink-2)' }}>TRACKING ID</div>
            <div className="mono" style={{ fontSize: 17, letterSpacing: '0.06em', marginTop: 12, wordBreak: 'break-all' }}>{trackingId}</div>
            <button className="btn-ghost" style={{ marginTop: 20, fontSize: 12, padding: '11px 20px' }}
              onClick={() => { navigator.clipboard?.writeText(trackingId).then(() => toast('ID COPIED TO CLIPBOARD'), () => toast('COPY FAILED — SELECT THE ID MANUALLY')) }}>[ COPY ID ]</button>
          </div>
          <div style={{ marginTop: 22, fontWeight: 200, fontSize: 16, lineHeight: 1.9, maxWidth: '52ch' }}>
            <strong style={{ fontWeight: 600 }}>Save this ID.</strong> It is the only way to check your commission status. A copy has also been emailed to <span className="mono">{email.trim()}</span>. If your request is accepted, you'll get another email with the price and how to pay on Ko-fi.
          </div>
          <button className="btn-solid" style={{ marginTop: 28 }} onClick={() => nav('status', trackingId)}><span className="sq" />CHECK STATUS</button>
        </div>
      )}
    </div>
  )
}

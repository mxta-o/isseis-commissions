import React, { useState } from 'react'
import { ScreenHead, Slot } from '../components/AppFrame'
import { genId, type Commission } from '../lib/commissions'
import type { Screen } from '../components/AppFrame'

type Props = {
  addCommission: (c: Commission) => void
  toast: (msg: string) => void
  nav: (s: Screen, statusPrefill?: string) => void
}

type Step = 'form' | 'verify' | 'done'

const TIERS = [
  { key: 'sketch', name: 'SKETCH', detail: 'Bust · clean lines + flat tone', price: '$ —' },
  { key: 'full', name: 'FULL ILLUSTRATION', detail: 'Full body · fully rendered', price: '$ —' },
  { key: 'scene', name: 'SCENE', detail: '1–2 characters · full background', price: '$ —' },
]

const KICKERS: Record<Step, string> = {
  form: 'INTAKE FORM — ALL FIELDS VETTED AT REVIEW',
  verify: 'STEP 2 OF 2 — EMAIL VERIFICATION',
  done: 'REQUEST REGISTERED — SAVE YOUR TRACKING ID',
}

// Real submit/verify should call createCommission() in lib/api.ts; this mirrors the prototype's simulated flow.
export default function CommissionRequest({ addCommission, toast, nav }: Props): React.ReactElement {
  const [step, setStep] = useState<Step>('form')
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [email, setEmail] = useState('')
  const [tier, setTier] = useState('sketch')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [trackingId, setTrackingId] = useState('')

  function submit() {
    if (!title.trim()) return setError('TITLE IS REQUIRED (MAX 100 CHARS).')
    if (!desc.trim()) return setError('DESCRIPTION IS REQUIRED (MAX 750 CHARS).')
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) return setError('A VALID EMAIL IS REQUIRED FOR VERIFICATION.')
    setError(''); setCode(''); setStep('verify')
    toast('VERIFICATION CODE SENT (SIMULATED)')
  }
  function verify() {
    if (!/^\d{6}$/.test(code.trim())) return setError('ENTER THE 6-DIGIT CODE FROM YOUR EMAIL.')
    const id = genId()
    addCommission({ id, title: title.trim(), email: email.trim(), status: 'pending_review', date: '2026-07-20', desc: desc.trim(), refs: 0 })
    setError(''); setTrackingId(id); setStep('done')
    toast('TRACKING ID ISSUED — EMAIL SENT (SIMULATED)')
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
              {label('REFERENCE FILES — UP TO 5 · 10 MB EACH · JPG/PNG/WEBP')}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <div key={n} style={{ width: 92, height: 92, border: '1px dashed rgba(69,65,54,0.5)', padding: 3, background: 'rgba(69,65,54,0.05)' }}>
                    <Slot label={`ref ${n}`} />
                  </div>
                ))}
              </div>
            </div>
            <div>
              {label('EMAIL — FOR VERIFICATION & TRACKING ID')}
              <input className="field" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            {error && <div className="mono" style={{ fontSize: 12, letterSpacing: '0.14em', color: 'var(--n-red)' }}>▮ {error}</div>}
            <div>
              <button className="btn-solid lift" onClick={submit}><span className="sq" />REQUEST VERIFICATION CODE</button>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 300, maxWidth: 460 }}>
            <div className="mono" style={{ fontSize: 11, letterSpacing: '0.3em', color: 'var(--n-ink-2)', marginBottom: 16 }}>COMMISSION TYPE</div>
            {TIERS.map(t => {
              const on = tier === t.key
              return (
                <div key={t.key} onClick={() => setTier(t.key)} className={`admin-row${on ? ' on' : ''}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', marginBottom: 12, border: '1px solid rgba(69,65,54,0.4)', background: on ? undefined : 'rgba(69,65,54,0.06)' }}>
                  <span style={{ width: 9, height: 9, background: 'currentColor', flex: 'none' }} />
                  <span style={{ flex: 1 }}>
                    <span style={{ display: 'block', fontWeight: 400, fontSize: 16, letterSpacing: '0.18em' }}>{t.name}</span>
                    <span style={{ display: 'block', fontWeight: 200, fontSize: 13, marginTop: 4, opacity: 0.8 }}>{t.detail}</span>
                  </span>
                  <span className="mono" style={{ fontSize: 12, letterSpacing: '0.1em' }}>{t.price}</span>
                </div>
              )
            })}
            <div className="mono" style={{ border: '1px solid rgba(69,65,54,0.4)', background: 'rgba(69,65,54,0.06)', padding: '20px 22px', marginTop: 26, fontSize: 11, letterSpacing: '0.14em', lineHeight: 2.1, color: 'var(--n-ink-3)' }}>
              <div>· 1 REQUEST PER EMAIL / 30 MIN</div>
              <div>· EMAIL VERIFICATION REQUIRED</div>
              <div>· PAYMENT WINDOW: 24 H AFTER APPROVAL</div>
              <div>· DELIVERY IS FINAL — NO REVISIONS</div>
            </div>
          </div>
        </div>
      )}

      {step === 'verify' && (
        <div className="screen-in" style={{ maxWidth: 520, marginTop: 44 }}>
          <div style={{ fontWeight: 200, fontSize: 17, lineHeight: 1.9 }}>
            A 6-digit verification code has been sent to <span className="mono" style={{ fontWeight: 400 }}>{email}</span>. Enter it below to submit your request.
          </div>
          <div className="mono" style={{ fontSize: 10, letterSpacing: '0.18em', color: 'var(--n-ink-2)', marginTop: 10 }}>PROTOTYPE — ANY 6 DIGITS ARE ACCEPTED</div>
          <input className="field" value={code} onChange={e => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))} placeholder="······" maxLength={6}
            style={{ marginTop: 26, width: 280, fontSize: 30, letterSpacing: '0.6em', textAlign: 'center', padding: '14px 0 14px 0.6em' }} />
          {error && <div className="mono" style={{ fontSize: 12, letterSpacing: '0.14em', color: 'var(--n-red)', marginTop: 14 }}>▮ {error}</div>}
          <div style={{ display: 'flex', gap: 16, marginTop: 30, flexWrap: 'wrap' }}>
            <button className="btn-solid" onClick={verify}><span className="sq" />VERIFY &amp; SUBMIT</button>
            <button className="btn-ghost" onClick={() => { setStep('form'); setError('') }}>BACK</button>
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className="screen-in" style={{ maxWidth: 640, marginTop: 44 }}>
          <div className="mono" style={{ fontSize: 15, letterSpacing: '0.24em' }}>[ REQUEST REGISTERED ]</div>
          <div style={{ marginTop: 26, border: '1px solid rgba(69,65,54,0.5)', background: 'rgba(69,65,54,0.06)', padding: '30px 34px' }}>
            <div className="mono" style={{ fontSize: 11, letterSpacing: '0.28em', color: 'var(--n-ink-2)' }}>TRACKING ID</div>
            <div className="mono" style={{ fontSize: 34, letterSpacing: '0.14em', marginTop: 12 }}>{trackingId}</div>
            <button className="btn-ghost" style={{ marginTop: 20, fontSize: 12, padding: '11px 20px' }}
              onClick={() => { try { navigator.clipboard.writeText(trackingId) } catch { } toast('ID COPIED TO CLIPBOARD') }}>[ COPY ID ]</button>
          </div>
          <div style={{ marginTop: 22, fontWeight: 200, fontSize: 16, lineHeight: 1.9, maxWidth: '52ch' }}>
            <strong style={{ fontWeight: 600 }}>Save this ID.</strong> It is the only way to check your commission status. A copy has also been emailed to <span className="mono">{email}</span>, along with next steps once your request is reviewed.
          </div>
          <button className="btn-solid" style={{ marginTop: 28 }} onClick={() => nav('status', trackingId)}><span className="sq" />CHECK STATUS</button>
        </div>
      )}
    </div>
  )
}

import React, { useCallback, useEffect, useRef, useState } from 'react'
import Landing from './pages/Landing'          // existing boot screen (BootLog)
import PreTitle from './pages/PreTitle'
import TitleScreen from './pages/TitleScreen'
import AppFrame, { type Screen } from './components/AppFrame'
import ConfirmDialog from './components/ConfirmDialog'
import MainMenu from './pages/MainMenu'
import Gallery from './pages/Gallery'
import About from './pages/About'
import CommissionRequest from './pages/CommissionRequest'
import CheckStatus from './pages/CheckStatus'
import AdminConsole from './pages/AdminConsole'
import { SAMPLE_COMMISSIONS, type Commission } from './lib/commissions'

type Stage = 'boot' | 'pretitle' | 'title' | 'app'
const FADE_MS = 300
const DEV_STAGE_KEY = 'dev:stage'

// In dev, HMR reloads would otherwise replay the whole boot sequence — by far the most
// expensive thing the app renders. Resume where we left off instead; ?intro=1 forces a replay.
function initialStage(): Stage {
  if (!import.meta.env.DEV) return 'boot'
  if (new URLSearchParams(window.location.search).has('intro')) return 'boot'
  const saved = sessionStorage.getItem(DEV_STAGE_KEY)
  return saved === 'pretitle' || saved === 'title' || saved === 'app' ? saved : 'boot'
}

// Stage machine: boot → pretitle → title → app, each hop through a black fade.
// Replaces the Landing/TitleScreen switch previously in main.tsx — render <App /> from main.tsx.
export default function App(): React.ReactElement {
  const [stage, setStage] = useState<Stage>(initialStage)
  const [screen, setScreen] = useState<Screen>('menu')
  const [statusPrefill, setStatusPrefill] = useState<string | undefined>()
  const [overlay, setOverlay] = useState<'none' | 'in' | 'out'>('none')
  const [confirmExit, setConfirmExit] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [commissions, setCommissions] = useState<Commission[]>(SAMPLE_COMMISSIONS)
  const fading = useRef(false)
  const timers = useRef<number[]>([])

  const later = (fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timers.current = timers.current.filter(t => t !== id)
      fn()
    }, ms)
    timers.current.push(id)
  }
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  useEffect(() => {
    if (import.meta.env.DEV) sessionStorage.setItem(DEV_STAGE_KEY, stage)
  }, [stage])

  const fade = useCallback((cb: () => void) => {
    if (fading.current) return
    fading.current = true
    setOverlay('in')
    later(() => {
      cb()
      setOverlay('out')
      later(() => { setOverlay('none'); fading.current = false }, 520)
    }, FADE_MS)
  }, [])

  const toPretitle = useCallback(() => fade(() => {
    setStage('pretitle')
    later(() => fade(() => setStage('title')), 2900)   // auto-advance
  }), [fade])
  const toTitle = useCallback(() => fade(() => setStage('title')), [fade])
  const toApp = useCallback(() => fade(() => { setStage('app'); setScreen('menu') }), [fade])

  useEffect(() => {
    const kb = (e: KeyboardEvent) => {
      if (stage === 'pretitle') toTitle()
      else if (stage === 'title') toApp()
      else if (stage === 'app' && e.key === 'Escape') {
        if (confirmExit) setConfirmExit(false)
        else if (screen === 'menu') setConfirmExit(true)
        else nav('menu')
      }
    }
    window.addEventListener('keydown', kb)
    return () => window.removeEventListener('keydown', kb)
  }, [stage, screen, confirmExit, toTitle, toApp])

  function nav(s: Screen, prefill?: string) {
    setStatusPrefill(prefill)
    setScreen(s)
  }
  function toast(msg: string) {
    setToastMsg(msg)
    later(() => setToastMsg(null), 4000)
  }
  function addCommission(c: Commission) { setCommissions(cs => [c, ...cs]) }
  function patch(id: string, p: Partial<Commission>) {
    setCommissions(cs => cs.map(c => (c.id === id ? { ...c, ...p } : c)))
  }

  return (
    <>
      {stage === 'boot' && <Landing onRequestTransition={toPretitle} />}
      {stage === 'pretitle' && <PreTitle onAdvance={toTitle} />}
      {stage === 'title' && <TitleScreen onAdvance={toApp} />}
      {stage === 'app' && (
        <AppFrame screen={screen} onMenu={() => nav('menu')} onExit={() => setConfirmExit(true)}>
          {screen === 'menu' && <MainMenu nav={nav} />}
          {screen === 'gallery' && <Gallery />}
          {screen === 'about' && <About />}
          {screen === 'request' && <CommissionRequest addCommission={addCommission} toast={toast} nav={nav} />}
          {screen === 'status' && <CheckStatus key={statusPrefill ?? 'blank'} commissions={commissions} prefill={statusPrefill} toast={toast} />}
          {screen === 'admin' && <AdminConsole commissions={commissions} patch={patch} toast={toast} />}
        </AppFrame>
      )}

      {overlay === 'in' && <div className="transition-overlay-in" />}
      {overlay === 'out' && <div className="transition-overlay-out" />}
      {toastMsg && <div className="nier-toast"><span className="sq" />{toastMsg}</div>}
      {confirmExit && (
        <ConfirmDialog
          message="Return to the title screen?"
          onConfirm={() => { setConfirmExit(false); toTitle() }}
          onCancel={() => setConfirmExit(false)}
        />
      )}
    </>
  )
}

import React, { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react'
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
import Terms from './pages/Terms'
import Privacy from './pages/Privacy'
import Credits from './pages/Credits'
import { useUiScale } from './lib/uiScale'

// split into its own chunk: it pulls in the supabase client, which buyers never need
const AdminConsole = lazy(() => import('./pages/AdminConsole'))

type Stage = 'boot' | 'pretitle' | 'title' | 'app'
const FADE_MS = 300
const PRETITLE_MS = 1400
const DEV_STAGE_KEY = 'dev:stage'


const DEEP_LINK_ID = new URLSearchParams(window.location.search).get('id') ?? undefined

const SCREENS: readonly Screen[] = ['menu', 'gallery', 'about', 'request', 'status', 'terms', 'privacy', 'credits', 'admin']

function screenFromHash(): Screen | undefined {
  const name = window.location.hash.slice(1)
  return SCREENS.find(s => s === name)
}

// What the address bar should say for a given state. The ?id= is kept only while its status
// page is open, so a refresh there looks the commission up again.
function urlFor(stage: Stage, screen: Screen, statusId?: string): string {
  if (stage !== 'app') return window.location.pathname
  const query = screen === 'status' && statusId ? `?id=${encodeURIComponent(statusId)}` : ''
  return `${window.location.pathname}${query}#${screen}`
}

const HASH_SCREEN = screenFromHash()

// In dev, HMR reloads would otherwise replay the whole boot sequence — by far the most
// expensive thing the app renders. Resume where we left off instead; ?intro=1 forces a replay.
function initialStage(): Stage {
  if (DEEP_LINK_ID || HASH_SCREEN) return 'app'
  if (!import.meta.env.DEV) return 'boot'
  if (new URLSearchParams(window.location.search).has('intro')) return 'boot'
  const saved = sessionStorage.getItem(DEV_STAGE_KEY)
  return saved === 'pretitle' || saved === 'title' || saved === 'app' ? saved : 'boot'
}

// Stage machine: boot → pretitle → title → app. boot → pretitle fades through black,
// pretitle → title is a hard cut (the title glitches itself in), title ↔ app fades through beige.
// Replaces the Landing/TitleScreen switch previously in main.tsx — render <App /> from main.tsx.
export default function App(): React.ReactElement {
  useUiScale()
  const [stage, setStage] = useState<Stage>(initialStage)
  const [screen, setScreen] = useState<Screen>(DEEP_LINK_ID ? 'status' : HASH_SCREEN ?? 'menu')
  const [statusPrefill, setStatusPrefill] = useState<string | undefined>(DEEP_LINK_ID)
  const [overlay, setOverlay] = useState<'none' | 'in' | 'out'>('none')
  const [overlayTone, setOverlayTone] = useState<'black' | 'beige'>('black')
  const [confirmExit, setConfirmExit] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
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

  // keep the address bar in step with the screen: each change becomes a history entry
  useEffect(() => {
    const url = urlFor(stage, screen, statusPrefill)
    if (url !== window.location.pathname + window.location.search + window.location.hash) {
      window.history.pushState(null, '', url)
    }
  }, [stage, screen, statusPrefill])

  // the hop into the app fades through the menu's beige rather than black
  const fade = useCallback((cb: () => void, tone: 'black' | 'beige' = 'black') => {
    if (fading.current) return
    fading.current = true
    setOverlayTone(tone)
    setOverlay('in')
    later(() => {
      cb()
      setOverlay('out')
      later(() => { setOverlay('none'); fading.current = false }, 340)
    }, FADE_MS)
  }, [])

  // the title screen glitches in when arriving from the title card, but not when coming back from the menu
  const [titleSkipIntro, setTitleSkipIntro] = useState(false)
  const cutToTitle = () => { setTitleSkipIntro(false); setStage(s => (s === 'pretitle' ? 'title' : s)) }
  const toPretitle = useCallback(() => fade(() => {
    setStage('pretitle')
    later(cutToTitle, PRETITLE_MS)   // auto-advance
  }), [fade])
  // leaving the app fades through beige too; the title card hard-cuts instead, since the title
  // screen glitches its own background in (and only moves on if it's still on the card)
  const toTitle = useCallback(() => {
    if (stage === 'pretitle') cutToTitle()
    else fade(() => { setTitleSkipIntro(true); setStage('title') }, 'beige')
  }, [fade, stage])
  const toApp = useCallback(() => fade(() => { setStage('app'); setScreen('menu') }, 'beige'), [fade])

  // back/forward: follow the hash. Going back past the menu (to the bare URL) returns to the title.
  useEffect(() => {
    const onPop = () => {
      const s = screenFromHash()
      setConfirmExit(false)
      if (s) {
        setStage('app')
        setScreen(s)
        setStatusPrefill(new URLSearchParams(window.location.search).get('id') ?? undefined)
      } else if (stage === 'app') {
        toTitle()
      }
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [stage, toTitle])

  useEffect(() => {
    const kb = (e: KeyboardEvent) => {
      if (stage === 'pretitle') toTitle()
      else if (stage === 'app' && e.key === 'Escape') {
        if (confirmExit) setConfirmExit(false)
        else if (screen === 'menu') setConfirmExit(true)
        else nav('menu')
      }
    }
    window.addEventListener('keydown', kb)
    return () => window.removeEventListener('keydown', kb)
  }, [stage, screen, confirmExit, toTitle])

  function nav(s: Screen, prefill?: string) {
    setStatusPrefill(prefill)
    setScreen(s)
  }
  function toast(msg: string) {
    setToastMsg(msg)
    later(() => setToastMsg(null), 4000)
  }

  return (
    <>
      {stage === 'boot' && <Landing onRequestTransition={toPretitle} />}
      {stage === 'pretitle' && <PreTitle onAdvance={toTitle} />}
      {stage === 'title' && <TitleScreen onAdvance={toApp} skipIntro={titleSkipIntro} />}
      {stage === 'app' && (
        <AppFrame screen={screen} nav={nav} onExit={() => setConfirmExit(true)}>
          {screen === 'menu' && <MainMenu nav={nav} />}
          {screen === 'gallery' && <Gallery nav={nav} />}
          {screen === 'about' && <About nav={nav} />}
          {screen === 'request' && <CommissionRequest toast={toast} nav={nav} />}
          {screen === 'status' && <CheckStatus key={statusPrefill ?? 'blank'} prefill={statusPrefill} toast={toast} />}
          {screen === 'terms' && <Terms nav={nav} />}
          {screen === 'privacy' && <Privacy nav={nav} />}
          {screen === 'credits' && <Credits />}
          {screen === 'admin' && (
            <Suspense fallback={<div className="n-text">Loading console…</div>}>
              <AdminConsole toast={toast} />
            </Suspense>
          )}
        </AppFrame>
      )}

      {overlay === 'in' && <div className={`transition-overlay-in ${overlayTone}`} />}
      {overlay === 'out' && <div className={`transition-overlay-out ${overlayTone}`} />}
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

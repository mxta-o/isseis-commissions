import React, { StrictMode, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Landing from './pages/Landing'
import TitleScreen from './pages/TitleScreen'

type ErrorBoundaryState = {
  hasError: boolean
  message?: string
}

class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message }
  }

  componentDidCatch(error: Error) {
    console.error('[ErrorBoundary]', error)
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-black text-white flex items-center justify-center p-6">
          <div className="max-w-xl text-center">
            <h1 className="text-2xl font-bold">UI crashed</h1>
            <p className="mt-2 text-sm text-stone-300">{this.state.message ?? 'Unknown error'}</p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

function Root(): React.ReactElement {
  const [showLanding, setShowLanding] = useState<boolean>(true)
  const [overlayVisible, setOverlayVisible] = useState<boolean>(false)
  const pendingShownRef = useRef<(() => void) | null>(null)

  const FADE_MS = 480

  function handleRequestTransition() {
    // fade to black
    setOverlayVisible(true)
    // after fade completes, switch screen and fade back
    window.setTimeout(() => {
      setShowLanding(false)
      // wait for TitleScreen to report readiness before fading back
      let settled = false
      const finish = () => {
        if (settled) return
        settled = true
        setOverlayVisible(false)
      }

      pendingShownRef.current = finish

      // fallback: if no signal arrives, fade out anyway
      window.setTimeout(() => {
        if (!settled) finish()
      }, 1000)
    }, FADE_MS)
  }

  return (
    <>
      {showLanding ? (
        <Landing onRequestTransition={handleRequestTransition} />
      ) : (
        <TitleScreen
          onShown={() => {
            if (pendingShownRef.current) pendingShownRef.current()
          }}
        />
      )}

      <div className={`transition-overlay ${overlayVisible ? 'show' : ''}`} />

    </>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <Root />
    </ErrorBoundary>
  </StrictMode>,
)

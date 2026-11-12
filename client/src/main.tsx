import React, { StrictMode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import './index.css'
import './styles/nier.css'
import App from './App'

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
      // visitors get a calm message in the app's colours; the technical detail only shows in dev (and always goes to the console)
      return (
        <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#14110c', color: '#f3e9da', fontFamily: 'var(--font-ui)', textAlign: 'center' }}>
          <div style={{ maxWidth: 520 }}>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 400, letterSpacing: '0.3em' }}>SYSTEM ERROR</h1>
            <p style={{ margin: '16px 0 24px', lineHeight: 1.6, opacity: 0.85 }}>
              Something went wrong on this page. Reloading usually fixes it. If it keeps happening, please contact the artist.
            </p>
            {import.meta.env.DEV && this.state.message && (
              <p style={{ margin: '0 0 24px', fontSize: 13, opacity: 0.6, wordBreak: 'break-word' }}>{this.state.message}</p>
            )}
            <button onClick={() => window.location.reload()}
              style={{ minHeight: 48, padding: '0 28px', border: 'none', background: '#ece6da', color: '#25221c', fontFamily: 'inherit', fontSize: 18, letterSpacing: '0.08em', cursor: 'pointer' }}>
              Reload
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Reuse the root across module re-executions (HMR, or the same module served
// under two URLs). Calling createRoot twice on one container leaves two roots
// fighting over the same DOM, which surfaces as a removeChild crash.
const container = document.getElementById('root')! as HTMLElement & { _root?: Root }
const root = (container._root ??= createRoot(container))

root.render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

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

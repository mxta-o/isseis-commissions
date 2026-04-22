import React, { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import Landing from './pages/Landing'

function Root(): React.ReactElement {
  const [showLanding, setShowLanding] = useState<boolean>(true)

  return showLanding ? (
    <Landing onContinue={() => setShowLanding(false)} />
  ) : (
    <App />
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)

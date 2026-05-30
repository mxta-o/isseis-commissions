import React, { useEffect, useRef } from 'react'
import title from '../assets/titleScreen.png'

type Props = {
  onShown?: () => void
}

export default function TitleScreen({ onShown }: Props): React.ReactElement {
  const firedRef = useRef(false)

  function notifyShown() {
    if (firedRef.current) return
    firedRef.current = true
    if (onShown) onShown()
  }

  useEffect(() => {
    const id = window.setTimeout(() => {
      notifyShown()
    }, 1000)

    return () => window.clearTimeout(id)
  }, [])

  return (
    <div className="title-root">
      <img
        src={title}
        alt="Title background"
        className="title-bg"
        onLoad={notifyShown}
      />
      <div className="title-vignette" />
      <div className="title-grain" />
      <div className="title-lines" />
      <div className="title-sparks" />

      <div className="title-center">
        <div>
          <h1 className="title-logo">
            <span className="title-logo-text">Issei's:Commissions</span>
            <span className="title-logo-glitch" aria-hidden>
              Issei's Commissions
            </span>
          </h1>

          <div className="title-press">
            <span className="title-rule" />
            <span>Press Any Button</span>
            <span className="title-rule" />
          </div>
        </div>
      </div>
    </div>
  )
}

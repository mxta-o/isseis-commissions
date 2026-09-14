import React, { useEffect, useState } from 'react'
// Loading component removed; BootLog now handles loading
import BootLog from '../components/BootLog'
import CrtOverlay from '../components/CrtOverlay'
import isseiLogo from '../assets/isseiLogo.png'

type Props = {
  onRequestTransition: () => void
}

const BOOT_LINES = [
  'Commencing Studio Boot',
  'Canvas Memory Check: OK',
  'Loading Pigment Archive',
  'Calibrating Line Weight',
  'Calibrating Brush Pressure',
  'Brush Pressure: Nominal',
  'Remaining Ink Reserve: 100%',
  'Color Temperature: Stable',
  'Reference Library: Synced',
  'Verifying Commission Queue',
  'Initializing Request Intake',
  'Mail Relay: Online',
  'Payment Bridge: Connected',
  'Signature Authentication: Verified',
  'Studio Status: Operational',
  'All Systems Green',
  'Commission Preparations Complete',
  'Click anywhere to continue',
]

export default function Landing({ onRequestTransition }: Props): React.ReactElement {
  const [loaded, setLoaded] = useState<boolean>(false)
  const [skipBoot, setSkipBoot] = useState<boolean>(false)
  const [dots, setDots] = useState<string>('')

  const handleSkipClick = () => {
    if (!loaded) setSkipBoot(true)
  }

  useEffect(() => {
    if (!loaded) return

    const id = window.setTimeout(() => onRequestTransition(), 200)

    return () => window.clearTimeout(id)
  }, [loaded, onRequestTransition])

  useEffect(() => {
    const frames = ['', '.', '..', '...']
    let idx = 0
    const id = window.setInterval(() => {
      idx = (idx + 1) % frames.length
      setDots(frames[idx])
    }, 350)

    return () => window.clearInterval(id)
  }, [])

  return (
    <div
      className="relative min-h-screen flex flex-col items-start justify-start overflow-hidden crt-root crt-soft crt-flicker"
      onClick={handleSkipClick}
    >
      <CrtOverlay />

      <div className="crt-content w-full">
        <div className="absolute top-10 right-10 loading-orb" aria-hidden />

        <div className="yorha-watermark" aria-hidden>
          <img className="yorha-logo" src={isseiLogo} alt="" />
        </div>

        <div className="absolute top-15 left-15 text-sm font-mono select-none boot-log-line boot-header">
          <span className="boot-header-main"><span className="glitch" data-text="LOADING">LOADING</span></span>
          <span className="boot-header-sub uppercase"><span className="glitch" data-text={`— BOOTING SYSTEM${dots}`}>— BOOTING SYSTEM<span className="ml-1">{dots}</span></span></span>
        </div>

        <div className="absolute top-33 left-18 w-[34rem] max-w-[46vw]">
          <BootLog
            lines={BOOT_LINES}
            typingSpeed={8}
            lineDelay={70}
            skip={skipBoot}
            onComplete={() => {
              setLoaded(true)
            }}
          />
        </div>
      </div>
    </div>
  )
}

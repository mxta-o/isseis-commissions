import React, { useEffect, useState } from 'react'
// Loading component removed; BootLog now handles loading
import BootLog from '../components/BootLog'

type Props = {
  onContinue: () => void
}

const BOOT_LINES = [
  'Commencing System Check',
  'Memory Unit: Green',
  'Initializing Tactics Log',
  'Loading Geographic Data',
  'Vitals: Green',
  'Remaining MP: 100%',
  'Black Box Temperature: Normal',
  'Black Box Internal Pressure: Normal',
  'Activating IFF',
  'Activating FCS',
  'Initializing Pod Connection',
  'Launching DBU Setup',
  'Activating Inertia Control System',
  'Equipment Authentication: Complete',
  'Equipment Status: Green',
  'All Systems Green',
  'Combat Preparations Complete',
  'Press any button to continue...',
]

export default function Landing({ onContinue }: Props): React.ReactElement {
  const [loaded, setLoaded] = useState<boolean>(false)

  useEffect(() => {
    if (!loaded) return

    const forward = () => {
      onContinue()
    }

    const opts: AddEventListenerOptions = { once: true }
    window.addEventListener('keydown', forward, opts)
    window.addEventListener('pointerdown', forward, opts)

    return () => {
      window.removeEventListener('keydown', forward)
      window.removeEventListener('pointerdown', forward)
    }
  }, [loaded, onContinue])

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-black text-white overflow-hidden">
      <div className="absolute top-6 left-6 text-sm font-mono tracking-widest text-green-300/90 select-none">
        <span className="uppercase">LOADING — BOOTING SYSTEM...</span>
        <span className="ml-2 inline-block animate-pulse">_</span>
      </div>

      <div className="absolute top-20 left-6 w-[34rem] max-w-[46vw]">
        <BootLog
          lines={BOOT_LINES}
          typingSpeed={30}
          lineDelay={150}
          onComplete={() => {
            setLoaded(true)
          }}
        />
      </div>
    </div>
  )
}

import React from 'react'

type Props = {
  className?: string
}

export default function CrtOverlay({ className = '' }: Props): React.ReactElement {
  return <div className={`crt-overlay ${className}`} aria-hidden="true" />
}

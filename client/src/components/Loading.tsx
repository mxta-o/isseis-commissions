import React from 'react'

export default function Loading(): React.ReactElement {
  return (
    <div className="flex items-center justify-center">
      <div style={{ width: 48, height: 48 }} className="relative">
        <div className="absolute inset-0 m-auto h-12 w-12 animate-spin rounded-full border-4 border-t-transparent border-white/90" />
      </div>
    </div>
  )
}

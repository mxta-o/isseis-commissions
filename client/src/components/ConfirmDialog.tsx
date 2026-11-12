import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

type Props = {
  title?: string
  message: string
  onConfirm: () => void
  onCancel: () => void
}

// one choice: the button plus the cursor beside it (its space is always reserved, so nothing shifts), shown while it's the selected one
function Choice({ label, on, onClick, onHover }: { label: string; on: boolean; onClick: () => void; onHover: () => void }): React.ReactElement {
  return (
    <div className="confirm-choice">
      <span className="n-cursor" aria-hidden />
      <button className={`confirm-btn${on ? ' on' : ''}`} onClick={onClick} onMouseEnter={onHover} onFocus={onHover}><span className="sq" aria-hidden />{label}</button>
    </div>
  )
}

// SYSTEM MESSAGE style Yes/No prompt — dark backdrop + cream panel, matching the app chrome.
// Keyboard: ←/→ pick Yes/No, ↑/↓ swap between them, Enter confirms the picked one. Esc is left to App
// (it closes the dialog). Starts on No so a stray Enter doesn't leave the screen.
export default function ConfirmDialog({ title = 'SYSTEM MESSAGE', message, onConfirm, onCancel }: Props): React.ReactElement {
  const [sel, setSel] = useState<0 | 1>(1)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return
      if (e.key === 'ArrowLeft') setSel(0)
      else if (e.key === 'ArrowRight') setSel(1)
      else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') setSel(s => (s === 0 ? 1 : 0))
      else if (e.key === 'Enter') {
        if (!e.repeat) (sel === 0 ? onConfirm : onCancel)()
      } else return
      // capture phase + stop: keeps Enter from also clicking whatever button is focused behind the dialog
      e.preventDefault()
      e.stopPropagation()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [sel, onConfirm, onCancel])

  // Portaled to <body>: screens animate `transform` (.screen-in), which makes position:fixed children
  // measure against that screen instead of the window, so the shade and centring stopped short of the edges.
  return createPortal(
    <div className="confirm-backdrop" onClick={onCancel}>
      <div className="confirm-panel" role="alertdialog" aria-label={title} onClick={e => e.stopPropagation()}>
        <div className="confirm-header">
          <span className="sq" />
          <span>{title}</span>
        </div>
        <div className="confirm-body">
          <div className="confirm-message">{message}</div>
          <div className="confirm-actions">
            <Choice label="Yes" on={sel === 0} onClick={onConfirm} onHover={() => setSel(0)} />
            <Choice label="No" on={sel === 1} onClick={onCancel} onHover={() => setSel(1)} />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

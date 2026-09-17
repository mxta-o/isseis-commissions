import React from 'react'

type Props = {
  title?: string
  message: string
  onConfirm: () => void
  onCancel: () => void
}

// SYSTEM MESSAGE style Yes/No prompt — dark backdrop + cream panel, matching the app chrome.
export default function ConfirmDialog({ title = 'SYSTEM MESSAGE', message, onConfirm, onCancel }: Props): React.ReactElement {
  return (
    <div className="confirm-backdrop" onClick={onCancel}>
      <div className="confirm-panel mono" onClick={e => e.stopPropagation()}>
        <div className="confirm-header">
          <span className="sq" />
          <span>{title}</span>
        </div>
        <div className="confirm-body">
          <div className="confirm-message">{message}</div>
          <div style={{ flex: 1 }} />
          <div className="confirm-actions">
            <button className="btn-solid" onClick={onConfirm}><span className="sq" />Yes</button>
            <button className="btn-ghost" onClick={onCancel}>No</button>
          </div>
        </div>
      </div>
    </div>
  )
}

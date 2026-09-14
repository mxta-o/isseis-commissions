import React, { useEffect, useRef, useState } from 'react'

type Props = {
  lines: string[]
  typingSpeed?: number // ms per character
  lineDelay?: number // ms delay after a line completes
  className?: string
  onComplete?: () => void
  skip?: boolean // instantly complete all lines when true
}

// Memoized so a per-character tick only reconciles the line being typed. Each line carries two
// blurred, blend-mode pseudo-elements, so re-rendering all of them per keystroke is expensive.
const Line = React.memo(function Line({ text, cursor }: { text: string; cursor: boolean }) {
  return (
    <div className="font-mono text-sm leading-6 whitespace-pre boot-log-line" data-text={text}>
      <span className="glitch" data-text={text}>{text}</span>
      {cursor ? <span className="inline-block ml-1 w-2 animate-pulse">▮</span> : null}
    </div>
  )
})

export default function BootLog({
  lines,
  typingSpeed = 1,
  lineDelay = 10,
  className = '',
  onComplete,
  skip = false,
}: Props): React.ReactElement {
  const [active, setActive] = useState<{ line: number; text: string }>({ line: 0, text: '' })

  const lineIndexRef = useRef(0)
  const charIndexRef = useRef(0)
  const timeoutRef = useRef<number | null>(null)
  const completedRef = useRef(false)
  const onCompleteRef = useRef(onComplete)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    // reset if lines change
    lineIndexRef.current = 0
    charIndexRef.current = 0
    setActive({ line: 0, text: '' })

    function tick() {
      const li = lineIndexRef.current
      if (li >= lines.length) {
        if (!completedRef.current) {
          completedRef.current = true
          onCompleteRef.current?.()
        }
        return
      }

      const line = lines[li]
      const ci = charIndexRef.current

      if (ci < line.length) {
        charIndexRef.current += 1
        setActive({ line: li, text: line.slice(0, ci + 1) })
        timeoutRef.current = window.setTimeout(tick, typingSpeed)
      } else {
        lineIndexRef.current += 1
        charIndexRef.current = 0
        setActive({ line: lineIndexRef.current, text: '' })
        timeoutRef.current = window.setTimeout(tick, lineDelay)
      }
    }

    timeoutRef.current = window.setTimeout(tick, typingSpeed)

    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
      completedRef.current = false
    }
  }, [lines, typingSpeed, lineDelay])

  useEffect(() => {
    if (!skip) return
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    lineIndexRef.current = lines.length
    charIndexRef.current = 0
    setActive({ line: lines.length, text: '' })
    if (!completedRef.current) {
      completedRef.current = true
      onCompleteRef.current?.()
    }
  }, [skip, lines])

  const cursorLine = Math.min(active.line, lines.length - 1)

  return (
    <div className={className} aria-hidden>
      {lines.map((full, idx) => (
        <Line
          key={idx}
          text={idx < active.line ? full : idx === active.line ? active.text : ''}
          cursor={idx === cursorLine}
        />
      ))}
    </div>
  )
}

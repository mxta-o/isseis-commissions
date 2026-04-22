import React, { useEffect, useRef, useState } from 'react'

type Props = {
  lines: string[]
  typingSpeed?: number // ms per character
  lineDelay?: number // ms delay after a line completes
  className?: string
  onComplete?: () => void
}

export default function BootLog({
  lines,
  typingSpeed = 1,
  lineDelay = 10,
  className = '',
  onComplete,
}: Props): React.ReactElement {
  const [displayed, setDisplayed] = useState<string[]>(() => lines.map(() => ''))
  const [currentLine, setCurrentLine] = useState<number>(0)

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
    setDisplayed(lines.map(() => ''))
    lineIndexRef.current = 0
    charIndexRef.current = 0
    setCurrentLine(0)

    function tick() {
      const li = lineIndexRef.current
      if (li >= lines.length) {
        // ensure we only call onComplete once
        setCurrentLine(Math.max(0, lines.length - 1))
        if (!completedRef.current) {
          completedRef.current = true
          if (onCompleteRef.current) onCompleteRef.current()
        }
        return
      }

      const line = lines[li]
      const ci = charIndexRef.current

      if (ci < line.length) {
        // append next character
        setDisplayed((prev) => {
          const copy = prev.slice()
          copy[li] = line.slice(0, ci + 1)
          return copy
        })
        charIndexRef.current += 1
        timeoutRef.current = window.setTimeout(tick, typingSpeed)
      } else {
        // line complete, move to next line after delay
        lineIndexRef.current += 1
        setCurrentLine(lineIndexRef.current)
        charIndexRef.current = 0
        timeoutRef.current = window.setTimeout(tick, lineDelay)
      }
    }

    timeoutRef.current = window.setTimeout(tick, typingSpeed)

    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
      completedRef.current = false
    }
  }, [lines, typingSpeed, lineDelay])

  return (
    <div className={className} aria-hidden>
      {displayed.map((text, idx) => (
        <div key={idx} className="font-mono text-sm text-green-300/90 leading-6 whitespace-pre">
          {text}
          {idx === currentLine ? <span className="inline-block ml-1 w-2 animate-pulse">▮</span> : null}
        </div>
      ))}
    </div>
  )
}

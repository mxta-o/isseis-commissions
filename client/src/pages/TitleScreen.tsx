import React, { useMemo } from 'react'
import { genGarble } from '../lib/commissions'
import { getFxTier } from '../lib/fx'

type Props = { onAdvance: () => void }

const NOISE =
  "url(data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='180'%20height='180'%3E%3Cfilter%20id='n'%3E%3CfeTurbulence%20type='fractalNoise'%20baseFrequency='0.8'%20numOctaves='1'%20stitchTiles='stitch'/%3E%3C/filter%3E%3Crect%20width='180'%20height='180'%20filter='url(%23n)'%20opacity='0.25'/%3E%3C/svg%3E)"

type Box = { l?: string; r?: string; t?: string; b?: string; w: string; h: string; bg: string; o?: number }
const box = (bx: Box, i: number) => (
  <span key={i} style={{ position: 'absolute', left: bx.l, right: bx.r, top: bx.t, bottom: bx.b, width: bx.w, height: bx.h, background: bx.bg, opacity: bx.o }} />
)

// Momentary glitch blocks (flash at ~5-8% of the 1.6s reveal)
const FLASH_BLOCKS: Box[] = [
  { l: '24%', t: '22%', w: '6%', h: '30%', bg: '#f5f4de' }, { l: '18%', t: '48%', w: '15%', h: '24%', bg: '#f5f4de' },
  { l: '42%', t: '24%', w: '6%', h: '26%', bg: '#f5f4de' }, { l: '47%', t: '52%', w: '4%', h: '14%', bg: '#f5f4de' },
  { l: '44%', t: '62%', w: '3%', h: '10%', bg: '#f5f4de', o: 0.9 }, { l: '56%', t: '48%', w: '12%', h: '20%', bg: '#f5f4de' },
  { l: '74%', t: '50%', w: '6%', h: '16%', bg: '#f5f4de' },
]
// Mosaic sweeps (low / mid / top rows, em-sized)
const MZ_LOW: Box[] = [
  { l: '3%', t: '62%', w: '0.4em', h: '0.4em', bg: '#a49e8f' }, { l: '11%', t: '70%', w: '0.3em', h: '0.3em', bg: '#f5f4de' },
  { l: '20%', t: '58%', w: '0.5em', h: '0.5em', bg: '#6b665c' }, { l: '29%', t: '66%', w: '0.35em', h: '0.35em', bg: '#cfc9b8' },
  { l: '38%', t: '56%', w: '0.6em', h: '0.6em', bg: '#f5f4de' }, { l: '48%', t: '68%', w: '0.3em', h: '0.3em', bg: '#8a857a' },
  { l: '56%', t: '58%', w: '0.55em', h: '0.55em', bg: '#e8e2cf' }, { l: '66%', t: '72%', w: '0.4em', h: '0.28em', bg: '#cfc9b8' },
  { l: '75%', t: '60%', w: '0.45em', h: '0.45em', bg: '#f5f4de' }, { l: '85%', t: '66%', w: '0.35em', h: '0.35em', bg: '#6b665c' },
  { l: '93%', t: '58%', w: '0.5em', h: '0.4em', bg: '#a49e8f' },
]
const MZ_MID: Box[] = [
  { l: '6%', t: '36%', w: '0.45em', h: '0.45em', bg: '#cfc9b8' }, { l: '15%', t: '42%', w: '0.3em', h: '0.3em', bg: '#f5f4de' },
  { l: '25%', t: '34%', w: '0.55em', h: '0.55em', bg: '#8a857a' }, { l: '34%', t: '44%', w: '0.7em', h: '0.6em', bg: '#f5f4de' },
  { l: '45%', t: '36%', w: '0.4em', h: '0.4em', bg: '#6b665c' }, { l: '53%', t: '46%', w: '0.65em', h: '0.55em', bg: '#f5f4de' },
  { l: '63%', t: '38%', w: '0.35em', h: '0.35em', bg: '#a49e8f' }, { l: '72%', t: '44%', w: '0.5em', h: '0.45em', bg: '#e8e2cf' },
  { l: '82%', t: '34%', w: '0.4em', h: '0.4em', bg: '#3a362f' }, { l: '91%', t: '42%', w: '0.6em', h: '0.5em', bg: '#cfc9b8' },
]
const MZ_TOP: Box[] = [
  { l: '9%', t: '8%', w: '0.35em', h: '0.35em', bg: '#a49e8f' }, { l: '19%', t: '14%', w: '0.45em', h: '0.4em', bg: '#f5f4de' },
  { l: '30%', t: '6%', w: '0.3em', h: '0.3em', bg: '#cfc9b8' }, { l: '41%', t: '16%', w: '0.55em', h: '0.45em', bg: '#8a857a' },
  { l: '52%', t: '8%', w: '0.4em', h: '0.4em', bg: '#f5f4de' }, { l: '62%', t: '18%', w: '0.3em', h: '0.3em', bg: '#6b665c' },
  { l: '71%', t: '10%', w: '0.5em', h: '0.4em', bg: '#e8e2cf' }, { l: '81%', t: '16%', w: '0.35em', h: '0.35em', bg: '#cfc9b8' },
  { l: '90%', t: '8%', w: '0.4em', h: '0.35em', bg: '#a49e8f' },
]
const NOISE_BLK: Box[] = [
  { l: '55%', t: '-14%', w: '0.3em', h: '0.22em', bg: '#cfc9b8' }, { l: '61%', t: '-8%', w: '0.45em', h: '0.3em', bg: '#a49e8f', o: 0.85 },
  { l: '68%', t: '-16%', w: '0.25em', h: '0.25em', bg: '#f5f4de', o: 0.8 }, { l: '74%', t: '-6%', w: '0.55em', h: '0.28em', bg: '#8a857a' },
  { l: '82%', t: '-12%', w: '0.3em', h: '0.2em', bg: '#cfc9b8', o: 0.75 }, { l: '88%', t: '-4%', w: '0.4em', h: '0.3em', bg: '#f5f4de', o: 0.7 },
  { l: '95%', t: '-10%', w: '0.28em', h: '0.28em', bg: '#a49e8f', o: 0.6 },
]
const AFTER_BLK: Box[] = [
  { l: '4%', t: '-26%', w: '0.35em', h: '0.25em', bg: '#cfc9b8' }, { l: '10%', t: '-20%', w: '0.25em', h: '0.25em', bg: '#f5f4de', o: 0.8 },
  { l: '17%', t: '-30%', w: '0.45em', h: '0.22em', bg: '#a49e8f', o: 0.7 }, { l: '64%', t: '-24%', w: '0.3em', h: '0.3em', bg: '#f5f4de', o: 0.75 },
  { l: '72%', t: '-30%', w: '0.4em', h: '0.2em', bg: '#cfc9b8', o: 0.65 },
]
// Jagged transition zone over the plate's left edge (mixed white/dark)
const EDGE_BITS: Box[] = [
  { l: '1%', t: '18%', w: '5px', h: '4px', bg: 'rgba(45,40,34,0.8)' }, { l: '7%', t: '6%', w: '4px', h: '4px', bg: '#fffefa' },
  { l: '11%', t: '38%', w: '6px', h: '5px', bg: 'rgba(45,40,34,0.7)' }, { l: '4%', t: '56%', w: '4px', h: '3px', bg: '#fffefa', o: 0.85 },
  { l: '15%', t: '14%', w: '7px', h: '4px', bg: 'rgba(45,40,34,0.6)' }, { l: '19%', t: '60%', w: '5px', h: '5px', bg: '#fffefa' },
  { l: '9%', t: '76%', w: '6px', h: '4px', bg: 'rgba(45,40,34,0.75)' }, { l: '23%', t: '30%', w: '4px', h: '4px', bg: '#fffefa', o: 0.8 },
  { l: '26%', t: '70%', w: '6px', h: '3px', bg: 'rgba(45,40,34,0.65)' }, { l: '13%', t: '88%', w: '5px', h: '3px', bg: '#fffefa', o: 0.7 },
]
// Dark ticks below the baseline (right half of the plate)
const BELOW_TICKS: Box[] = [
  { l: '58%', t: '3px', w: '7px', h: '3px', bg: 'rgba(50,44,37,0.75)' }, { l: '66%', t: '1px', w: '4px', h: '3px', bg: 'rgba(50,44,37,0.74)' },
  { l: '74%', t: '4px', w: '9px', h: '3px', bg: 'rgba(50,44,37,0.68)' }, { l: '83%', t: '2px', w: '5px', h: '4px', bg: 'rgba(50,44,37,0.76)' },
  { l: '91%', t: '5px', w: '6px', h: '3px', bg: 'rgba(50,44,37,0.75)' }, { l: '97%', t: '1px', w: '4px', h: '3px', bg: 'rgba(50,44,37,0.60)' },
]
// Settled debris field above the plate (the NieR overspill) — positions are deliberate; do not regenerate
const ABOVE_DEBRIS: Box[] = [
  { l: '7.2%', b: '11.2px', w: '3.6px', h: '3.4px', bg: '#fffefa', o: 0.84 }, { l: '38.1%', b: '9.3px', w: '2.1px', h: '4.1px', bg: '#fffefa', o: 0.51 },
  { l: '55.2%', b: '10.5px', w: '7.0px', h: '5.0px', bg: '#fffefa' }, { l: '36.9%', b: '0px', w: '3.8px', h: '5.7px', bg: '#fffefa' },
  { l: '-1.8%', b: '0px', w: '4.4px', h: '5.4px', bg: '#fffefa' }, { l: '82.9%', b: '4.0px', w: '5.5px', h: '4.3px', bg: '#fffefa', o: 0.8 },
  { l: '65.2%', b: '3.2px', w: '7.4px', h: '4.2px', bg: '#fffefa' }, { l: '62.9%', b: '0px', w: '4.6px', h: '3.9px', bg: '#fffefa' },
  { l: '47.9%', b: '12.6px', w: '5.9px', h: '4.3px', bg: 'rgba(50,44,37,0.84)' }, { l: '89.5%', b: '0px', w: '5.5px', h: '4.3px', bg: 'rgba(50,44,37,0.92)' },
  { l: '44.6%', b: '4.5px', w: '2.9px', h: '3.7px', bg: '#fffefa' }, { l: '12.2%', b: '7.1px', w: '4.5px', h: '2.1px', bg: '#fffefa' },
  { l: '48.7%', b: '0px', w: '5.2px', h: '4.8px', bg: '#fffefa' }, { l: '39.5%', b: '4.3px', w: '4.4px', h: '5.7px', bg: '#fffefa' },
  { l: '69.4%', b: '0px', w: '5.1px', h: '5.7px', bg: '#fffefa' }, { l: '91.8%', b: '6.9px', w: '4.2px', h: '2.2px', bg: '#fffefa' },
  { l: '77.9%', b: '10.5px', w: '8.3px', h: '4.4px', bg: '#fffefa' }, { l: '58.3%', b: '7.1px', w: '2.3px', h: '3.3px', bg: '#fffefa' },
  { l: '14.1%', b: '3.9px', w: '5.7px', h: '5.3px', bg: '#fffefa' }, { l: '76.1%', b: '0px', w: '6.2px', h: '5.4px', bg: '#fffefa', o: 0.56 },
  { l: '21.2%', b: '0px', w: '3.0px', h: '4.0px', bg: '#fffefa' }, { l: '93.5%', b: '0px', w: '8.3px', h: '5.2px', bg: '#fffefa' },
  { l: '31.1%', b: '0px', w: '8.3px', h: '5.5px', bg: '#fffefa' }, { l: '101.7%', b: '11.9px', w: '5.2px', h: '3.7px', bg: '#fffefa' },
  { l: '87.8%', b: '8.1px', w: '6.4px', h: '4.2px', bg: '#fffefa' }, { l: '29.2%', b: '4.8px', w: '5.2px', h: '4.5px', bg: 'rgba(50,44,37,0.84)' },
  { l: '54.9%', b: '0px', w: '4.1px', h: '3.3px', bg: '#fffefa', o: 0.77 }, { l: '90.3%', b: '8.7px', w: '4.4px', h: '3.7px', bg: 'rgba(50,44,37,0.70)' },
  { l: '46.1%', b: '0px', w: '4.1px', h: '2.3px', bg: 'rgba(50,44,37,0.71)' }, { l: '34.9%', b: '3.8px', w: '8.1px', h: '5.3px', bg: '#fffefa' },
  { l: '69.1%', b: '0px', w: '9.0px', h: '2.1px', bg: '#fffefa' }, { l: '52.6%', b: '14.7px', w: '5.9px', h: '4.1px', bg: '#fffefa' },
  { l: '29.0%', b: '0px', w: '8.4px', h: '3.6px', bg: '#fffefa', o: 0.73 }, { l: '27.2%', b: '4.9px', w: '6.7px', h: '2.2px', bg: '#fffefa' },
  { l: '76.6%', b: '6.0px', w: '4.5px', h: '3.9px', bg: '#fffefa' }, { l: '47.8%', b: '0px', w: '5.6px', h: '3.8px', bg: 'rgba(50,44,37,0.79)' },
  { l: '6.6%', b: '0px', w: '3.6px', h: '5.6px', bg: 'rgba(50,44,37,0.69)' }, { l: '62.9%', b: '14.2px', w: '2.0px', h: '3.1px', bg: '#fffefa' },
  { l: '90.3%', b: '2.4px', w: '3.1px', h: '5.0px', bg: '#fffefa' }, { l: '13.1%', b: '0px', w: '4.7px', h: '5.3px', bg: '#fffefa', o: 0.5 },
  { l: '12%', b: '0', w: '13px', h: '8px', bg: '#fffefa' }, { l: '30%', b: '3px', w: '11px', h: '6px', bg: '#fffefa', o: 0.9 },
  { r: '0', b: '0', w: '22px', h: '11px', bg: '#fffefa' }, { r: '8px', b: '0', w: '8px', h: '17px', bg: '#fffefa' },
  { r: '-14px', b: '9px', w: '6px', h: '5px', bg: 'rgba(50,44,37,0.85)' }, { r: '-22px', b: '4px', w: '4px', h: '4px', bg: '#fffefa', o: 0.7 },
]
// Dark specks scattered on the plate itself
const PLATE_SPECKS: Box[] = [
  { l: '14%', t: '9px', w: '7px', h: '4px', bg: 'rgba(56,50,42,0.73)' }, { l: '23%', t: '12px', w: '5px', h: '5px', bg: 'rgba(56,50,42,0.52)' },
  { l: '31%', t: '8px', w: '9px', h: '4px', bg: 'rgba(56,50,42,0.55)' }, { l: '44%', t: '11px', w: '6px', h: '6px', bg: 'rgba(56,50,42,0.66)' },
  { l: '52%', t: '9px', w: '4px', h: '4px', bg: 'rgba(56,50,42,0.75)' }, { l: '63%', t: '13px', w: '8px', h: '4px', bg: 'rgba(56,50,42,0.54)' },
  { l: '71%', t: '8px', w: '5px', h: '5px', bg: 'rgba(56,50,42,0.61)' },
]

type Particle = { x: string; y: string; s: string; o: string; blur: string; anim: string }
function genParticles(count: number, allowBlur: boolean): Particle[] {
  const pts: (Particle & { px: number; py: number })[] = []
  const minD = 5.5
  let guard = 0
  while (pts.length < count && guard++ < 4000) {
    const x = ((Math.random() + Math.random()) / 2) * 100
    const y = ((Math.random() + Math.random()) / 2) * 100
    let ok = true
    for (const p of pts) { const dx = p.px - x, dy = (p.py - y) * 0.62; if (dx * dx + dy * dy < minD * minD) { ok = false; break } }
    if (!ok) continue
    if (x > 16 && x < 84 && y > 34 && y < 62) continue
    pts.push({
      px: x, py: y, x: x.toFixed(2) + '%', y: y.toFixed(2) + '%',
      s: (1 + Math.random() * 2.5).toFixed(1) + 'px',
      o: (0.15 + Math.random() * 0.5).toFixed(2),
      blur: allowBlur && Math.random() < 0.3 ? `blur(${(0.5 + Math.random() * 0.5).toFixed(1)}px)` : 'none',
      anim: y < 62
        ? `p-rise${1 + Math.floor(Math.random() * 3)} ${(5.5 + Math.random() * 7).toFixed(1)}s linear ${(-Math.random() * 13).toFixed(1)}s infinite`
        : `p-twinkle ${(2.2 + Math.random() * 3.5).toFixed(1)}s ease-in-out ${(-Math.random() * 6).toFixed(1)}s infinite`,
    })
  }
  return pts
}

const A16 = '1.6s steps(1,end) both'
const TITLE = "Issei's Commissions"

export default function TitleScreen({ onAdvance }: Props): React.ReactElement {
  const lite = getFxTier() === 'lite'
  const particles = useMemo(() => genParticles(lite ? 20 : 60, !lite), [lite])
  const garble1 = useMemo(() => genGarble('For the Vision of Creation'), [])
  const garble2 = useMemo(() => genGarble('Press Any Button'), [])

  // In lite mode the two ~120%-viewport fog layers keep their drift but drop the blur filter —
  // softer gradient stops read almost the same without two large offscreen filter passes.
  const fogBlur = lite ? 'none' : undefined
  const loop1 = lite ? '' : ',tg-loop1 7s steps(1,end) 4.5s infinite'
  const loop2 = lite ? '' : ',tg-loop2 7.6s steps(1,end) 4.9s infinite'
  const rayAnim = lite ? 'none' : 'ray-pulse 9s ease-in-out infinite'

  return (
    <div onClick={onAdvance} style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden', background: '#14110c', color: '#f3e9da', cursor: 'pointer', userSelect: 'none' }}>
      {/* dusk sky */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#221c17 0%,#3b322a 28%,#5f503c 50%,#3e3327 66%,#171310 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 62% 44% at 50% 40%,rgba(238,216,178,0.5),rgba(180,148,108,0.22) 45%,transparent 72%)' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: '14%', background: 'linear-gradient(180deg,transparent,rgba(18,14,11,0.5) 70%,rgba(18,14,11,0.65))', filter: 'blur(1px)' }} />
      <div style={{ position: 'absolute', left: '14%', right: '14%', top: '56%', height: '24%', background: 'radial-gradient(ellipse 50% 42% at 50% 10%,rgba(240,220,180,0.26),transparent 70%)', filter: 'blur(2px)' }} />
      {/* god rays */}
      <div style={{ position: 'absolute', left: '50%', top: '-8%', width: '130%', height: '85%', transform: 'translateX(-50%)', pointerEvents: 'none', animation: rayAnim, opacity: lite ? 0.65 : undefined, background: 'conic-gradient(from 90deg at 50% 0%,transparent 22%,rgba(240,225,190,0.09) 26%,transparent 30%,rgba(240,225,190,0.13) 37%,transparent 42%,rgba(240,225,190,0.08) 47%,transparent 51%,rgba(240,225,190,0.12) 58%,transparent 63%,rgba(240,225,190,0.07) 70%,transparent 76%)' }} />
      {/* drifting fog */}
      <div style={{ position: 'absolute', inset: '-10%', pointerEvents: 'none', filter: fogBlur ?? 'blur(7px)', animation: 'fog-drift 26s ease-in-out infinite', background: 'radial-gradient(ellipse 42% 26% at 28% 56%,rgba(230,210,175,0.17),transparent 70%),radial-gradient(ellipse 50% 24% at 76% 62%,rgba(215,195,160,0.13),transparent 70%)' }} />
      <div style={{ position: 'absolute', inset: '-10%', pointerEvents: 'none', filter: fogBlur ?? 'blur(9px)', animation: 'fog-drift 34s ease-in-out -14s infinite reverse', background: 'radial-gradient(ellipse 55% 22% at 55% 48%,rgba(238,220,185,0.12),transparent 72%)' }} />
      {/* film grain + scanlines */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.18, mixBlendMode: 'soft-light', backgroundImage: NOISE }} />
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.35, mixBlendMode: 'overlay', backgroundImage: 'repeating-linear-gradient(0deg,rgba(255,255,255,0.04) 0px,rgba(255,255,255,0.04) 1px,transparent 1px,transparent 4px)' }} />
      {/* particles */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {particles.map((p, i) => (
          <span key={i} style={{ position: 'absolute', left: p.x, top: p.y, opacity: Number(p.o), filter: p.blur }}>
            <span style={{ display: 'block', width: p.s, height: p.s, borderRadius: 999, background: '#f2e9d8', animation: p.anim }} />
          </span>
        ))}
      </div>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', mixBlendMode: 'multiply', background: 'radial-gradient(circle at 50% 45%,rgba(0,0,0,0) 45%,rgba(0,0,0,0.55) 100%)' }} />

      <div style={{ position: 'relative', zIndex: 10, minHeight: '100vh', display: 'grid', placeItems: 'center', textAlign: 'center', padding: '4rem 1.5rem' }}>
        <div>
          <h1 style={{ margin: 0, position: 'relative', display: 'inline-block', fontFamily: "'Benguiat Std','Rodin Pro',serif", fontSize: 'clamp(2.5rem,4.5vw,4.6rem)', fontWeight: 400, letterSpacing: '0.05em', lineHeight: 1.15, whiteSpace: 'nowrap', animation: 'tg-twitch 8s steps(1,end) 4s infinite' }}>
            {/* chromatic ghosts (reveal + idle loop) */}
            <span aria-hidden className="tgl" style={{ zIndex: 0, color: 'rgba(255,84,74,0.78)', mixBlendMode: 'screen', animation: `tg-rgbr ${A16}${loop1}` }}>{TITLE}</span>
            <span aria-hidden className="tgl" style={{ zIndex: 0, color: 'rgba(88,214,255,0.72)', mixBlendMode: 'screen', animation: `tg-rgbc ${A16}${loop2}` }}>{TITLE}</span>
            {/* smears + tears */}
            <span aria-hidden className="tgl" style={{ zIndex: 2, color: 'rgba(245,244,222,0.7)', animation: `tg-smear1 ${A16}` }}>{TITLE}</span>
            <span aria-hidden className="tgl" style={{ zIndex: 2, color: 'rgba(245,244,222,0.6)', animation: `tg-smear2 ${A16}` }}>{TITLE}</span>
            <span aria-hidden className="tgl" style={{ zIndex: 2, color: '#f5f4de', animation: `tg-tear1 ${A16}` }}>{TITLE}</span>
            <span aria-hidden className="tgl" style={{ zIndex: 2, color: '#f5f4de', animation: `tg-tear2 ${A16}` }}>{TITLE}</span>
            {/* block flash + mosaic sweeps */}
            <span aria-hidden className="tgl" style={{ zIndex: 3, animation: `tg-blocks ${A16},tg-blockjit ${A16}` }}>{FLASH_BLOCKS.map(box)}</span>
            <span aria-hidden className="tgl-wide" style={{ zIndex: 3, animation: `tg-mzlow ${A16}` }}>{MZ_LOW.map(box)}</span>
            <span aria-hidden className="tgl-wide" style={{ zIndex: 3, animation: `tg-mzmid ${A16}` }}>{MZ_MID.map(box)}</span>
            <span aria-hidden className="tgl-wide" style={{ zIndex: 3, animation: `tg-mztop ${A16}` }}>{MZ_TOP.map(box)}</span>
            <span aria-hidden className="tgl" style={{ zIndex: 3, animation: `tg-noiseblk ${A16}` }}>{NOISE_BLK.map(box)}</span>
            <span aria-hidden className="tgl" style={{ zIndex: 3, animation: `tg-after ${A16}` }}>{AFTER_BLK.map(box)}</span>
            {/* real text: white "Issei's Comm" + plate-inverted "issions" */}
            <span style={{ position: 'relative', zIndex: 1, color: '#f5f4de', textShadow: '0 0 10px rgba(255,240,220,0.35),0 0 30px rgba(255,240,220,0.15)', animation: `tg-textin ${A16}` }}>
              {"Issei's Comm"}
              <span style={{ position: 'relative', display: 'inline-block', textShadow: 'none', padding: '0 0.55em 0 0.04em', animation: `tg-ink ${A16},tg-platejit 7s steps(1,end) 4.5s infinite` }}>
                <span aria-hidden className="tg-plate" />
                <span className="tg-ink-grad">issions</span>
                <span aria-hidden className="tg-cap">issions</span>
                <span aria-hidden style={{ position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none', animation: `tg-plate ${A16}` }}>{EDGE_BITS.map(box)}</span>
                <span aria-hidden style={{ position: 'absolute', left: 0, right: 0, top: '100%', height: 10, pointerEvents: 'none', animation: `tg-plate ${A16}` }}>{BELOW_TICKS.map(box)}</span>
                <span aria-hidden style={{ position: 'absolute', left: 0, right: 0, bottom: '100%', height: 22, pointerEvents: 'none', animation: `tg-plate ${A16}` }}>{ABOVE_DEBRIS.map(box)}</span>
                <span aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', animation: `tg-plate ${A16}` }}>{PLATE_SPECKS.map(box)}</span>
              </span>
            </span>
            {/* baseline hairline */}
            <span style={{ position: 'absolute', left: '-10%', right: '-10%', height: 1, bottom: '0.06em', zIndex: 2, background: 'linear-gradient(90deg,transparent,rgba(243,233,218,0.9) 20%,rgba(243,233,218,0.9) 80%,transparent)', opacity: 0.8, animation: `tg-bit ${A16}` }} />
          </h1>

          <div style={{ position: 'relative', marginTop: '0.9rem', fontFamily: "'FOT New Cezanne','Rodin Pro',sans-serif", fontSize: 'clamp(0.8rem,1.2vw,1rem)', letterSpacing: '0.28em', color: 'rgba(243,233,218,0.7)' }}>
            <span style={{ animation: `sub-real ${A16}` }}>For the Vision of Creation</span>
            <span aria-hidden style={{ position: 'absolute', left: 0, right: 0, top: 0, animation: `sub-garble ${A16},sub-jit ${A16}` }}>{garble1}</span>
          </div>

          <div style={{ marginTop: '2.5rem', display: 'inline-flex', alignItems: 'center', gap: '1rem', fontFamily: "'FOT New Cezanne','Rodin Pro',sans-serif", color: 'rgba(243,233,218,0.85)', letterSpacing: '0.22em', fontSize: '0.8rem', animation: 'title-pulse 2.2s ease-in-out infinite,pab-jit 9s steps(1,end) 5s infinite' }}>
            <span style={{ height: 1, width: 'clamp(140px,24vw,280px)', background: 'linear-gradient(90deg,transparent,rgba(243,233,218,0.8),transparent)' }} />
            <span style={{ position: 'relative' }}>
              <span style={{ animation: `sub-real ${A16}` }}>Press Any Button</span>
              <span aria-hidden style={{ position: 'absolute', inset: 0, animation: `sub-garble ${A16}` }}>{garble2}</span>
            </span>
            <span style={{ height: 1, width: 'clamp(140px,24vw,280px)', background: 'linear-gradient(90deg,transparent,rgba(243,233,218,0.8),transparent)' }} />
          </div>
        </div>
      </div>
    </div>
  )
}

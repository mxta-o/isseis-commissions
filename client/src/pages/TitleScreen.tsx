import React, { useMemo } from 'react'
import { genGarble } from '../lib/commissions'

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
// The plate behind "…missions", in the wordmark SVG's own units (1100 x 136, baseline rule at
// y=124). Each entry is [x, y, width, height]. PLATE is what the plate covers: the solid block,
// the three steps eaten out of its top-left corner, the strip running left along the baseline,
// and the loose debris above and beside it. PLATE_HOLES are notches punched back out of it.
// The left edge sits mid-way through the second "m", so that letter is half cream, half dark.
// Positions are deliberate (placed against Marcellus at 116px); don't randomise.
type Rect = [number, number, number, number, number?]
const PLATE: Rect[] = [
  [706, 40, 335, 84], [690, 48, 16, 76], [676, 60, 14, 64], [664, 74, 12, 50],
  [656, 84, 8, 8], [650, 100, 14, 6], [658, 110, 6, 6], [600, 116, 40, 8], [646, 116, 18, 8],
  [678, 48, 8, 6], [662, 62, 8, 6], [644, 70, 6, 6], [636, 90, 5, 5],
  [708, 30, 20, 7], [734, 33, 8, 7], [748, 26, 12, 6], [800, 34, 8, 6], [722, 20, 8, 6],
  [818, 33, 14, 7], [846, 35, 6, 5], [790, 22, 6, 6],
]
const PLATE_HOLES: Rect[] = [
  [664, 92, 8, 8], [672, 74, 8, 6], [684, 60, 8, 6], [700, 48, 8, 6], [676, 104, 6, 6], [712, 40, 12, 5], [690, 80, 6, 6],
]
// two grey fragments in the debris band (last number is opacity)
const PLATE_GREY: Rect[] = [[770, 31, 24, 9], [756, 16, 10, 6, 0.7]]
const rect = ([x, y, w, h, o]: Rect, i: number) => <rect key={i} x={x} y={y} width={w} height={h} opacity={o} />
// where the title text sits inside the SVG
const T = { x: 59, y: 123, fontSize: 116 }

type Particle = { x: string; y: string; s: string; o: string; blur: string; anim: string }
function genParticles(): Particle[] {
  const pts: (Particle & { px: number; py: number })[] = []
  const minD = 5.5
  let guard = 0
  while (pts.length < 60 && guard++ < 4000) {
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
      blur: Math.random() < 0.3 ? `blur(${(0.5 + Math.random() * 0.5).toFixed(1)}px)` : 'none',
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
  const particles = useMemo(genParticles, [])
  const garble1 = useMemo(() => genGarble('For the Vision of Creation'), [])
  const garble2 = useMemo(() => genGarble('Click Anywhere'), [])

  return (
    <div onClick={onAdvance} style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden', background: '#14110c', color: '#f3e9da', cursor: 'pointer', userSelect: 'none' }}>
      {/* dusk sky */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#221c15 0%,#1a1510 55%,#14110c 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 62% 44% at 50% 40%,rgba(238,216,178,0.5),rgba(180,148,108,0.22) 45%,transparent 72%)' }} />
      {/* god rays */}
      <div style={{ position: 'absolute', left: '50%', top: '-8%', width: '130%', height: '85%', transform: 'translateX(-50%)', pointerEvents: 'none', animation: 'ray-pulse 9s ease-in-out infinite', background: 'conic-gradient(from 90deg at 50% 0%,transparent 22%,rgba(240,225,190,0.09) 26%,transparent 30%,rgba(240,225,190,0.13) 37%,transparent 42%,rgba(240,225,190,0.08) 47%,transparent 51%,rgba(240,225,190,0.12) 58%,transparent 63%,rgba(240,225,190,0.07) 70%,transparent 76%)', WebkitMaskImage: 'linear-gradient(180deg,#000 0%,#000 55%,transparent 92%)', maskImage: 'linear-gradient(180deg,#000 0%,#000 55%,transparent 92%)' }} />
      {/* drifting fog */}
      <div style={{ position: 'absolute', inset: '-10%', pointerEvents: 'none', filter: 'blur(7px)', animation: 'fog-drift 26s ease-in-out infinite', background: 'radial-gradient(ellipse 42% 26% at 28% 56%,rgba(230,210,175,0.17),transparent 70%),radial-gradient(ellipse 50% 24% at 76% 62%,rgba(215,195,160,0.13),transparent 70%)' }} />
      <div style={{ position: 'absolute', inset: '-10%', pointerEvents: 'none', filter: 'blur(9px)', animation: 'fog-drift 34s ease-in-out -14s infinite reverse', background: 'radial-gradient(ellipse 55% 22% at 55% 48%,rgba(238,220,185,0.12),transparent 72%)' }} />
      {/* film grain + scanlines */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.18, mixBlendMode: 'soft-light', backgroundImage: NOISE }} />
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.35, mixBlendMode: 'overlay', backgroundImage: 'repeating-linear-gradient(0deg,rgba(255,255,255,0.04) 0px,rgba(255,255,255,0.04) 1px,transparent 1px,transparent 4px)' }} />
      {/* hollow rings cut off by two opposite corners; sized in vw so they stay clear of the title */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <span style={{ position: 'absolute', left: '-22.9vw', top: '-22.9vw', width: '52.8vw', height: '52.8vw', border: '1px solid rgba(243,233,218,0.16)', borderRadius: '50%' }} />
        <span style={{ position: 'absolute', left: '-20.8vw', top: '-20.8vw', width: '48.6vw', height: '48.6vw', border: '1px solid rgba(243,233,218,0.1)', borderRadius: '50%' }} />
        <span style={{ position: 'absolute', right: '-26.4vw', bottom: '-29.2vw', width: '62.5vw', height: '62.5vw', border: '1px solid rgba(243,233,218,0.16)', borderRadius: '50%' }} />
        <span style={{ position: 'absolute', right: '-24.3vw', bottom: '-27.1vw', width: '58.3vw', height: '58.3vw', border: '1px solid rgba(243,233,218,0.1)', borderRadius: '50%' }} />
      </div>
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
          {/* The wordmark is an SVG so the plate can be one mask: everything inside the mask is cream
              with dark letters, everything outside is cream letters on the sky. The h1 is sized in em
              (9.483em x 1.172em = the 1100x136 viewBox at 116px type) so the glitch layers still line up. */}
          <h1 aria-label={TITLE} style={{ margin: 0, position: 'relative', display: 'inline-block', fontFamily: 'var(--font-title)', fontSize: 'clamp(1.6rem,6.3vw,5.45rem)', fontWeight: 400, lineHeight: 1, animation: 'tg-twitch 8s steps(1,end) 4s infinite' }}>
            <svg aria-hidden viewBox="0 0 1100 136" style={{ display: 'block', width: '9.483em', height: '1.172em', overflow: 'visible' }}>
              <defs>
                <mask id="tw-plate" maskUnits="userSpaceOnUse" x="0" y="0" width="1100" height="136">
                  <g fill="#fff">{PLATE.map(rect)}</g>
                  <g fill="#000">{PLATE_HOLES.map(rect)}</g>
                </mask>
                <linearGradient id="tw-line" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0" stopColor="#f3e9da" stopOpacity="0" /><stop offset="0.12" stopColor="#f3e9da" stopOpacity="0.9" />
                  <stop offset="0.88" stopColor="#f3e9da" stopOpacity="0.9" /><stop offset="1" stopColor="#f3e9da" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* chromatic ghosts (reveal + idle loop) */}
              <text {...T} fill="rgba(255,84,74,0.78)" style={{ opacity: 0, mixBlendMode: 'screen', animation: `tg-rgbr ${A16},tg-loop1 7s steps(1,end) 4.5s infinite` }}>{TITLE}</text>
              <text {...T} fill="rgba(88,214,255,0.72)" style={{ opacity: 0, mixBlendMode: 'screen', animation: `tg-rgbc ${A16},tg-loop2 7.6s steps(1,end) 4.9s infinite` }}>{TITLE}</text>
              {/* the settled wordmark */}
              <g style={{ animation: `tg-textin ${A16}` }}>
                <text {...T} fill="#f5f4de">{TITLE}</text>
                <g style={{ animation: `tg-plate ${A16},tg-platejit 7s steps(1,end) 4.5s infinite` }}>
                  <rect width="1100" height="136" fill="#f5f4de" mask="url(#tw-plate)" />
                  <text {...T} fill="#25202a" mask="url(#tw-plate)">{TITLE}</text>
                  <g fill="#a49e8f">{PLATE_GREY.map(rect)}</g>
                </g>
              </g>
              {/* smears + tears */}
              <text {...T} fill="rgba(245,244,222,0.7)" style={{ opacity: 0, animation: `tg-smear1 ${A16}` }}>{TITLE}</text>
              <text {...T} fill="rgba(245,244,222,0.6)" style={{ opacity: 0, animation: `tg-smear2 ${A16}` }}>{TITLE}</text>
              <text {...T} fill="#f5f4de" style={{ opacity: 0, animation: `tg-tear1 ${A16}` }}>{TITLE}</text>
              <text {...T} fill="#f5f4de" style={{ opacity: 0, animation: `tg-tear2 ${A16}` }}>{TITLE}</text>
              {/* baseline hairline */}
              <rect x="-70" y="124" width="1240" height="1" fill="url(#tw-line)" style={{ animation: `tg-bit ${A16}` }} />
            </svg>
            {/* block flash + mosaic sweeps */}
            <span aria-hidden className="tgl" style={{ zIndex: 3, animation: `tg-blocks ${A16},tg-blockjit ${A16}` }}>{FLASH_BLOCKS.map(box)}</span>
            <span aria-hidden className="tgl-wide" style={{ zIndex: 3, animation: `tg-mzlow ${A16}` }}>{MZ_LOW.map(box)}</span>
            <span aria-hidden className="tgl-wide" style={{ zIndex: 3, animation: `tg-mzmid ${A16}` }}>{MZ_MID.map(box)}</span>
            <span aria-hidden className="tgl-wide" style={{ zIndex: 3, animation: `tg-mztop ${A16}` }}>{MZ_TOP.map(box)}</span>
            <span aria-hidden className="tgl" style={{ zIndex: 3, animation: `tg-noiseblk ${A16}` }}>{NOISE_BLK.map(box)}</span>
            <span aria-hidden className="tgl" style={{ zIndex: 3, animation: `tg-after ${A16}` }}>{AFTER_BLK.map(box)}</span>
          </h1>

          <div style={{ position: 'relative', marginTop: '0.9rem', paddingLeft: '0.28em', fontFamily: 'var(--font-accent)', fontSize: 'clamp(0.8rem,1.2vw,1rem)', letterSpacing: '0.28em', color: 'rgba(243,233,218,0.7)' }}>
            <span style={{ animation: `sub-real ${A16}` }}>For the Vision of Creation</span>
            <span aria-hidden style={{ position: 'absolute', left: '0.28em', right: 0, top: 0, animation: `sub-garble ${A16},sub-jit ${A16}` }}>{garble1}</span>
          </div>

          <div style={{ marginTop: '2.5rem', display: 'inline-flex', alignItems: 'center', gap: '1rem', fontFamily: 'var(--font-accent)', color: 'rgba(243,233,218,0.85)', letterSpacing: '0.22em', fontSize: '0.8rem', animation: 'title-pulse 2.2s ease-in-out infinite,pab-jit 9s steps(1,end) 5s infinite' }}>
            <span style={{ height: 1, width: 'clamp(140px,24vw,280px)', background: 'linear-gradient(90deg,transparent,rgba(243,233,218,0.8),transparent)' }} />
            <span style={{ position: 'relative', paddingLeft: '0.22em' }}>
              <span style={{ animation: `sub-real ${A16}` }}>Click Anywhere</span>
              <span aria-hidden style={{ position: 'absolute', inset: '0 0 0 0.22em', animation: `sub-garble ${A16}` }}>{garble2}</span>
            </span>
            <span style={{ height: 1, width: 'clamp(140px,24vw,280px)', background: 'linear-gradient(90deg,transparent,rgba(243,233,218,0.8),transparent)' }} />
          </div>
        </div>
      </div>

      {/* licence line */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 34, zIndex: 10, padding: '0 1rem 0 calc(1rem + 0.22em)', textAlign: 'center', fontFamily: 'var(--font-accent)', fontSize: 'clamp(6px,0.8vw,11px)', letterSpacing: '0.22em', color: 'rgba(243,233,218,0.8)', animation: `sub-real ${A16}` }}>
        © {new Date().getFullYear()} ISSEI · ALL ARTWORK BELONGS TO THE ARTIST
      </div>
    </div>
  )
}

import React from 'react'
import { ScreenHead, type Screen } from './AppFrame'
import { LEGAL_UPDATED, type LegalSection } from '../lib/legal'

type Props = {
  title: string
  sub: string
  intro: string
  sections: LegalSection[]
  nav: (s: Screen) => void
  other: { screen: Screen; label: string }
}

// A legal text on a wide panel, set in columns so it doesn't run to a very long single scroll.
// Text size is the --legal-font variable in nier.css.
export default function LegalPage({ title, sub, intro, sections, nav, other }: Props): React.ReactElement {
  return (
    <div className="screen-in">
      <ScreenHead title={title} sub={sub} />
      <div className="n-panel" style={{ marginTop: 22 }}>
        <div className="n-panel-head"><span className="sq" aria-hidden /><span className="grow">{title}</span><small>Updated {LEGAL_UPDATED}</small></div>
        <div className="legal-body">
          <div className="legal-top">
            <div className="legal-intro">{intro}</div>
            <div className="legal-actions">
              <button className="btn-ghost" onClick={() => nav(other.screen)}><span className="sq" aria-hidden />{other.label}</button>
            </div>
          </div>
          <div className="legal-cols">
            {sections.map((s, i) => (
              <section key={s.heading} className={`legal-sec${(s.bullets?.length ?? 0) >= 4 ? ' flow' : ''}`}>
                <h2>{`${i + 1}. ${s.heading}`}</h2>
                {s.paragraphs?.map(p => <p key={p}>{p}</p>)}
                {s.bullets && (
                  <ul>
                    {s.bullets.map(b => <li key={b}><span className="dia" aria-hidden />{b}</li>)}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

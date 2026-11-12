import React from 'react'
import LegalPage from '../components/LegalPage'
import { CONTACT_LINE, type LegalSection } from '../lib/legal'
import type { Screen } from '../components/AppFrame'

const SECTIONS: LegalSection[] = [
  {
    heading: 'Who this is with',
    paragraphs: [
      'Commissions on this site are drawn by Loraine (isseimx), referred to below as "the artist". By submitting a request you agree to these terms.',
    ],
  },
  {
    heading: 'Requests and review',
    paragraphs: ['Submitting a request is not a purchase. Every request is reviewed first, and the artist can accept or decline any request, including anything on the Won\'t Draw list.'],
    bullets: [
      'One request per email address every 30 minutes.',
      'Your email address must be verified with a 6-digit code before a request is submitted.',
      'Nothing is owed unless your request is accepted.',
    ],
  },
  {
    heading: 'Prices',
    paragraphs: ['All prices are in Canadian dollars (CAD). The artist sets the final price when accepting a request. You will see it in the acceptance email and on the status page before you pay. Typical ranges:'],
    bullets: ['Sketch: $5–10 CAD', 'Full illustration: $10–20 CAD', 'Scene: $25+ CAD'],
  },
  {
    heading: 'Payment',
    bullets: [
      'Pay only after your request is accepted, and only through Ko-fi, the artist\'s payment page. Ko-fi is a separate service with its own terms, fees and privacy policy.',
      'Send exactly the accepted amount and put your payment reference in the Ko-fi message so the payment can be matched to your request.',
      'You have 24 hours from acceptance to pay. The artist confirms payments by hand, and an unpaid request may be cancelled after the deadline.',
    ],
  },
  {
    heading: 'Delivery and revisions',
    paragraphs: [
      'Delivery is final and there are no revision rounds, so put everything you want in the description: references, palette, mood and pose.',
      'Finished artwork is delivered as a download from your status page. No delivery date is guaranteed unless the artist gives you one when accepting.',
    ],
  },
  {
    heading: 'Cancellations and refunds',
    bullets: [
      'If the artist declines or cancels your request before you have paid, nothing is owed.',
      'If the artist cancels or cannot finish a commission you have already paid for, you will be refunded in full.',
      'Once work is in progress, payments are otherwise non-refundable.',
    ],
  },
  {
    heading: 'What you send',
    paragraphs: ['You confirm that you are allowed to share any reference files you upload and that they are not illegal. The artist will not draw real people without their consent, or the other content on the Won\'t Draw list.'],
  },
  {
    heading: 'Who owns the artwork',
    bullets: [
      'The artist keeps the copyright in the artwork. You receive the finished piece to use for personal, non-commercial purposes, including sharing it online with credit to the artist.',
      'Commercial use (selling it, putting it on merchandise, using it in ads, games or published works) needs the artist\'s written permission and may cost extra.',
      'You may not use the artwork to train AI models or generate similar images with AI.',
      'The artist may show the finished work in their portfolio and on social media. Ask before delivery if you would like it kept private.',
      'Fan art depicts characters owned by someone else. It is made for personal use, and what you do with it beyond that is your responsibility.',
    ],
  },
  {
    heading: 'Using the site',
    paragraphs: ['Please do not spam the request form, try to break or overload the site, or use automated tools to submit requests. Requests may be rate-limited or blocked if you do.'],
  },
  {
    heading: 'Liability',
    paragraphs: ['The site and its services are provided as they are. To the extent the law allows, the artist is not liable for indirect or consequential losses, and total liability for any commission is limited to the amount you paid for it. Nothing here takes away rights you have under consumer law that cannot be waived.'],
  },
  {
    heading: 'Governing law',
    paragraphs: ['These terms are governed by the laws of the Province of Ontario and the federal laws of Canada that apply there. Any dispute will be handled by the courts of Ontario, but nothing here limits a right you have under consumer protection law to bring a claim where you live.'],
  },
  {
    heading: 'Changes and contact',
    paragraphs: [
      'These terms may be updated. The date at the top shows the latest version, and a request is covered by the terms in force when you submitted it.',
      `Questions about these terms or a commission: ${CONTACT_LINE}.`,
    ],
  },
]

export default function Terms({ nav }: { nav: (s: Screen) => void }): React.ReactElement {
  return (
    <LegalPage
      title="TERMS" sub="Requests, Payment & Rights" nav={nav} sections={SECTIONS}
      intro="Plain-language rules for commissioning through this site. Please read them before sending a request."
      other={{ screen: 'privacy', label: 'Privacy Notice' }}
    />
  )
}

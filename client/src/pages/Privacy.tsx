import React from 'react'
import LegalPage from '../components/LegalPage'
import { CONTACT_LINE, CONTACT_SENTENCE, type LegalSection } from '../lib/legal'
import type { Screen } from '../components/AppFrame'

const SECTIONS: LegalSection[] = [
  {
    heading: 'Who runs this site',
    paragraphs: [`This site is run by Loraine (isseimx), based in Ontario, Canada, who decides how your information is used. To ask about your data, ${CONTACT_LINE}.`],
  },
  {
    heading: 'What we collect',
    bullets: [
      'Your email address, to send you a verification code and to email you about your request.',
      'The verification code itself, kept only as a one-way hash. It stops working after 10 minutes and is deleted once it has been used.',
      'Your request: title, description, commission type, and any reference images you upload (JPG, PNG or WEBP).',
      'Order details we create: a tracking ID, the status of your request, the price, the payment deadline, when payment was received, and a reason if a request was declined or cancelled.',
      'The finished artwork we upload for you to download.',
      'Your IP address, used briefly in the server\'s memory to limit how fast requests can be sent. We do not save it in our database, though our hosting and network providers may keep routine logs.',
    ],
  },
  {
    heading: 'Payments',
    paragraphs: ['Payments are made on Ko-fi, not on this site. We never see your card or bank details. We note that a payment was received and match it to your request using your payment reference. Ko-fi\'s own privacy policy applies to what you give them.'],
  },
  {
    heading: 'Cookies and tracking',
    paragraphs: ['This site does not use advertising, analytics or tracking cookies, and does not store anything about you in your browser. Its fonts are served from the site itself, so your browser does not contact Google for them. Only the artist signs in, using a separate admin login.'],
  },
  {
    heading: 'Why we use it',
    paragraphs: ['To verify your email, review and carry out your commission, tell you where it stands, take payment through Ko-fi, deliver the finished work and prevent abuse of the form. Where privacy law asks for a legal basis, that is carrying out the commission you asked for, and the artist\'s legitimate interest in keeping the site safe. We do not sell your information or use it for advertising.'],
  },
  {
    heading: 'Who else handles it',
    paragraphs: ['A few services process data on the artist\'s behalf:'],
    bullets: [
      'Supabase: stores the database and your uploaded and finished files, in a private store that is only reachable through short-lived signed links.',
      'Resend: sends the emails (verification code, receipts and status updates), so it sees your address and the email text.',
      'Ko-fi: handles payment, if you pay.',
      'Our hosting and domain providers: serve the site and may log visits.',
    ],
  },
  {
    heading: 'Where it is kept',
    paragraphs: ['These providers may store and process data in other countries, including outside your own. We choose providers that protect it, but the laws there may differ from yours.'],
  },
  {
    heading: 'How long we keep it',
    paragraphs: ['Request details and files are kept for as long as needed to deliver the commission, handle any questions afterwards and keep basic records. Nothing is deleted automatically yet, so ask us to delete your request and files whenever you like and we will, except for payment records we have to keep.'],
  },
  {
    heading: 'Your choices',
    paragraphs: [`You can ask to see what we hold about you, correct it, or delete it. ${CONTACT_SENTENCE}. If you are unhappy with an answer, you can complain to your local privacy or data protection authority, for example the Office of the Privacy Commissioner of Canada (priv.gc.ca).`],
  },
  {
    heading: 'Security',
    paragraphs: ['Files sit in a private store, access to requests is limited to the artist\'s admin login, and verification codes are hashed. No system is perfectly secure, so please do not put sensitive personal information in a request.'],
  },
  {
    heading: 'Children',
    paragraphs: ['This site is not aimed at children under 13. If you are under the age of majority where you live, please ask a parent or guardian before commissioning.'],
  },
  {
    heading: 'Changes',
    paragraphs: ['If we change how we handle your information we will update this notice and its date.'],
  },
]

export default function Privacy({ nav }: { nav: (s: Screen) => void }): React.ReactElement {
  return (
    <LegalPage
      title="PRIVACY" sub="What We Collect & Why" nav={nav} sections={SECTIONS}
      intro="What this site collects when you request a commission, why, who else handles it, and how to have it removed."
      other={{ screen: 'terms', label: 'Terms' }}
    />
  )
}

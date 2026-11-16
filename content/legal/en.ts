import { COMPANY, dash } from '../company'
import type { LegalDoc } from './types'

type Slug = 'kvkk' | 'privacy' | 'terms' | 'cookies' | 'distance-sales'

const UPDATED = '2026-11-14'

const controllerTable = {
  type: 'table' as const,
  head: ['Item', 'Value'],
  rows: [
    ['Name', COMPANY.name],
    ['Address', dash(COMPANY.address)],
    ['Email', dash(COMPANY.email)],
    ['Registered email (KEP)', dash(COMPANY.kep)],
    ['MERSIS no', dash(COMPANY.mersis)],
  ],
}

/** English versions. The Turkish texts are the legally binding ones. */
export const legalEn: Record<Slug, LegalDoc> = {
  kvkk: {
    title: 'Personal Data Notice (KVKK)',
    description: 'What personal data StudioDesk processes, why, and your rights under Turkish law No. 6698.',
    updated: UPDATED,
    sections: [
      {
        heading: 'Data controller',
        blocks: [
          {
            type: 'p',
            text: `This notice is given under Article 10 of the Turkish Personal Data Protection Law No. 6698 ("KVKK"). ${COMPANY.product} is operated by ${COMPANY.name}. The Turkish version of this notice prevails.`,
          },
          controllerTable,
          {
            type: 'p',
            text: `${COMPANY.name} is the controller for account holders, people who request a demo and website visitors. For student and instructor data that studios enter into ${COMPANY.product}, the studio is the controller and ${COMPANY.name} processes that data on the studio's behalf and instructions. Students and instructors should contact their studio first.`,
          },
        ],
      },
      {
        heading: 'Data, purposes and legal grounds',
        blocks: [
          {
            type: 'table',
            head: ['Who', 'Data', 'Purpose', 'Legal ground (KVKK Art. 5)'],
            rows: [
              ['Account holders (studio owner, managers, staff)', 'Name, email, password hash, role, organisation membership, activity records', 'Running the account, sign-in, permissions, support', 'Performance of a contract; legitimate interest (security, abuse prevention)'],
              ['Studio students (on the studio’s behalf)', 'Name, email, phone, notes, enrolments, packages and credits, attendance', 'Running the studio’s classes, packages and attendance', 'Contract between studio and student (as set by the studio)'],
              ['Instructors (on the studio’s behalf)', 'Name, email, phone, lessons taught, pay rates and earnings', 'Assigning classes, calculating pay', 'Contract between studio and instructor (as set by the studio)'],
              ['People requesting a demo', 'Name, studio name, phone, email, city, student count range, message', 'Replying, presenting the product, planning setup', 'Steps prior to a contract; legitimate interest'],
              ['Website visitors', 'IP address, browser and device data, server logs; with consent, anonymous visit statistics', 'Security and operation; with consent, measuring site use', 'Legitimate interest; explicit consent for analytics'],
            ],
          },
          { type: 'p', text: 'We do not collect special categories of data (health, biometrics, etc.) and ask studios not to put such data in notes. We do not currently send marketing messages; if we ever do, we will ask for consent first.' },
        ],
      },
      {
        heading: 'Transfers',
        blocks: [
          { type: 'p', text: 'We never sell personal data or share it for advertising. Data is shared only as needed to run the service:' },
          {
            type: 'ul',
            items: [
              'Infrastructure providers: Supabase for database and authentication (EU, Frankfurt), Vercel for hosting and analytics.',
              'The studio’s own authorised users, according to their role.',
              'Public authorities, when legally required and only to the extent required.',
            ],
          },
          { type: 'p', text: 'Because provider servers are outside Turkey, data is transferred abroad under KVKK Article 9, relying on the standard contracts published by the Board or other safeguards provided by law.' },
        ],
      },
      {
        heading: 'How data is collected',
        blocks: [{ type: 'p', text: 'Electronically: through sign-up and demo forms, information studio users enter in the app, attendance and sales actions, and activity and server logs recorded automatically.' }],
      },
      {
        heading: 'Retention',
        blocks: [
          {
            type: 'ul',
            items: [
              'Account data: while the account is open, then as long as legal obligations require.',
              'Studio data (students, instructors, attendance, cash): until the studio deletes it or the contract ends, then removed after a reasonable backup period.',
              'Demo requests: up to 1 year after the request is closed.',
              'Invoices and accounting records: for the period required by law.',
            ],
          },
        ],
      },
      {
        heading: 'Your rights',
        blocks: [
          { type: 'p', text: 'Under KVKK Article 11 you may ask whether your data is processed, request information about it, learn the purpose and whether it is used accordingly, know who it is transferred to, have it corrected, deleted or destroyed where conditions are met, have these steps notified to recipients, object to adverse results of solely automated analysis, and claim compensation for damage caused by unlawful processing.' },
          { type: 'p', text: 'Send requests in writing, via KEP, with a secure electronic or mobile signature, or from the email address registered with us, to the contact details above. We reply free of charge within 30 days; if the request involves extra cost, the Board’s tariff may apply. You may complain to the Personal Data Protection Board if your request is refused or the reply is insufficient.' },
        ],
      },
    ],
  },

  privacy: {
    title: 'Privacy Policy',
    description: 'How StudioDesk protects and uses data.',
    updated: UPDATED,
    sections: [
      {
        heading: 'In short',
        blocks: [
          {
            type: 'ul',
            items: [
              'We do not sell your data or use it for advertising.',
              'Your studio’s data is visible only to your studio’s authorised users.',
              'Analytics runs only on the public pages and only with your consent; never inside the app.',
              'See the Personal Data Notice (KVKK) for details and your rights.',
            ],
          },
        ],
      },
      {
        heading: 'What we process',
        blocks: [{ type: 'p', text: `${COMPANY.product} is a tool for studios to manage students, instructors, classes, packages, attendance and cash. The studio enters this information and we store it on the studio’s behalf. When an account is opened we process name, email and role; for a demo request, what you share in the form.` }],
      },
      {
        heading: 'Separation between studios',
        blocks: [{ type: 'p', text: 'Each studio’s data is kept separate. Row-level access rules in the database and organisation checks on the server stop users of one studio from seeing another studio’s data. Users can only do what their role allows.' }],
      },
      {
        heading: 'Security',
        blocks: [
          {
            type: 'ul',
            items: [
              'All connections are encrypted with HTTPS.',
              'Passwords are never stored in plain text; authentication is handled by Supabase Auth.',
              'Accounts opened by an administrator must change their password on first sign-in.',
              'Important actions (sales, attendance, deletions) are recorded in the activity history.',
            ],
          },
        ],
      },
      {
        heading: 'Service providers',
        blocks: [
          {
            type: 'table',
            head: ['Provider', 'Used for', 'Location'],
            rows: [
              ['Supabase', 'Database, authentication', 'European Union (Frankfurt)'],
              ['Vercel', 'Hosting; with consent, anonymous visit analytics', 'Global edge network'],
            ],
          },
        ],
      },
      {
        heading: 'Deleting your data',
        blocks: [{ type: 'p', text: 'Studios can delete student, instructor and course records in the app. To delete your account or all of your studio’s data, write to us; once the request is verified we delete the data, except records we must keep by law.' }],
      },
      {
        heading: 'Changes',
        blocks: [{ type: 'p', text: 'When we update this policy we change the date at the top. We notify account holders separately about significant changes.' }],
      },
    ],
  },

  terms: {
    title: 'Terms of Use',
    description: 'The terms for using StudioDesk.',
    updated: UPDATED,
    sections: [
      {
        heading: 'Parties and scope',
        blocks: [{ type: 'p', text: `These terms apply to studios and their users who use ${COMPANY.product}, provided by ${COMPANY.name}. By using the service you accept them. If a separate agreement or order form exists with the studio, it prevails where they conflict. The Turkish version prevails.` }],
      },
      {
        heading: 'Accounts',
        blocks: [
          {
            type: 'ul',
            items: [
              'Accounts are opened for a studio; the studio owner can add team members with roles.',
              'You are responsible for keeping your sign-in details private. Tell us immediately about unauthorised use.',
              'An account should be used only by the person it was created for.',
            ],
          },
        ],
      },
      {
        heading: 'Studio responsibilities',
        blocks: [
          {
            type: 'ul',
            items: [
              'You are the controller of the student and instructor data you enter, and are responsible for informing those people and having a legal ground.',
              'You may not use the service unlawfully, in a way that infringes others’ rights, or in a way that endangers its security.',
              'You set your prices, packages and credit rules and are responsible for them.',
            ],
          },
        ],
      },
      {
        heading: 'Providing the service',
        blocks: [{ type: 'p', text: 'We aim to run the service with reasonable care and without interruption, but maintenance, updates or provider issues can cause downtime. We announce planned maintenance in advance where possible. We may improve and change features, and will give notice before removing a core one.' }],
      },
      {
        heading: 'Fees',
        blocks: [{ type: 'p', text: 'Scope, price and payment terms of paid use are set in the quote or order form agreed with the studio. If payment is overdue we may restrict access after notice; your data is not deleted.' }],
      },
      {
        heading: 'Intellectual property',
        blocks: [{ type: 'p', text: `The ${COMPANY.product} software, design and brand belong to ${COMPANY.name}. The data you enter is yours; we use it only to provide the service.` }],
      },
      {
        heading: 'Limitation of liability',
        blocks: [{ type: 'p', text: 'To the extent the law allows, we are not liable for indirect damage or loss of profit. Our total liability is limited to what you paid for the service in the 12 months before the event. Intent and gross negligence are excluded from this limit.' }],
      },
      {
        heading: 'Termination',
        blocks: [{ type: 'p', text: 'You can stop using the service at any time. We may suspend or close an account for serious breach of these terms. After termination, on request, we give you reasonable time to export your data.' }],
      },
      {
        heading: 'Governing law',
        blocks: [{ type: 'p', text: 'Turkish law applies. Istanbul courts and enforcement offices have jurisdiction; consumers keep the jurisdiction of consumer arbitration committees and courts provided by law.' }],
      },
    ],
  },

  cookies: {
    title: 'Cookie Policy',
    description: 'The cookies StudioDesk uses and how to manage your choices.',
    updated: UPDATED,
    sections: [
      {
        heading: 'Cookies we use',
        blocks: [
          { type: 'p', text: 'We only use cookies and browser storage needed to run the service. We do not use advertising or profiling cookies.' },
          {
            type: 'table',
            head: ['Name', 'Type', 'Purpose', 'Duration'],
            rows: [
              ['sb-…-auth-token', 'Necessary (cookie)', 'Keeps you signed in and verifies your account (Supabase)', 'Session; removed on sign-out'],
              ['organization_id', 'Necessary (cookie)', 'Remembers the selected studio if you belong to several', '7 days'],
              ['NEXT_LOCALE', 'Necessary (cookie)', 'Remembers your language', 'Browser session'],
              ['studiodesk-consent', 'Necessary (browser storage)', 'Remembers your cookie choice', '1 year'],
            ],
          },
        ],
      },
      {
        heading: 'Analytics (only with your consent)',
        blocks: [{ type: 'p', text: 'With your consent we count anonymous visits on the public pages (home, blog, legal pages) with Vercel Web Analytics. It uses no cookies and does not follow you across sites. Analytics never runs in the app, the admin screens or the sign-in page.' }],
      },
      {
        heading: 'Managing your choices',
        blocks: [
          {
            type: 'ul',
            items: [
              'Use the "Cookie preferences" link at the bottom of the page to give or withdraw consent at any time.',
              'You can delete or block cookies in your browser. Blocking necessary cookies stops sign-in and language memory from working.',
            ],
          },
        ],
      },
    ],
  },

  'distance-sales': {
    title: 'Distance Sales and Refunds',
    description: 'Sales, withdrawal and refund terms for StudioDesk subscriptions.',
    updated: UPDATED,
    sections: [
      { heading: 'Seller', blocks: [controllerTable] },
      {
        heading: 'Subject and scope',
        blocks: [{ type: 'p', text: `This text sets out the terms for selling ${COMPANY.product} at a distance. The service is mainly sold to studios teaching classes such as dance, Pilates, yoga, martial arts or music, acting for business purposes; for them, the terms in the quote or order form apply. Where the buyer is a consumer under Turkish Consumer Protection Law No. 6502, the Distance Contracts Regulation also applies. The Turkish version prevails.` }],
      },
      {
        heading: 'Service, price and payment',
        blocks: [{ type: 'p', text: 'Scope (users, branches, term), total price, taxes and payment method are given to the buyer in writing before ordering; the contract is formed when the order is confirmed. The subscription runs for the term in the order form and renews on the same terms unless cancelled.' }],
      },
      {
        heading: 'Delivery',
        blocks: [{ type: 'p', text: 'The service starts within 3 business days of payment, when the account is opened and sign-in details are sent.' }],
      },
      {
        heading: 'Right of withdrawal (consumers)',
        blocks: [{ type: 'p', text: 'A consumer may withdraw within 14 days of the contract without giving a reason, by writing to the contact details above. Under Article 15 of the Distance Contracts Regulation, the right does not apply to services started with the consumer’s approval before the period ends; we ask for that approval separately before opening the account.' }],
      },
      {
        heading: 'Refunds',
        blocks: [
          {
            type: 'ul',
            items: [
              'After a valid withdrawal, we refund the amount paid within 14 days, using the original payment method.',
              'For business buyers, refund terms are set in the order form. Unused time after a term has started is not refunded; notice before the end of the term is enough to stop renewal.',
              'If we cannot provide the service for reasons on our side, we refund the fee for that period.',
            ],
          },
        ],
      },
      {
        heading: 'Disputes',
        blocks: [{ type: 'p', text: 'Consumers can apply to consumer arbitration committees or consumer courts within the limits announced yearly by the Ministry of Trade. For business buyers, Istanbul courts and enforcement offices have jurisdiction.' }],
      },
    ],
  },
}

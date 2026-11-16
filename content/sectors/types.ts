import type { BusinessType } from '@/lib/business/types'

/** A landing page for one kind of studio (dance, Pilates/yoga, …). */
export interface Sector {
  /** Same in every language; also the business type it stands for */
  key: Exclude<BusinessType, 'other'>
  /** URL slug in this language, under /for/ */
  slug: string
  /** Short name for cards and menus */
  name: string
  /** One line for the card on the home page */
  cardText: string
  /** Class types shown as chips */
  examples: string[]
  metaTitle: string
  description: string
  keywords: string[]
  heroTitle: string
  heroLead: string
  /** What goes wrong without a system */
  pains: { title: string; text: string }[]
  /** How StudioDesk handles this kind of studio */
  fit: { title: string; text: string }[]
  /** A worked example of how such a studio is set up */
  setup: { title: string; items: string[] }
  faq: { q: string; a: string }[]
  /** Blog post keys to link to */
  blogKeys: string[]
}

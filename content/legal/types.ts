import type { ContentBlock } from '../blog/types'

export type LegalBlock = Extract<ContentBlock, { type: 'p' | 'ul' | 'table' }>

export interface LegalSection {
  heading: string
  blocks: LegalBlock[]
}

export interface LegalDoc {
  title: string
  description: string
  /** YYYY-MM-DD */
  updated: string
  sections: LegalSection[]
}

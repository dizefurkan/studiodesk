export type ContentBlock =
  | { type: 'h2'; text: string }
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'table'; head: string[]; rows: string[][] }
  | { type: 'tip'; text: string }

export interface BlogPost {
  slug: string
  title: string
  description: string
  category: string
  /** YYYY-MM-DD */
  date: string
  readingMinutes: number
  body: ContentBlock[]
}

export type ContentBlock =
  | { type: 'h2'; text: string }
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'table'; head: string[]; rows: string[][] }
  | { type: 'tip'; text: string }

export interface BlogPost {
  /** Same in every language; links a post to its translation */
  key: string
  /** URL slug in this post's language */
  slug: string
  title: string
  description: string
  category: string
  /** YYYY-MM-DD */
  date: string
  /** YYYY-MM-DD, when the content last changed meaningfully */
  updated?: string
  /** Search phrases this post targets (meta keywords + internal reference) */
  keywords?: string[]
  readingMinutes: number
  body: ContentBlock[]
}

import type { BlogPost } from './types'
import { postsTr } from './tr'
import { postsEn } from './en'

export function getPosts(locale: string): BlogPost[] {
  return [...(locale === 'tr' ? postsTr : postsEn)].sort((a, b) => b.date.localeCompare(a.date))
}

export function getPost(locale: string, slug: string): BlogPost | undefined {
  return getPosts(locale).find((p) => p.slug === slug)
}

export function allPostSlugs(): string[] {
  return [...new Set([...postsTr, ...postsEn].map((p) => p.slug))]
}

export type { BlogPost, ContentBlock } from './types'

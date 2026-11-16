import { SUPPORTED_LOCALES, type Locale } from '@/lib/i18n/config'
import type { BlogPost } from './types'
import { postsTr } from './tr'
import { postsEn } from './en'
import { sectorPostsTr } from './sectors.tr'
import { sectorPostsEn } from './sectors.en'

const BY_LOCALE: Record<Locale, BlogPost[]> = {
  tr: [...postsTr, ...sectorPostsTr],
  en: [...postsEn, ...sectorPostsEn],
}

function list(locale: string): BlogPost[] {
  return BY_LOCALE[locale as Locale] ?? postsEn
}

export function getPosts(locale: string): BlogPost[] {
  return [...list(locale)].sort((a, b) => b.date.localeCompare(a.date))
}

export function getPost(locale: string, slug: string): BlogPost | undefined {
  return list(locale).find((p) => p.slug === slug)
}

/** The slug of `key` in every language it is written in. */
export function translations(key: string): Partial<Record<Locale, string>> {
  const out: Partial<Record<Locale, string>> = {}
  for (const l of SUPPORTED_LOCALES) {
    const p = BY_LOCALE[l].find((x) => x.key === key)
    if (p) out[l] = p.slug
  }
  return out
}

/** A slug from another language, e.g. after switching language on a post page. */
export function findAnyLocale(slug: string): BlogPost | undefined {
  for (const l of SUPPORTED_LOCALES) {
    const p = BY_LOCALE[l].find((x) => x.slug === slug)
    if (p) return p
  }
}

/** Posts in the same category first, then the newest. */
export function relatedPosts(locale: string, post: BlogPost, count = 3): BlogPost[] {
  const others = getPosts(locale).filter((p) => p.key !== post.key)
  return [...others.filter((p) => p.category === post.category), ...others.filter((p) => p.category !== post.category)].slice(
    0,
    count
  )
}

export function localeParams(): { locale: Locale; slug: string }[] {
  return SUPPORTED_LOCALES.flatMap((locale) => BY_LOCALE[locale].map((p) => ({ locale, slug: p.slug })))
}

export type { BlogPost, ContentBlock } from './types'

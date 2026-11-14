import type { MetadataRoute } from 'next'
import { SUPPORTED_LOCALES, type Locale } from '@/lib/i18n/config'
import { absoluteUrl } from '@/lib/seo'
import { getPosts, translations } from '@/content/blog'
import { LEGAL_SLUGS } from '@/content/legal'

function languages(paths: Partial<Record<Locale, string>>) {
  return Object.fromEntries(Object.entries(paths).map(([l, p]) => [l, absoluteUrl(l, p)]))
}

function samePath(path: string) {
  return Object.fromEntries(SUPPORTED_LOCALES.map((l) => [l, path])) as Record<Locale, string>
}

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = []
  const newest = getPosts('tr')[0]?.date

  for (const l of SUPPORTED_LOCALES) {
    entries.push({
      url: absoluteUrl(l),
      changeFrequency: 'weekly',
      priority: 1,
      alternates: { languages: languages(samePath('')) },
    })
    entries.push({
      url: absoluteUrl(l, '/blog'),
      lastModified: newest,
      changeFrequency: 'weekly',
      priority: 0.8,
      alternates: { languages: languages(samePath('/blog')) },
    })
    for (const post of getPosts(l)) {
      const paths = Object.fromEntries(Object.entries(translations(post.key)).map(([k, s]) => [k, `/blog/${s}`]))
      entries.push({
        url: absoluteUrl(l, `/blog/${post.slug}`),
        lastModified: post.updated ?? post.date,
        changeFrequency: 'monthly',
        priority: 0.7,
        alternates: { languages: languages(paths) },
      })
    }
    for (const slug of LEGAL_SLUGS) {
      entries.push({
        url: absoluteUrl(l, `/legal/${slug}`),
        changeFrequency: 'yearly',
        priority: 0.2,
        alternates: { languages: languages(samePath(`/legal/${slug}`)) },
      })
    }
  }
  return entries
}

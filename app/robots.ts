import type { MetadataRoute } from 'next'
import { SUPPORTED_LOCALES } from '@/lib/i18n/config'
import { SITE_URL } from '@/lib/seo'

const PRIVATE = ['dashboard', 'backoffice', 'onboarding', 'change-password', 'no-access']

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: SUPPORTED_LOCALES.flatMap((l) => PRIVATE.map((p) => `/${l}/${p}`)),
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}

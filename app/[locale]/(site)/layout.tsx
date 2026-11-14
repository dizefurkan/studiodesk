import { getTranslations } from 'next-intl/server'
import { SiteHeader } from '@/components/site/SiteHeader'
import { SiteFooter } from '@/components/site/SiteFooter'
import { CookieConsent } from '@/components/consent/CookieConsent'

/** Public site: landing, blog, legal pages. */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations('site')
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:shadow"
      >
        {t('skip')}
      </a>
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
      <CookieConsent />
    </div>
  )
}

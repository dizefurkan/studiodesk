import { getLocale, getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { Logo } from '@/components/brand/Logo'
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'
import { ThemeSwitcher } from '@/components/common/ThemeSwitcher'
import { LEGAL_SLUGS } from '@/content/legal'
import { CookiePreferencesLink } from './CookiePreferencesLink'
import { getSectors } from '@/content/sectors'

export async function SiteFooter() {
  const sectors = getSectors(await getLocale())
  const t = await getTranslations('site.footer')
  const tl = await getTranslations('site.legalTitles')
  const link = 'text-sm text-ink-foreground/65 transition-colors hover:text-ink-foreground'

  return (
    <footer className="px-3 pb-6 sm:px-6">
      <div className="mx-auto grid max-w-6xl gap-3 lg:grid-cols-[1fr_2fr]">
        {/* brand card */}
        <div className="flex flex-col justify-between gap-8 rounded-3xl bg-highlight p-7 text-highlight-foreground">
          <div>
            <Logo onHighlight />
            <p className="mt-4 max-w-xs text-sm text-highlight-foreground/75">{t('tagline')}</p>
          </div>
          <Link
            href="/#demo"
            className="inline-flex w-fit items-center rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-ink-foreground transition-opacity hover:opacity-90"
          >
            {t('demo')}
          </Link>
        </div>

        {/* links card */}
        <div className="grid gap-8 rounded-3xl bg-ink p-7 text-ink-foreground sm:grid-cols-3">
          <div className="space-y-3">
            <h2 className="text-sm font-medium">{t('forWho')}</h2>
            <ul className="space-y-2">
              {sectors.map((s) => (
                <li key={s.key}><Link href={`/for/${s.slug}`} className={link}>{s.name}</Link></li>
              ))}
            </ul>
          </div>
          <div className="space-y-3">
            <h2 className="text-sm font-medium">{t('product')}</h2>
            <ul className="space-y-2">
              <li><Link href="/#features" className={link}>{t('features')}</Link></li>
              <li><Link href="/#how" className={link}>{t('how')}</Link></li>
              <li><Link href="/#pricing" className={link}>{t('pricing')}</Link></li>
              <li><Link href="/#faq" className={link}>{t('faq')}</Link></li>
              <li><Link href="/blog" className={link}>{t('blog')}</Link></li>
              <li><Link href="/login" className={link}>{t('signIn')}</Link></li>
            </ul>
          </div>
          <div className="space-y-3">
            <h2 className="text-sm font-medium">{t('legal')}</h2>
            <ul className="space-y-2">
              {LEGAL_SLUGS.map((slug) => (
                <li key={slug}><Link href={`/legal/${slug}`} className={link}>{tl(slug)}</Link></li>
              ))}
              <li className="[&_button]:text-ink-foreground/65 [&_button:hover]:text-ink-foreground">
                <CookiePreferencesLink label={t('cookiePreferences')} />
              </li>
            </ul>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-foreground/10 pt-5 sm:col-span-3">
            <p className="text-xs text-ink-foreground/55">{t('copyright', { year: new Date().getFullYear() })}</p>
            <div className="flex items-center gap-1 [&_button]:text-ink-foreground/65 [&_button:hover]:bg-ink-foreground/10 [&_button:hover]:text-ink-foreground">
              <LanguageSwitcher />
              <ThemeSwitcher />
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

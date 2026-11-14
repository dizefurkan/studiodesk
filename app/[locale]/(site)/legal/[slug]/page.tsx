import { notFound } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { SUPPORTED_LOCALES } from '@/lib/i18n/config'
import { formatDay, parseDateOnly } from '@/lib/i18n/dates'
import { cn } from '@/lib/utils'
import { getLegalDoc, isLegalSlug, LEGAL_SLUGS } from '@/content/legal'
import { ContentBlocks } from '@/components/site/ContentBlocks'

export function generateStaticParams() {
  return SUPPORTED_LOCALES.flatMap((locale) => LEGAL_SLUGS.map((slug) => ({ locale, slug })))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug, locale } = await params
  if (!isLegalSlug(slug)) return {}
  const doc = getLegalDoc(slug, locale)
  return { title: doc.title, description: doc.description }
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (!isLegalSlug(slug)) notFound()
  const locale = await getLocale()
  const t = await getTranslations('site')
  const doc = getLegalDoc(slug, locale)

  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[220px_1fr] lg:py-20">
      <nav aria-label={t('footer.legal')} className="lg:sticky lg:top-24 lg:self-start">
        <ul className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-1 lg:overflow-visible">
          {LEGAL_SLUGS.map((s) => (
            <li key={s} className="shrink-0">
              <Link
                href={`/legal/${s}`}
                aria-current={s === slug ? 'page' : undefined}
                className={cn(
                  'block rounded-lg px-3 py-2 text-sm transition-colors',
                  s === slug ? 'bg-primary/10 font-medium text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {t(`legalTitles.${s}`)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <article className="max-w-[68ch]">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">{doc.title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {t('legal.updated', { date: formatDay(locale, parseDateOnly(doc.updated), 'medium') })}
        </p>
        {doc.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="mt-12 font-display text-2xl font-semibold tracking-tight text-foreground">{section.heading}</h2>
            <ContentBlocks blocks={section.blocks} />
          </section>
        ))}
      </article>
    </div>
  )
}

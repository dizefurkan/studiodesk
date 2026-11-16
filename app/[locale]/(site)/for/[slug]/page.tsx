import { notFound } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import { ArrowRight, Check } from 'lucide-react'
import { Link, redirect } from '@/i18n/navigation'
import { absoluteUrl, alternates, OG_LOCALE } from '@/lib/seo'
import type { Locale } from '@/lib/i18n/config'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Reveal } from '@/components/site/RevealText'
import { JsonLd } from '@/components/seo/JsonLd'
import { findSectorAnyLocale, getSector, getSectors, sectorParams, sectorTranslations } from '@/content/sectors'
import { getPosts } from '@/content/blog'

export function generateStaticParams() {
  return sectorParams()
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug, locale } = await params
  const sector = getSector(locale, slug)
  if (!sector) return {}
  const paths = Object.fromEntries(Object.entries(sectorTranslations(sector.key)).map(([l, s]) => [l, `/for/${s}`]))
  return {
    title: { absolute: `${sector.metaTitle} | StudioDesk` },
    description: sector.description,
    keywords: sector.keywords,
    alternates: alternates(locale, paths),
    openGraph: {
      title: sector.metaTitle,
      description: sector.description,
      type: 'website',
      siteName: 'StudioDesk',
      url: absoluteUrl(locale, `/for/${slug}`),
      locale: OG_LOCALE[locale as Locale],
    },
  }
}

/** Landing page for one kind of studio: its problems, how StudioDesk fits, an example setup and FAQ. */
export default async function SectorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const locale = await getLocale()
  const t = await getTranslations('site.sectors')
  const sector = getSector(locale, slug)
  if (!sector) {
    const other = findSectorAnyLocale(slug)
    const target = other && sectorTranslations(other.key)[locale as Locale]
    if (target) redirect({ href: `/for/${target}`, locale })
    notFound()
  }
  const posts = getPosts(locale)
  const related = sector.blogKeys.map((k) => posts.find((p) => p.key === k)).filter((p) => !!p)
  const others = getSectors(locale).filter((s) => s.key !== sector.key)
  const url = absoluteUrl(locale, `/for/${sector.slug}`)

  return (
    <>
      <JsonLd
        data={[
          {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: sector.metaTitle,
            description: sector.description,
            url,
            inLanguage: locale,
          },
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: sector.faq.map((f) => ({
              '@type': 'Question',
              name: f.q,
              acceptedAnswer: { '@type': 'Answer', text: f.a },
            })),
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'StudioDesk', item: absoluteUrl(locale) },
              { '@type': 'ListItem', position: 2, name: sector.name, item: url },
            ],
          },
        ]}
      />

      {/* Hero */}
      <section className="relative -mt-[4.5rem] overflow-hidden pt-[4.5rem]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(55%_55%_at_50%_0%,color-mix(in_oklab,var(--highlight)_40%,transparent),transparent_75%)]"
        />
        <div className="relative mx-auto max-w-4xl px-4 pb-16 pt-16 text-center sm:px-6 lg:pt-24">
          <Reveal>
            <p className="inline-flex items-center gap-2 rounded-full bg-highlight px-3.5 py-1.5 text-sm font-medium text-highlight-foreground">
              <span className="size-1.5 rounded-full bg-ink" aria-hidden />
              {t('badge', { name: sector.name })}
            </p>
            <h1 className="mx-auto mt-6 max-w-3xl font-display text-[clamp(2.25rem,5vw,3.75rem)] font-medium leading-[1.05] tracking-[-0.03em] text-foreground">
              {sector.heroTitle}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">{sector.heroLead}</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 rounded-full bg-ink px-7 text-base text-ink-foreground hover:bg-ink/90">
                <Link href="/#demo">{t('demo')}</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 rounded-full border-transparent bg-background px-7 text-base shadow-sm">
                <Link href="/#how">{t('how')}</Link>
              </Button>
            </div>
            <ul className="mt-10 flex flex-wrap justify-center gap-2" aria-label={t('examplesLabel')}>
              {sector.examples.map((e) => (
                <li key={e}>
                  <Badge variant="secondary" className="rounded-full px-3 py-1 text-sm font-normal">
                    {e}
                  </Badge>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* Problems */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <Reveal className="max-w-2xl">
          <h2 className="font-display text-3xl font-medium tracking-[-0.02em] text-foreground sm:text-4xl">{t('painsTitle')}</h2>
        </Reveal>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {sector.pains.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.05} className="rounded-3xl bg-background p-6">
              <p className="font-display text-lg font-medium text-foreground">{p.title}</p>
              <p className="mt-2 text-muted-foreground">{p.text}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* How StudioDesk fits */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <Reveal className="max-w-2xl">
          <h2 className="font-display text-3xl font-medium tracking-[-0.02em] text-foreground sm:text-4xl">
            {t('fitTitle', { name: sector.name })}
          </h2>
        </Reveal>
        <div className="mt-10 grid gap-x-10 gap-y-8 md:grid-cols-2">
          {sector.fit.map((f) => (
            <Reveal key={f.title} className="flex gap-4">
              <span className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-highlight text-highlight-foreground">
                <Check className="size-4" aria-hidden />
              </span>
              <div>
                <p className="font-medium text-foreground">{f.title}</p>
                <p className="mt-1 text-muted-foreground">{f.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Example setup */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <Reveal className="rounded-[2rem] bg-ink p-8 text-ink-foreground sm:p-12">
          <h2 className="font-display text-3xl font-medium tracking-[-0.02em]">{sector.setup.title}</h2>
          <p className="mt-2 max-w-xl text-ink-foreground/70">{t('setupLead')}</p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {sector.setup.items.map((item) => (
              <li key={item} className="flex gap-3 rounded-2xl bg-ink-foreground/5 p-4">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-highlight" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <Button asChild className="mt-8 rounded-full bg-highlight text-highlight-foreground hover:bg-highlight/90">
            <Link href="/#demo">{t('demo')}</Link>
          </Button>
        </Reveal>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-20">
        <h2 className="font-display text-3xl font-medium tracking-[-0.02em] text-foreground sm:text-4xl">{t('faqTitle')}</h2>
        <Accordion type="single" collapsible className="mt-8 space-y-3">
          {sector.faq.map((f, i) => (
            <AccordionItem key={f.q} value={String(i)} className="rounded-2xl border-0 bg-background px-5">
              <AccordionTrigger className="py-5 text-left text-base font-medium hover:no-underline">{f.q}</AccordionTrigger>
              <AccordionContent className="pb-5 text-base leading-relaxed text-foreground/75">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* Reading and other sectors */}
      <section className="mx-auto grid max-w-6xl gap-10 px-4 pb-24 pt-8 sm:px-6 lg:grid-cols-2">
        {related.length > 0 && (
          <nav aria-labelledby="sector-reading">
            <h2 id="sector-reading" className="font-display text-xl font-medium text-foreground">
              {t('reading')}
            </h2>
            <ul className="mt-4 divide-y divide-border border-y border-border">
              {related.map((p) => (
                <li key={p.slug}>
                  <Link href={`/blog/${p.slug}`} className="group block py-4">
                    <span className="block font-medium text-foreground group-hover:text-primary">{p.title}</span>
                    <span className="mt-1 line-clamp-2 block text-sm text-muted-foreground">{p.description}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
        <nav aria-labelledby="sector-others">
          <h2 id="sector-others" className="font-display text-xl font-medium text-foreground">
            {t('others')}
          </h2>
          <ul className="mt-4 divide-y divide-border border-y border-border">
            {others.map((s) => (
              <li key={s.key}>
                <Link href={`/for/${s.slug}`} className="group flex items-center justify-between gap-4 py-4">
                  <span>
                    <span className="block font-medium text-foreground group-hover:text-primary">{s.name}</span>
                    <span className="mt-1 block text-sm text-muted-foreground">{s.cardText}</span>
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </section>
    </>
  )
}

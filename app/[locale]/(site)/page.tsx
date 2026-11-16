import { getTranslations } from 'next-intl/server'
import { ArrowUpRight, MessageCircleQuestion } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { RevealText, Reveal } from '@/components/site/RevealText'
import { HeroStage } from '@/components/site/HeroStage'
import { RotatingBadge } from '@/components/site/RotatingBadge'
import { Marquee } from '@/components/site/Marquee'
import { Bento } from '@/components/site/Bento'
import { Compare } from '@/components/site/Compare'
import { StackSteps } from '@/components/site/StackSteps'
import { FanCards } from '@/components/site/FanCards'
import { Pricing } from '@/components/site/Pricing'
import { DemoRequestForm } from '@/components/site/DemoRequestForm'
import { JsonLd } from '@/components/seo/JsonLd'
import { absoluteUrl, samePathAlternates, SITE_URL } from '@/lib/seo'
import { getSectors } from '@/content/sectors'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'site.meta' })
  return {
    title: { absolute: t('title') },
    description: t('description'),
    keywords: t('keywords'),
    alternates: samePathAlternates(locale),
    openGraph: { title: t('title'), description: t('description'), url: absoluteUrl(locale), type: 'website', siteName: 'StudioDesk' },
  }
}

const FAQ = ['setup', 'devices', 'students', 'data', 'branches', 'price'] as const
const COMPARE = ['attendance', 'credits', 'pay', 'renewals', 'cash'] as const

function SectionHead({ title, lead }: { title: string; lead?: string }) {
  return (
    <Reveal className="mx-auto max-w-2xl text-center">
      <h2 className="font-display text-4xl font-medium leading-[1.08] tracking-[-0.03em] text-foreground sm:text-5xl">
        {title}
      </h2>
      {lead && <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">{lead}</p>}
    </Reveal>
  )
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations('site')

  return (
    <>
      <JsonLd
        data={[
          {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'StudioDesk',
            url: SITE_URL,
            logo: `${SITE_URL}/brand/icon-512.png`,
          },
          {
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'StudioDesk',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web, iOS, Android',
            inLanguage: ['tr', 'en'],
            description: t('meta.description'),
            url: absoluteUrl(locale),
          },
        ]}
      />
      {/* Hero */}
      <section className="relative -mt-[4.5rem] overflow-hidden pt-[4.5rem]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[720px] bg-[radial-gradient(55%_55%_at_50%_0%,color-mix(in_oklab,var(--highlight)_45%,transparent),transparent_75%)]"
        />
        <div className="relative mx-auto max-w-6xl px-4 pt-16 text-center sm:px-6 lg:pt-24">
          <Reveal>
            <RotatingBadge items={t('hero.badgeItems').split('|')} label={t('hero.badge')} />
          </Reveal>
          <RevealText
            text={t('hero.title')}
            className="mx-auto mt-6 max-w-5xl font-display text-[clamp(2.5rem,5.6vw,4.5rem)] font-medium leading-[1.02] tracking-[-0.035em] text-foreground"
          />
          <Reveal delay={0.35}>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">{t('hero.lead')}</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" variant="outline" className="h-12 rounded-full border-transparent bg-background px-7 text-base shadow-sm">
                <Link href="/#how">{t('hero.secondary')}</Link>
              </Button>
              <Button asChild size="lg" className="h-12 rounded-full bg-ink px-7 text-base text-ink-foreground hover:bg-ink/90">
                <Link href="/#demo">{t('hero.primary')}</Link>
              </Button>
            </div>
          </Reveal>
        </div>
        <div className="relative mt-16 pb-20 lg:mt-20">
          <HeroStage />
        </div>
      </section>

      {/* Class types across studios */}
      <section className="pb-20">
        <p className="mb-6 text-center text-sm font-medium text-foreground">{t('marquee.title')}</p>
        <Marquee items={t('marquee.items').split(',')} label={t('marquee.title')} />
      </section>

      {/* Who it's for: one card per kind of studio */}
      <section id="who" className="scroll-mt-24">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
          <SectionHead title={t('who.title')} lead={t('who.lead')} />
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {getSectors(locale).map((s, i) => (
              <Reveal key={s.key} delay={i * 0.04}>
                <Link
                  href={`/for/${s.slug}`}
                  className="group flex h-full flex-col justify-between gap-6 rounded-3xl bg-background p-6 transition-colors hover:bg-highlight/50 dark:hover:bg-highlight dark:hover:text-highlight-foreground"
                >
                  <div>
                    <p className="font-display text-xl font-medium">{s.name}</p>
                    <p className="mt-2 text-sm text-muted-foreground group-hover:text-foreground/75 dark:group-hover:text-highlight-foreground/75">
                      {s.cardText}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-sm font-medium">
                    {t('who.more')} <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </Link>
              </Reveal>
            ))}
            <Reveal delay={0.2}>
              <Link
                href="/#demo"
                className="flex h-full flex-col justify-between gap-6 rounded-3xl bg-ink p-6 text-ink-foreground transition-opacity hover:opacity-90"
              >
                <div>
                  <p className="font-display text-xl font-medium">{t('who.otherTitle')}</p>
                  <p className="mt-2 text-sm text-ink-foreground/70">{t('who.otherText')}</p>
                </div>
                <span className="inline-flex items-center gap-1 text-sm font-medium">
                  {t('who.otherCta')} <ArrowUpRight className="size-4" />
                </span>
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-24">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
          <SectionHead title={t('features.title')} lead={t('features.lead')} />
          <div className="mt-14">
            <Bento />
          </div>
        </div>
      </section>

      {/* Before / after */}
      <section>
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
          <SectionHead title={t('compare.title')} lead={t('compare.lead')} />
          <Reveal className="mt-14" delay={0.1}>
            <Compare
              beforeTitle={t('compare.before')}
              afterTitle={t('compare.after')}
              rows={COMPARE.map((k) => ({
                key: k,
                job: t(`compare.rows.${k}.job`),
                before: t(`compare.rows.${k}.before`),
                after: t(`compare.rows.${k}.after`),
              }))}
            />
          </Reveal>
        </div>
      </section>

      {/* How a week runs */}
      <section id="how" className="scroll-mt-24">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
          <SectionHead title={t('how.title')} lead={t('how.lead')} />
          <div className="mt-14">
            <StackSteps />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="scroll-mt-24">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
          <SectionHead title={t('pricing.title')} lead={t('pricing.lead')} />
          <div className="mt-10">
            <Pricing />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-24">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
          <SectionHead title={t('faq.title')} lead={t('faq.lead')} />
          <div className="mt-14 grid gap-4 lg:grid-cols-[1fr_2fr]">
            <Reveal className="flex flex-col justify-between gap-10 rounded-3xl bg-highlight p-7 text-highlight-foreground">
              <MessageCircleQuestion className="size-14" strokeWidth={1.4} aria-hidden />
              <div>
                <p className="font-display text-2xl font-medium">{t('faq.cardTitle')}</p>
                <p className="mt-2 text-sm text-highlight-foreground/75">{t('faq.cardText')}</p>
                <Link
                  href="/#demo"
                  className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-ink px-5 py-3 text-sm font-medium text-ink-foreground transition-opacity hover:opacity-90"
                >
                  {t('faq.cardButton')}
                </Link>
              </div>
            </Reveal>
            <Accordion type="single" collapsible defaultValue="setup" className="space-y-3">
              {FAQ.map((q) => (
                <AccordionItem
                  key={q}
                  value={q}
                  className="rounded-2xl border-0 bg-background px-5 transition-colors data-[state=open]:bg-highlight/60 dark:data-[state=open]:bg-highlight dark:data-[state=open]:text-highlight-foreground"
                >
                  <AccordionTrigger className="py-5 text-left text-base font-medium hover:no-underline">
                    {t(`faq.items.${q}.q`)}
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 text-base leading-relaxed text-foreground/75 dark:text-highlight-foreground/80">
                    {t(`faq.items.${q}.a`)}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Demo request: dark band with fanned cards, then the form */}
      <section id="demo" className="scroll-mt-24 px-3 pb-3 sm:px-6">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-ink px-4 pb-10 pt-16 text-ink-foreground sm:px-10 lg:pt-24">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-4xl font-medium leading-[1.08] tracking-[-0.03em] sm:text-5xl">
              {t('demo.title')}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-ink-foreground/70">{t('demo.lead')}</p>
          </Reveal>
          <div className="mt-12">
            <FanCards
              cards={[
                { title: t('demo.cards.c1.title'), value: '0', note: t('demo.cards.c1.note'), tone: 'light' },
                { title: t('demo.cards.c2.title'), value: '1', note: t('demo.cards.c2.note'), tone: 'lime' },
                { title: t('demo.cards.c3.title'), value: '3', note: t('demo.cards.c3.note'), tone: 'ink' },
                { title: t('demo.cards.c4.title'), value: 'TR/EN', note: t('demo.cards.c4.note'), tone: 'olive' },
                { title: t('demo.cards.c5.title'), value: t('demo.cards.c5.value'), note: t('demo.cards.c5.note'), tone: 'light' },
              ]}
            />
          </div>
          <div className="mx-auto mt-6 grid max-w-4xl gap-8 lg:grid-cols-[1fr_1.4fr] lg:items-start">
            <ul className="space-y-4 pt-2">
              {(['form', 'call', 'start'] as const).map((s) => (
                <li key={s} className="flex gap-3">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-highlight" aria-hidden />
                  <span>
                    <span className="font-medium">{t(`demo.steps.${s}.title`)}.</span>{' '}
                    <span className="text-ink-foreground/65">{t(`demo.steps.${s}.text`)}</span>
                  </span>
                </li>
              ))}
            </ul>
            <DemoRequestForm />
          </div>
        </div>
      </section>
    </>
  )
}

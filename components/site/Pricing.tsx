'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Check } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
import { PLANS, YEARLY_SAVING_PERCENT, type Plan } from '@/content/pricing'

type Billing = 'monthly' | 'yearly'

/** Three plans with a monthly/yearly switch; the middle plan is dark with a lime glow. */
export function Pricing() {
  const t = useTranslations('site.pricing')
  const [billing, setBilling] = useState<Billing>('yearly')
  const reduce = useReducedMotion()

  return (
    <div>
      {/* Billing switch */}
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <div role="radiogroup" aria-label={t('billingLabel')} className="relative inline-flex rounded-full bg-background p-1 shadow-sm">
          {(['monthly', 'yearly'] as const).map((b) => (
            <button
              key={b}
              type="button"
              role="radio"
              aria-checked={billing === b}
              onClick={() => setBilling(b)}
              className={cn(
                'relative z-10 rounded-full px-5 py-2 text-sm font-medium transition-colors',
                billing === b ? 'text-background' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {billing === b && (
                <motion.span
                  layoutId="billing-pill"
                  className="absolute inset-0 -z-10 rounded-full bg-foreground"
                  transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}
              {t(b)}
            </button>
          ))}
        </div>
        <span className="rounded-full bg-highlight px-3 py-1 text-xs font-medium text-highlight-foreground">
          {t('save', { percent: YEARLY_SAVING_PERCENT })}
        </span>
      </div>

      <div className="mt-12 grid gap-4 lg:grid-cols-3 lg:items-stretch">
        {PLANS.map((plan, i) => (
          <PlanCard key={plan.id} plan={plan} billing={billing} index={i} />
        ))}
      </div>
      <p className="mt-6 text-center text-sm text-muted-foreground">{t('footnote')}</p>
    </div>
  )
}

function PlanCard({ plan, billing, index }: { plan: Plan; billing: Billing; index: number }) {
  const t = useTranslations('site.pricing')
  const locale = useLocale()
  const reduce = useReducedMotion()
  const price = billing === 'monthly' ? plan.monthly : plan.yearly
  const money = new Intl.NumberFormat(locale, { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(price)
  const yearlyTotal = new Intl.NumberFormat(locale, { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(plan.yearly * 12)
  const features = t(`plans.${plan.id}.features`).split('|')
  const dark = !!plan.featured

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      whileHover={reduce ? undefined : { y: -4 }}
      className={cn('relative flex flex-col rounded-3xl p-2', dark
          ? 'bg-foreground text-background ring-1 ring-highlight/30 shadow-[0_0_80px_-12px_color-mix(in_oklab,var(--highlight)_70%,transparent)] lg:-my-3'
          : 'bg-background')}
    >
      {dark && (
        /* the glow: a lime hairline on top and a soft lime halo */
        <div aria-hidden className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-highlight to-transparent" />
      )}

      {/* tinted top panel: name, price, action */}
      <div className={cn('rounded-[20px] p-6', dark ? 'bg-background/[0.06]' : 'bg-surface')}>
        <div className="flex items-center justify-between gap-3">
          <p className="font-display text-xl font-medium">{t(`plans.${plan.id}.name`)}</p>
          {dark && (
            <span className="rounded-full bg-highlight px-2.5 py-1 text-xs font-medium text-highlight-foreground">
              {t('recommended')}
            </span>
          )}
        </div>
        <p className={cn('mt-1 text-sm', dark ? 'text-background/65' : 'text-muted-foreground')}>
          {t(`plans.${plan.id}.description`)}
        </p>

        <div className="mt-6 flex items-baseline gap-1.5">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={price}
              initial={reduce ? false : { opacity: 0, y: 12, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={reduce ? undefined : { opacity: 0, y: -12, filter: 'blur(4px)' }}
              transition={{ duration: 0.25 }}
              className="font-display text-5xl font-medium tabular-nums tracking-tight"
            >
              {money}
            </motion.span>
          </AnimatePresence>
          <span className={cn('text-sm', dark ? 'text-background/65' : 'text-muted-foreground')}>{t('perMonth')}</span>
        </div>
        <p className={cn('mt-1 h-5 text-xs', dark ? 'text-background/55' : 'text-muted-foreground')}>
          {billing === 'yearly' ? t('billedYearly', { total: yearlyTotal }) : t('billedMonthly')}
        </p>

        <Link
          href="/#demo"
          className={cn(
            'mt-6 flex h-11 items-center justify-center rounded-full text-sm font-medium transition-[transform,opacity] hover:opacity-90 active:scale-[0.98]',
            dark ? 'bg-highlight text-highlight-foreground' : 'bg-foreground text-background'
          )}
        >
          {t('cta')}
        </Link>
      </div>

      <ul className="flex-1 space-y-3 px-6 pb-6 pt-6">
        {features.map((f) => (
          <li key={f} className="flex gap-2.5 text-sm">
            <span
              className={cn(
                'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full',
                dark ? 'bg-highlight text-highlight-foreground' : 'bg-primary/10 text-primary'
              )}
            >
              <Check className="size-3" strokeWidth={3} />
            </span>
            <span className={dark ? 'text-background/85' : 'text-foreground/85'}>{f}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  )
}

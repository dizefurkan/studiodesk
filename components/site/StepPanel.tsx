'use client'

import { useTranslations } from 'next-intl'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export const STEPS = ['sell', 'schedule', 'attend', 'pay'] as const
export type Step = (typeof STEPS)[number]

/** Small, faithful slices of the real screens, one per step of the week. */
export function StepPanel({ step }: { step: Step }) {
  const t = useTranslations('site.how.panels')
  const card = 'rounded-2xl bg-surface p-5 text-foreground'

  if (step === 'sell') {
    return (
      <div className={card}>
        <p className="text-sm text-muted-foreground">{t('sell.student')}</p>
        <p className="font-display text-xl font-semibold">Elif Kaya</p>
        <div className="mt-4 rounded-xl bg-background p-4">
          <div className="flex items-baseline justify-between gap-3">
            <p className="font-medium">{t('sell.package')}</p>
            <p className="font-display text-lg font-semibold tabular-nums">₺2.400</p>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-full bg-highlight" />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{t('sell.credits')}</p>
        </div>
        <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Check className="size-4 text-success" /> {t('sell.cash')}
        </p>
      </div>
    )
  }

  if (step === 'schedule') {
    const days = t('schedule.days').split(',')
    const lessons: Record<number, Array<{ time: string; name: string }>> = {
      0: [{ time: '19:00', name: 'Salsa 1' }],
      1: [{ time: '18:30', name: 'Reformer' }, { time: '20:00', name: 'Karate' }],
      2: [{ time: '19:00', name: 'Yoga' }],
      3: [{ time: '20:00', name: 'Bachata' }],
      5: [{ time: '11:00', name: 'Piano' }, { time: '13:00', name: 'HIIT' }],
    }
    return (
      <div className={card}>
        <p className="font-display text-xl font-semibold">{t('schedule.title')}</p>
        <div className="mt-4 grid grid-cols-7 gap-1.5">
          {days.map((d, i) => (
            <div key={d} className="space-y-1.5">
              <p className="text-center text-xs text-muted-foreground">{d}</p>
              {(lessons[i] ?? []).map((l) => (
                <div key={l.name} className="rounded-md bg-highlight/50 px-1 py-1.5 text-center">
                  <p className="text-[10px] tabular-nums text-foreground/70">{l.time}</p>
                  <p className="truncate text-[11px] font-medium text-foreground">{l.name}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (step === 'attend') {
    const rows = [
      { name: 'Elif Kaya', ok: true, credits: 7 },
      { name: 'Mert Aydın', ok: true, credits: 1 },
      { name: 'Zeynep Arslan', ok: false, credits: 8 },
    ]
    return (
      <div className={card}>
        <p className="font-display text-xl font-semibold">{t('attend.title')}</p>
        <ul className="mt-3 divide-y divide-border">
          {rows.map((r) => (
            <li key={r.name} className="flex items-center justify-between gap-3 py-2.5">
              <div>
                <p className="text-sm font-medium">{r.name}</p>
                <p className={cn('text-xs', r.credits <= 1 ? 'text-warning' : 'text-muted-foreground')}>
                  {t('attend.credits', { count: r.credits })}
                </p>
              </div>
              <span
                className={cn(
                  'rounded-md px-2.5 py-1 text-xs font-medium text-white',
                  r.ok ? 'bg-success' : 'bg-danger'
                )}
              >
                {r.ok ? t('attend.present') : t('attend.absent')}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 rounded-lg bg-warning/10 px-3 py-2 text-xs text-warning">{t('attend.renewal')}</p>
      </div>
    )
  }

  return (
    <div className={card}>
      <p className="font-display text-xl font-semibold">{t('pay.title')}</p>
      <ul className="mt-3 divide-y divide-border">
        {[
          { name: 'Deniz Aksoy', lessons: 18, amount: '₺14.400' },
          { name: 'Ece Korkmaz', lessons: 12, amount: '₺9.600' },
        ].map((r) => (
          <li key={r.name} className="flex items-center justify-between gap-3 py-2.5">
            <div>
              <p className="text-sm font-medium">{r.name}</p>
              <p className="text-xs text-muted-foreground">{t('pay.lessons', { count: r.lessons })}</p>
            </div>
            <p className="font-display text-base font-semibold tabular-nums">{r.amount}</p>
          </li>
        ))}
      </ul>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-background p-3">
          <p className="text-xs text-muted-foreground">{t('pay.income')}</p>
          <p className="font-display text-lg font-semibold tabular-nums">₺86.200</p>
        </div>
        <div className="rounded-lg bg-background p-3">
          <p className="text-xs text-muted-foreground">{t('pay.expense')}</p>
          <p className="font-display text-lg font-semibold tabular-nums">₺31.750</p>
        </div>
      </div>
    </div>
  )
}

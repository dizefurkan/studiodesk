'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useRouter } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'

function shift(month: string, delta: number) {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** "Kasım 2026" style label for a "YYYY-MM" month in the app locale. */
export function useMonthLabel() {
  const locale = useLocale()
  return (month: string) => {
    const [y, m] = month.split('-').map(Number)
    return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(new Date(y, m - 1, 1))
  }
}

/** Previous / next month buttons around the month name; keeps the other URL params. */
export function MonthSwitcher({ month, param = 'month' }: { month: string; param?: string }) {
  const t = useTranslations('instructorPay.month')
  const router = useRouter()
  const searchParams = useSearchParams()
  const label = useMonthLabel()

  const go = (delta: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set(param, shift(month, delta))
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-1">
      <Button variant="outline" size="icon" onClick={() => go(-1)} aria-label={t('previous')}>
        <ChevronLeft />
      </Button>
      <span className="min-w-36 text-center text-sm font-medium capitalize">{label(month)}</span>
      <Button variant="outline" size="icon" onClick={() => go(1)} aria-label={t('next')}>
        <ChevronRight />
      </Button>
    </div>
  )
}

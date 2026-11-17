'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useRouter } from '@/i18n/navigation'
import { addDaysToDateString, formatDay, parseDateOnly, toDateString } from '@/lib/i18n/dates'
import { CASH_PERIODS, EXPENSE_CATEGORIES, INCOME_CATEGORIES, type CashPeriod } from '@/lib/cash/categories'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

export type CashFilters = {
  branchId?: string
  type?: 'income' | 'expense'
  category?: string
  dataType: 'all' | 'transactions' | 'earnings'
  period: CashPeriod
  date: string
  today: string
}

const ALL = 'all'

/** Branch, period (day / month / all), what to show, type and category. Everything lives in the URL. */
export function CashRegisterFilters({
  branches,
  filters,
}: {
  branches: Array<{ id: string; name: string }>
  filters: CashFilters
}) {
  const tx = useTranslations('cashRegister')
  const tc = useTranslations('cashCategories')
  const locale = useLocale()
  const router = useRouter()
  const searchParams = useSearchParams()

  const go = (patch: Record<string, string | null | undefined>) => {
    const params = new URLSearchParams(searchParams.toString())
    for (const [k, v] of Object.entries(patch)) {
      if (v) params.set(k, v)
      else params.delete(k)
    }
    router.push(`/dashboard/cash-register?${params.toString()}`, { scroll: false })
  }

  const step = (dir: -1 | 1) => {
    if (filters.period === 'day') return addDaysToDateString(filters.date, dir)
    const d = parseDateOnly(filters.date)
    return toDateString(new Date(d.getFullYear(), d.getMonth() + dir, 1))
  }
  const periodLabel =
    filters.period === 'day'
      ? formatDay(locale, parseDateOnly(filters.date), 'long')
      : new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(parseDateOnly(filters.date))

  const categories = filters.type === 'income' ? INCOME_CATEGORIES : filters.type === 'expense' ? EXPENSE_CATEGORIES : [
    ...INCOME_CATEGORIES.filter((c) => c !== 'other'),
    ...EXPENSE_CATEGORIES,
  ]

  return (
    <div className="space-y-4">
      {/* Period */}
      <div className="flex flex-wrap items-center gap-3">
        <ToggleGroup
          type="single"
          variant="outline"
          value={filters.period}
          onValueChange={(v) => v && go({ period: v === 'month' ? null : v })}
          aria-label={tx('period')}
        >
          {CASH_PERIODS.map((p) => (
            <ToggleGroupItem key={p} value={p} className="px-3">
              {tx(`periods.${p}`)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        {filters.period !== 'all' && (
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" aria-label={tx('previous')} onClick={() => go({ date: step(-1) })}>
              <ChevronLeft />
            </Button>
            <span className="min-w-40 px-2 text-center text-sm font-medium first-letter:uppercase">{periodLabel}</span>
            <Button variant="outline" size="icon" aria-label={tx('next')} onClick={() => go({ date: step(1) })}>
              <ChevronRight />
            </Button>
            {filters.date !== filters.today && (
              <Button variant="ghost" size="sm" onClick={() => go({ date: null })}>
                {filters.period === 'day' ? tx('today') : tx('thisMonth')}
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {branches.length > 1 && (
          <Field>
            <FieldLabel htmlFor="cash-branch">{tx('branch')}</FieldLabel>
            <Select value={filters.branchId ?? ALL} onValueChange={(v) => go({ branch: v === ALL ? null : v })}>
              <SelectTrigger id="cash-branch" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{tx('allBranches')}</SelectItem>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}
        <Field>
          <FieldLabel htmlFor="cash-show">{tx('dataType')}</FieldLabel>
          <Select value={filters.dataType} onValueChange={(v) => go({ dataType: v === 'all' ? null : v })}>
            <SelectTrigger id="cash-show" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tx('all')}</SelectItem>
              <SelectItem value="transactions">{tx('transactions')}</SelectItem>
              <SelectItem value="earnings">{tx('instructorEarnings')}</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor="cash-type">{tx('type')}</FieldLabel>
          <Select
            value={filters.type ?? ALL}
            disabled={filters.dataType === 'earnings'}
            onValueChange={(v) => go({ type: v === ALL ? null : v, category: null })}
          >
            <SelectTrigger id="cash-type" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{tx('allTypes')}</SelectItem>
              <SelectItem value="income">{tx('income')}</SelectItem>
              <SelectItem value="expense">{tx('expense')}</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor="cash-category">{tx('category')}</FieldLabel>
          <Select
            value={filters.category ?? ALL}
            disabled={filters.dataType === 'earnings'}
            onValueChange={(v) => go({ category: v === ALL ? null : v })}
          >
            <SelectTrigger id="cash-category" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{tx('allCategories')}</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {tc(c)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
    </div>
  )
}

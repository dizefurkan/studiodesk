'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Minus, Pencil, Plus } from 'lucide-react'
import { useRouter } from '@/i18n/navigation'
import { updateStudentPackageCredits } from '@/lib/actions/students.actions'
import { formatDay, parseDateOnly, toDateString } from '@/lib/i18n/dates'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface StudentCreditsProps {
  packages: Array<{
    id: string
    remaining_credits: number
    expire_date?: string | null
    packages?: {
      name: string
      total_credits: number
      dance_types?: { name: string } | null
    } | null
  }>
  /** Shown in the empty state */
  sellAction?: React.ReactNode
}

const SOON_DAYS = 7

/**
 * Sidebar card: credits left in total and per package, with expiry and a quick ±1 correction.
 * Used-up and expired packages are left out here; they stay listed under "Purchases".
 */
export function StudentCredits({ packages, sellAction }: StudentCreditsProps) {
  const tx = useTranslations('studentCredits')
  const locale = useLocale()
  const router = useRouter()
  const [updating, setUpdating] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)

  const today = toDateString()
  const active = packages.filter(
    (p) => p.remaining_credits > 0 && (!p.expire_date || p.expire_date.slice(0, 10) >= today)
  )
  const total = active.reduce((s, p) => s + p.remaining_credits, 0)

  const update = async (id: string, value: number) => {
    if (value < 0) return
    setUpdating(id)
    const res = await updateStudentPackageCredits(id, value)
    setUpdating(null)
    if (res.error) toast.error(res.error)
    else router.refresh()
  }

  return (
    <Card className="gap-0 p-0">
      <div className="flex items-end justify-between gap-3 p-5">
        <div>
          <p className="text-sm text-muted-foreground">{tx('title')}</p>
          <p className="mt-1 font-display text-4xl font-medium tabular-nums leading-none">{total}</p>
        </div>
        <span
          className={cn(
            'rounded-full px-2.5 py-1 text-xs font-medium',
            total === 0
              ? 'bg-danger/10 text-danger'
              : total <= 1
                ? 'bg-warning/10 text-warning'
                : 'bg-highlight text-highlight-foreground'
          )}
        >
          {total === 0 ? tx('none') : total <= 1 ? tx('low') : tx('ok')}
        </span>
      </div>

      {active.length === 0 ? (
        <div className="border-t border-border p-5">
          <p className="text-sm text-muted-foreground">{tx('empty')}</p>
          {sellAction && <div className="mt-3">{sellAction}</div>}
        </div>
      ) : (
        <ul className="divide-y divide-border border-t border-border">
          {active.map((p) => {
            const totalCredits = p.packages?.total_credits ?? 0
            const left = p.remaining_credits
            const pct = totalCredits > 0 ? (left / totalCredits) * 100 : 0
            const expires = p.expire_date ? parseDateOnly(p.expire_date) : null
            const soon =
              !!expires && (expires.getTime() - parseDateOnly(today).getTime()) / 86400000 <= SOON_DAYS
            return (
              <li key={p.id} className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{p.packages?.name ?? tx('packageFallback')}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {p.packages?.dance_types?.name ?? tx('unknownDanceType')}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm tabular-nums">
                    <span className="font-semibold">{left}</span>
                    <span className="text-muted-foreground">/{totalCredits}</span>
                  </p>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn('h-full rounded-full', left <= 1 ? 'bg-warning' : 'bg-primary')}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <p className={cn('text-xs', soon ? 'font-medium text-warning' : 'text-muted-foreground')}>
                    {expires ? tx('expires', { date: formatDay(locale, expires, 'medium') }) : tx('noExpiry')}
                  </p>
                  {editing === p.id ? (
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon-sm"
                        variant="outline"
                        onClick={() => update(p.id, left - 1)}
                        disabled={updating === p.id || left === 0}
                        aria-label={tx('decrease')}
                      >
                        <Minus />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="outline"
                        onClick={() => update(p.id, left + 1)}
                        disabled={updating === p.id || left >= totalCredits}
                        aria-label={tx('increase')}
                      >
                        <Plus />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                        {tx('done')}
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="ghost" className="text-xs" onClick={() => setEditing(p.id)}>
                      <Pencil /> {tx('edit')}
                    </Button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}

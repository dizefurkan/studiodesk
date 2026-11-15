'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import type { ColumnDef } from '@tanstack/react-table'
import { Banknote, FileText, Plus } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { DataTable } from '@/components/table/data-table'
import { ColumnHeader } from '@/components/table/column-header'
import { PayoutDialog } from '@/components/instructor-pay/PayoutDialog'
import { AdjustmentDialog } from '@/components/instructor-pay/AdjustmentDialog'
import { useOrganizationPrefs } from '@/lib/context/OrganizationPrefsContext'
import { formatCurrency } from '@/lib/utils/format'
import { cn } from '@/lib/utils'
import type { getPaySummary } from '@/lib/actions/instructor-pay.actions'
import type { ActionData } from '@/lib/types/actions'

type Row = ActionData<typeof getPaySummary>['rows'][number]

const PAGE_SIZE = 20

/** The date to suggest in dialogs: today in the current month, else the month's last day. */
function defaultDateFor(month: string, today: string) {
  if (today.startsWith(month)) return today
  const [y, m] = month.split('-').map(Number)
  const last = `${month}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`
  return last < today ? last : today
}

export function PayoutsTable({
  rows,
  branches,
  month,
  isClosed,
  today,
}: {
  rows: Row[]
  branches: { id: string; name: string }[]
  month: string
  isClosed: boolean
  today: string
}) {
  const t = useTranslations('instructorPay')
  const { currency } = useOrganizationPrefs()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [dialog, setDialog] = useState<{ kind: 'payout' | 'adjustment'; row: Row; key: number } | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase()
    return q ? rows.filter((r) => r.name.toLocaleLowerCase().includes(q)) : rows
  }, [rows, search])
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const money = (n: number) => formatCurrency(n, currency)
  const open = (kind: 'payout' | 'adjustment', row: Row) => setDialog((d) => ({ kind, row, key: (d?.key ?? 0) + 1 }))

  const columns: ColumnDef<Row>[] = [
    {
      accessorKey: 'name',
      header: () => <ColumnHeader k="instructor" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{row.original.name}</span>
          {row.original.archived && <Badge variant="outline">{t('payouts.archived')}</Badge>}
        </div>
      ),
    },
    {
      accessorKey: 'opening',
      header: () => <ColumnHeader k="openingBalance" />,
      cell: ({ row }) => <span className="tabular-nums text-muted-foreground">{money(row.original.opening)}</span>,
    },
    {
      accessorKey: 'earned',
      header: () => <ColumnHeader k="earned" />,
      cell: ({ row }) => (
        <div className="tabular-nums">
          {money(row.original.earned)}
          <p className="text-xs text-muted-foreground">{t('summary.lessons', { count: row.original.lessonCount })}</p>
        </div>
      ),
    },
    {
      accessorKey: 'adjustments',
      header: () => <ColumnHeader k="adjustments" />,
      cell: ({ row }) => (
        <span className={cn('tabular-nums', row.original.adjustments < 0 && 'text-danger')}>
          {money(row.original.adjustments)}
        </span>
      ),
    },
    {
      accessorKey: 'paid',
      header: () => <ColumnHeader k="paid" />,
      cell: ({ row }) => <span className="tabular-nums">{money(row.original.paid)}</span>,
    },
    {
      accessorKey: 'closing',
      header: () => <ColumnHeader k="balance" />,
      cell: ({ row }) => (
        <span
          className={cn(
            'font-semibold tabular-nums',
            row.original.closing > 0 ? 'text-primary' : row.original.closing < 0 ? 'text-warning' : 'text-muted-foreground'
          )}
        >
          {money(row.original.closing)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: () => (
        <span className="sr-only">
          <ColumnHeader k="actions" />
        </span>
      ),
      cell: ({ row }) => (
        <div className="flex justify-end gap-1 whitespace-nowrap">
          {!isClosed && (
            <>
              <Button size="sm" onClick={() => open('payout', row.original)}>
                <Banknote /> {t('payouts.pay')}
              </Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon-sm" variant="ghost" onClick={() => open('adjustment', row.original)} aria-label={t('payouts.addItem')}>
                    <Plus />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('payouts.addItem')}</TooltipContent>
              </Tooltip>
            </>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon-sm" variant="ghost" asChild aria-label={t('payouts.statement')}>
                <Link href={`/dashboard/instructor-earnings/statement?instructor=${row.original.instructorId}&month=${month}`}>
                  <FileText />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('payouts.statement')}</TooltipContent>
          </Tooltip>
        </div>
      ),
    },
  ]

  return (
    <Card className="p-3 sm:p-4 md:p-6">
      <DataTable<Row, unknown>
        columns={columns}
        data={pageRows}
        searchValue={search}
        onSearchChange={(v) => {
          setSearch(v)
          setPage(1)
        }}
        searchPlaceholder={t('payouts.searchPlaceholder')}
        enableFilters={false}
        totalItems={filtered.length}
        currentPage={page}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        emptyMessage={t('payouts.empty')}
      />

      {dialog?.kind === 'payout' && (
        <PayoutDialog
          key={dialog.key}
          open
          onOpenChange={(o) => !o && setDialog(null)}
          instructor={{ id: dialog.row.instructorId, name: dialog.row.name }}
          balance={dialog.row.closing}
          branches={branches}
          defaultDate={defaultDateFor(month, today)}
        />
      )}
      {dialog?.kind === 'adjustment' && (
        <AdjustmentDialog
          key={dialog.key}
          open
          onOpenChange={(o) => !o && setDialog(null)}
          instructor={{ id: dialog.row.instructorId, name: dialog.row.name }}
          defaultDate={defaultDateFor(month, today)}
        />
      )}
    </Card>
  )
}

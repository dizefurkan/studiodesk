'use client'

import type { ColumnDef } from '@tanstack/react-table'
import { useTranslations } from 'next-intl'
import { FileText } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { EarningsEditButton } from '@/components/instructor-earnings/EarningsEditButton'
import { ColumnHeader } from '@/components/table/column-header'
import { FormattedDate } from '@/components/common/FormattedDate'
import { formatCurrency } from '@/lib/utils/format'
import type { getInstructorEarnings } from '@/lib/actions/instructor-earnings.actions'
import type { ActionData } from '@/lib/types/actions'

export type EarningRecord = ActionData<typeof getInstructorEarnings>[number]

function ManualBadge({ calculated, currency }: { calculated: number | null; currency: string }) {
  const t = useTranslations('instructorEarnings')
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="outline">{t('manual')}</Badge>
      </TooltipTrigger>
      <TooltipContent>
        {calculated === null ? t('manualHint') : t('calculatedAmount', { amount: formatCurrency(calculated, currency) })}
      </TooltipContent>
    </Tooltip>
  )
}

function StatementLink({ instructorId, date }: { instructorId: string; date: string }) {
  const t = useTranslations('instructorEarnings')
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon-sm" asChild aria-label={t('statement')}>
          <Link href={`/dashboard/instructor-earnings/statement?instructor=${instructorId}&month=${date.slice(0, 7)}`}>
            <FileText />
          </Link>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{t('statement')}</TooltipContent>
    </Tooltip>
  )
}

export function getEarningsColumns({ currency, canManage }: { currency: string; canManage: boolean }): ColumnDef<EarningRecord>[] {
  return [
    {
      accessorKey: 'earned_on',
      header: () => <ColumnHeader k="lessonDate" />,
      cell: ({ row }) => <FormattedDate value={`${row.original.earned_on}T00:00:00`} />,
    },
    {
      accessorKey: 'instructors',
      header: () => <ColumnHeader k="instructor" />,
      cell: ({ row }) => (
        <p className="font-medium">
          {row.original.instructors.first_name} {row.original.instructors.last_name}
        </p>
      ),
    },
    {
      id: 'course',
      header: () => <ColumnHeader k="course" />,
      cell: ({ row }) => row.original.course_sessions?.courses?.name ?? '—',
    },
    {
      accessorKey: 'amount',
      header: () => <ColumnHeader k="amount" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold tabular-nums">{formatCurrency(Number(row.original.amount), currency)}</span>
          {row.original.is_manual && (
            <ManualBadge
              calculated={row.original.calculated_amount === null ? null : Number(row.original.calculated_amount)}
              currency={currency}
            />
          )}
        </div>
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
        <div className="flex items-center justify-end gap-1">
          {canManage && (
            <EarningsEditButton
              earningsId={row.original.id}
              currentAmount={Number(row.original.amount)}
              isManual={row.original.is_manual}
            />
          )}
          <StatementLink instructorId={row.original.instructor_id} date={row.original.earned_on} />
        </div>
      ),
    },
  ]
}

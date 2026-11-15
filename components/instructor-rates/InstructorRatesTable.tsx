'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import type { ColumnDef } from '@tanstack/react-table'
import { CalendarPlus, ChevronDown, ChevronRight, Plus, Trash2, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { DataTable } from '@/components/table/data-table'
import { FormattedDate } from '@/components/common/FormattedDate'
import { useConfirm } from '@/components/common/ConfirmProvider'
import { useTermsLabel } from '@/components/instructor-pay/useTermsLabel'
import { useServerAction } from '@/hooks/useServerAction'
import { deleteInstructorRate, deleteRateVersion } from '@/lib/actions/instructor-rates.actions'
import { ALWAYS, type InstructorRate } from './types'

const PAGE_SIZE = 10

interface InstructorRow {
  id: string
  name: string
  rates: InstructorRate[]
}

interface InstructorRatesTableProps {
  rates: InstructorRate[]
  instructors: Array<{ id: string; first_name: string; last_name: string }>
  onRatesChange?: () => void
  onOpenEdit?: (rateId: string) => void
  onOpenNewForInstructor?: (instructorId: string) => void
}

export function InstructorRatesTable({
  rates,
  instructors,
  onRatesChange,
  onOpenEdit,
  onOpenNewForInstructor,
}: InstructorRatesTableProps) {
  const tx = useTranslations('instructorRatesTable')
  const t = useTranslations()
  const confirm = useConfirm()
  const termsLabel = useTermsLabel()
  const { pending, run } = useServerAction()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const rows = useMemo<InstructorRow[]>(() => {
    const q = search.trim().toLocaleLowerCase()
    return (instructors || [])
      .map((i) => ({
        id: i.id,
        name: `${i.first_name} ${i.last_name}`,
        rates: rates.filter((r) => r.instructors.id === i.id),
      }))
      .filter((r) => !q || r.name.toLocaleLowerCase().includes(q))
  }, [instructors, rates, search])

  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const columns: ColumnDef<InstructorRow>[] = [
    {
      id: 'expand',
      meta: { className: 'w-10' },
      header: () => null,
      cell: ({ row }) =>
        row.getCanExpand() ? (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={row.getToggleExpandedHandler()}
            aria-label={row.getIsExpanded() ? t('table.collapse') : t('table.expand')}
            aria-expanded={row.getIsExpanded()}
          >
            {row.getIsExpanded() ? <ChevronDown /> : <ChevronRight />}
          </Button>
        ) : null,
    },
    {
      accessorKey: 'name',
      header: t('instructorRates.tableHeaders.instructor'),
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      id: 'rates',
      header: t('instructorRates.tableHeaders.rates'),
      cell: ({ row }) =>
        row.original.rates.length ? (
          <Badge variant="secondary">{t('instructorRates.ratesConfigured', { count: row.original.rates.length })}</Badge>
        ) : (
          <span className="text-muted-foreground">{t('instructorRates.ratesConfigured', { count: 0 })}</span>
        ),
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">{t('instructorRates.tableHeaders.actions')}</span>,
      cell: ({ row }) => (
        <div className="text-right">
          <Button size="sm" variant="outline" onClick={() => onOpenNewForInstructor?.(row.original.id)}>
            <Plus /> {t('instructorRates.addNew')}
          </Button>
        </div>
      ),
    },
  ]

  return (
    <DataTable<InstructorRow, unknown>
      columns={columns}
      data={pageRows}
      searchValue={search}
      onSearchChange={(v) => {
        setSearch(v)
        setPage(1)
      }}
      searchPlaceholder={t('common.search')}
      enableFilters={false}
      totalItems={rows.length}
      currentPage={page}
      pageSize={PAGE_SIZE}
      onPageChange={setPage}
      getRowCanExpand={(row) => row.original.rates.length > 0}
      renderSubComponent={({ row }) => (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-12">{t('instructorRates.tableHeaders.rates')}</TableHead>
              <TableHead>{tx('current')}</TableHead>
              <TableHead>{tx('periods')}</TableHead>
              <TableHead className="text-right">
                <span className="sr-only">{t('instructorRates.tableHeaders.actions')}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {row.original.rates.map((rate) => (
              <TableRow key={rate.id} className="align-top">
                <TableCell className="pl-12 text-muted-foreground">
                  {rate.branches?.name} · {rate.dance_types?.name}
                </TableCell>
                <TableCell className="font-semibold">
                  {termsLabel({
                    pay_model: rate.pay_model,
                    ratio: rate.ratio_per_class,
                    amount: rate.amount,
                    min_amount: rate.min_amount,
                  })}
                </TableCell>
                <TableCell>
                  <ul className="space-y-1 text-sm">
                    {rate.instructor_rate_versions.map((v) => (
                      <li key={v.id} className="flex items-center gap-1">
                        <span className="text-muted-foreground">
                          {v.effective_from === ALWAYS ? (
                            tx('always')
                          ) : (
                            <FormattedDate value={`${v.effective_from}T00:00:00`} />
                          )}
                          :
                        </span>
                        <span>{termsLabel(v)}</span>
                        {rate.instructor_rate_versions.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            aria-label={tx('deletePeriod')}
                            disabled={pending}
                            onClick={async () => {
                              if (!(await confirm({ title: tx('deletePeriodConfirm'), destructive: true }))) return
                              run(() => deleteRateVersion(v.id), { onSuccess: onRatesChange })
                            }}
                          >
                            <X />
                          </Button>
                        )}
                      </li>
                    ))}
                  </ul>
                </TableCell>
                <TableCell className="whitespace-nowrap text-right">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => onOpenEdit?.(rate.id)}
                        disabled={pending}
                        aria-label={tx('newPeriod')}
                      >
                        <CalendarPlus />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{tx('newPeriod')}</TooltipContent>
                  </Tooltip>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive"
                    onClick={async () => {
                      if (!(await confirm({ title: t('common.deleteRateConfirm'), description: tx('deleteRateHint'), destructive: true })))
                        return
                      run(() => deleteInstructorRate(rate.id), { onSuccess: onRatesChange })
                    }}
                    disabled={pending}
                    aria-label={tx('delete')}
                  >
                    <Trash2 />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    />
  )
}

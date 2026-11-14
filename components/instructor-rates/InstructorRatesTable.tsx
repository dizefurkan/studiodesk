'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import type { ColumnDef } from '@tanstack/react-table'
import { ChevronDown, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { DataTable } from '@/components/table/data-table'
import { useConfirm } from '@/components/common/ConfirmProvider'
import { deleteInstructorRate } from '@/lib/actions/instructor-rates.actions'

const PAGE_SIZE = 10

interface InstructorRate {
  id: string
  ratio_per_class: number
  instructors: { id: string; first_name: string; last_name: string }
  branches: { id: string; name: string }
  dance_types: { id: string; name: string }
}

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
  const [busy, setBusy] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const rows = useMemo<InstructorRow[]>(() => {
    const q = search.trim().toLowerCase()
    return (instructors || [])
      .map((i) => ({
        id: i.id,
        name: `${i.first_name} ${i.last_name}`,
        rates: rates.filter((r) => r.instructors.id === i.id),
      }))
      .filter((r) => !q || r.name.toLowerCase().includes(q))
  }, [instructors, rates, search])

  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleDelete = async (rateId: string) => {
    if (!(await confirm({ title: t('common.confirm') + '?', destructive: true }))) return
    setBusy(true)
    try {
      const result = await deleteInstructorRate(rateId)
      if (result.error) toast.error(result.error)
      else await onRatesChange?.()
    } catch {
      toast.error(tx('deleteFailed'))
    } finally {
      setBusy(false)
    }
  }

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
              <TableHead>%</TableHead>
              <TableHead className="text-right">
                <span className="sr-only">{t('instructorRates.tableHeaders.actions')}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {row.original.rates.map((rate) => (
              <TableRow key={rate.id}>
                <TableCell className="pl-12 text-muted-foreground">
                  {rate.branches.name} · {rate.dance_types.name}
                </TableCell>
                <TableCell className="font-semibold">%{Number(rate.ratio_per_class).toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => onOpenEdit?.(rate.id)}
                        disabled={busy}
                        aria-label={t('instructorRates.edit')}
                      >
                        <Pencil />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t('instructorRates.edit')}</TooltipContent>
                  </Tooltip>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive"
                    onClick={() => handleDelete(rate.id)}
                    disabled={busy}
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

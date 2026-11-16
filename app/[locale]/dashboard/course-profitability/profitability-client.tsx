'use client'

import { useMemo, useState } from 'react'
import { format, parse } from 'date-fns'
import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import type { ColumnDef } from '@tanstack/react-table'
import { Link, useRouter } from '@/i18n/navigation'
import { Badge } from '@/components/ui/badge'
import { Field, FieldLabel } from '@/components/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable } from '@/components/table/data-table'
import { ColumnHeader } from '@/components/table/column-header'
import { DatePicker } from '@/components/common/DatePicker'
import { useOrganizationPrefs } from '@/lib/context/OrganizationPrefsContext'
import { formatCurrency } from '@/lib/utils/format'
import { cn } from '@/lib/utils'
import type { getCourseProfitability } from '@/lib/actions/instructor-pay.actions'
import type { ActionData } from '@/lib/types/actions'

type Row = ActionData<typeof getCourseProfitability>['rows'][number]

const ALL = 'all'
const PAGE_SIZE = 20

export function ProfitabilityFilters({
  from,
  to,
  branchId,
  branches,
}: {
  from: string
  to: string
  branchId: string | null
  branches: { id: string; name: string }[]
}) {
  const t = useTranslations('instructorPay.profitability')
  const router = useRouter()
  const searchParams = useSearchParams()

  const set = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (!params.get('from')) params.set('from', from)
    if (!params.get('to')) params.set('to', to)
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Field>
        <FieldLabel>{t('from')}</FieldLabel>
        <DatePicker
          value={parse(from, 'yyyy-MM-dd', new Date())}
          onDateChange={(d) => set('from', format(d, 'yyyy-MM-dd'))}
          className="w-full"
        />
      </Field>
      <Field>
        <FieldLabel>{t('to')}</FieldLabel>
        <DatePicker
          value={parse(to, 'yyyy-MM-dd', new Date())}
          onDateChange={(d) => set('to', format(d, 'yyyy-MM-dd'))}
          className="w-full"
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="profitability-branch">{t('branch')}</FieldLabel>
        <Select value={branchId ?? ALL} onValueChange={(v) => set('branch', v === ALL ? null : v)}>
          <SelectTrigger id="profitability-branch" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t('allBranches')}</SelectItem>
            {branches.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </div>
  )
}

/** Courses sorted from least to most profitable, so the ones that need a decision come first. */
export function ProfitabilityTable({ rows }: { rows: Row[] }) {
  const t = useTranslations('instructorPay.profitability')
  const { currency } = useOrganizationPrefs()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const money = (n: number) => formatCurrency(n, currency)

  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase()
    return q ? rows.filter((r) => `${r.course} ${r.branch} ${r.danceType}`.toLocaleLowerCase().includes(q)) : rows
  }, [rows, search])

  const columns: ColumnDef<Row>[] = [
    {
      accessorKey: 'course',
      header: () => <ColumnHeader k="course" />,
      cell: ({ row }) => (
        <div>
          <Link href={`/dashboard/courses/${row.original.courseId}`} className="font-medium hover:underline">
            {row.original.course}
          </Link>
          <p className="text-xs text-muted-foreground">
            {row.original.branch} · {row.original.danceType}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'sessions',
      header: () => <ColumnHeader k="sessions" />,
      cell: ({ row }) => <span className="tabular-nums">{row.original.sessions}</span>,
    },
    {
      accessorKey: 'avgAttendance',
      header: () => <ColumnHeader k="avgAttendance" />,
      cell: ({ row }) => <span className="tabular-nums">{row.original.avgAttendance.toLocaleString()}</span>,
    },
    {
      accessorKey: 'revenue',
      header: () => <ColumnHeader k="revenue" />,
      cell: ({ row }) => <span className="tabular-nums">{money(row.original.revenue)}</span>,
    },
    {
      accessorKey: 'cost',
      header: () => <ColumnHeader k="cost" />,
      cell: ({ row }) => <span className="tabular-nums">{money(row.original.cost)}</span>,
    },
    {
      accessorKey: 'profit',
      header: () => <ColumnHeader k="profit" />,
      cell: ({ row }) => (
        <span className={cn('font-semibold tabular-nums', row.original.profit < 0 ? 'text-danger' : 'text-success')}>
          {money(row.original.profit)}
        </span>
      ),
    },
    {
      accessorKey: 'margin',
      header: () => <ColumnHeader k="margin" />,
      cell: ({ row }) =>
        row.original.margin === null ? (
          <span className="text-muted-foreground">—</span>
        ) : row.original.profit < 0 ? (
          <Badge variant="destructive">{t('loss')}</Badge>
        ) : (
          <span className="tabular-nums">{t('marginValue', { value: row.original.margin.toLocaleString() })}</span>
        ),
    },
  ]

  return (
    <div className="min-w-0">
      <DataTable<Row, unknown>
        columns={columns}
        data={filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)}
        searchValue={search}
        onSearchChange={(v) => {
          setSearch(v)
          setPage(1)
        }}
        searchPlaceholder={t('searchPlaceholder')}
        enableFilters={false}
        totalItems={filtered.length}
        currentPage={page}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        emptyMessage={t('empty')}
      />
    </div>
  )
}

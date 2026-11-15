'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import type { ColumnDef } from '@tanstack/react-table'
import { Banknote, ChevronDown, ChevronRight, Download, Lock, Plus, Printer, Trash2 } from 'lucide-react'
import { useRouter } from '@/i18n/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DataTable } from '@/components/table/data-table'
import { ColumnHeader } from '@/components/table/column-header'
import { FormattedDate } from '@/components/common/FormattedDate'
import { useConfirm } from '@/components/common/ConfirmProvider'
import { MonthSwitcher, useMonthLabel } from '@/components/instructor-pay/MonthSwitcher'
import { PayoutDialog } from '@/components/instructor-pay/PayoutDialog'
import { AdjustmentDialog } from '@/components/instructor-pay/AdjustmentDialog'
import { useTermsLabel } from '@/components/instructor-pay/useTermsLabel'
import { useServerAction } from '@/hooks/useServerAction'
import { useOrganizationPrefs } from '@/lib/context/OrganizationPrefsContext'
import { formatCurrency } from '@/lib/utils/format'
import { cn } from '@/lib/utils'
import { deleteAdjustment, deletePayout, type getInstructorStatement } from '@/lib/actions/instructor-pay.actions'
import type { ActionData } from '@/lib/types/actions'
import type { EarningBreakdown } from '@/lib/earnings/sessionEarnings'

type Statement = ActionData<typeof getInstructorStatement>
type Lesson = Statement['lessons'][number]

const ALWAYS = '2000-01-01'

function Breakdown({ b }: { b: EarningBreakdown }) {
  const t = useTranslations('instructorPay.statement')
  const tt = useTranslations('instructorPay.terms')
  const { currency } = useOrganizationPrefs()
  const termsLabel = useTermsLabel()
  const money = (n: number | null) => formatCurrency(Number(n ?? 0), currency)

  const formula =
    b.model === 'per_lesson'
      ? money(b.amount)
      : b.model === 'per_hour'
        ? `${t('hours', { hours: b.hours })} × ${money(b.amount)}`
        : b.model === 'per_student'
          ? `${b.presentCount} × ${money(b.amount)}`
          : `${money(b.lessonTotal)} × ${tt('percentage', { ratio: b.ratio.toLocaleString() })}`

  return (
    <div className="space-y-3 px-4 py-3 sm:pl-12">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-medium">
          {termsLabel({ pay_model: b.model, ratio: b.ratio, amount: b.amount, min_amount: b.minAmount })}
        </span>
        {b.effectiveFrom !== ALWAYS && (
          <span className="text-muted-foreground">
            · {t('rateFrom')} <FormattedDate value={`${b.effectiveFrom}T00:00:00`} />
          </span>
        )}
        {b.substitute && <Badge variant="outline">{t('substitute')}</Badge>}
        {b.minApplied && <Badge variant="outline">{t('minApplied')}</Badge>}
      </div>
      <p className="text-sm text-muted-foreground">
        {formula} = <span className="font-semibold text-foreground">{money(b.calculated)}</span>
        {' · '}
        {t('studentsCounted', { present: b.presentCount, credits: b.creditCount })}
      </p>
      {b.students.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>{t('student')}</TableHead>
              <TableHead>{t('attendance')}</TableHead>
              <TableHead className="text-right">{t('lessonValue')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {b.students.map((s) => (
              <TableRow key={s.id}>
                <TableCell>{s.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {s.present ? t('present') : t('absent')} · {s.credit ? t('creditTaken') : t('noCredit')}
                </TableCell>
                <TableCell className="text-right tabular-nums">{s.credit ? money(s.value) : '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

export function StatementView({
  instructors,
  statement,
  month,
}: {
  instructors: { id: string; name: string }[]
  statement: Statement | null
  month?: string
}) {
  const t = useTranslations('instructorPay')
  const tc = useTranslations('common')
  const locale = useLocale()
  const router = useRouter()
  const confirm = useConfirm()
  const monthLabel = useMonthLabel()
  const termsLabel = useTermsLabel()
  const { currency } = useOrganizationPrefs()
  const remove = useServerAction()
  const [dialog, setDialog] = useState<{ kind: 'payout' | 'adjustment'; key: number } | null>(null)
  const money = (n: number) => formatCurrency(n, currency)

  const selectInstructor = (id: string) => {
    const params = new URLSearchParams({ instructor: id })
    if (statement?.month ?? month) params.set('month', statement?.month ?? month ?? '')
    router.push(`?${params.toString()}`)
  }

  const s = statement
  const editable = !!s && s.canManage && !s.isClosed
  const defaultDate = s ? (s.today.startsWith(s.month) ? s.today : `${s.month}-01` < s.today ? lastDay(s.month, s.today) : s.today) : ''

  const kindLabel = (a: Statement['adjustments'][number]) =>
    a.kind === 'correction' && a.sourceCourse && a.sourceDate
      ? t('statement.correctionFor', {
          course: a.sourceCourse,
          date: new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(`${a.sourceDate}T00:00:00`)),
        })
      : t(`kinds.${a.kind}`)

  const downloadCsv = () => {
    if (!s) return
    const sep = locale === 'tr' ? ';' : ','
    const num = (n: number) => (locale === 'tr' ? n.toFixed(2).replace('.', ',') : n.toFixed(2))
    const cell = (v: string) => `"${v.replace(/"/g, '""')}"`
    const lines: string[][] = [
      [t('csv.type'), t('csv.date'), t('csv.description'), t('csv.amount')],
      ...s.lessons.map((l) => [
        t('csv.lesson'),
        l.date,
        [l.course, l.branch, l.breakdown ? termsLabel({ pay_model: l.breakdown.model, ratio: l.breakdown.ratio, amount: l.breakdown.amount, min_amount: l.breakdown.minAmount }) : '']
          .filter(Boolean)
          .join(' · '),
        num(l.amount),
      ]),
      ...s.adjustments.map((a) => [t('csv.item'), a.date, [kindLabel(a), a.description].filter(Boolean).join(' · '), num(a.amount)]),
      ...s.payouts.map((p) => [t('csv.payment'), p.date, [t(`methods.${p.method}`), p.note].filter(Boolean).join(' · '), num(-p.amount)]),
      [],
      [t('summary.opening'), '', '', num(s.summary.opening)],
      [t('summary.earned'), '', '', num(s.summary.earned)],
      [t('summary.adjustments'), '', '', num(s.summary.adjustments)],
      [t('summary.paid'), '', '', num(s.summary.paid)],
      [t('summary.closing'), '', '', num(s.summary.closing)],
    ]
    const csv = '﻿' + lines.map((r) => r.map((v) => cell(String(v))).join(sep)).join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `${s.instructor.name.replace(/\s+/g, '-')}-${s.month}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const columns: ColumnDef<Lesson>[] = [
    {
      id: 'expand',
      meta: { className: 'w-10 print:hidden' },
      header: () => null,
      cell: ({ row }) =>
        row.getCanExpand() ? (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={row.getToggleExpandedHandler()}
            aria-label={row.getIsExpanded() ? tc('close') : t('statement.showDetails')}
            aria-expanded={row.getIsExpanded()}
          >
            {row.getIsExpanded() ? <ChevronDown /> : <ChevronRight />}
          </Button>
        ) : null,
    },
    {
      accessorKey: 'date',
      header: () => <ColumnHeader k="lessonDate" />,
      cell: ({ row }) => <FormattedDate value={`${row.original.date}T00:00:00`} />,
    },
    {
      accessorKey: 'course',
      header: () => <ColumnHeader k="course" />,
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.course}</p>
          <p className="text-xs text-muted-foreground">
            {[row.original.branch, row.original.danceType].filter(Boolean).join(' · ')}
          </p>
        </div>
      ),
    },
    {
      id: 'rate',
      header: () => <ColumnHeader k="rate" />,
      cell: ({ row }) => {
        const b = row.original.breakdown
        return b ? (
          <span className="text-sm text-muted-foreground">
            {termsLabel({ pay_model: b.model, ratio: b.ratio, amount: b.amount, min_amount: b.minAmount })}
          </span>
        ) : (
          '—'
        )
      },
    },
    {
      accessorKey: 'amount',
      header: () => <ColumnHeader k="amount" />,
      cell: ({ row }) => (
        <div className="tabular-nums">
          <span className="font-semibold">{money(row.original.amount)}</span>
          {row.original.isManual && (
            <p className="text-xs text-muted-foreground">
              {t('statement.manual')}
              {row.original.calculatedAmount !== null &&
                ` · ${t('statement.calculated', { amount: money(row.original.calculatedAmount) })}`}
            </p>
          )}
        </div>
      ),
    },
  ]

  return (
    <>
      <div className="flex flex-col gap-3 print:hidden lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {instructors.length > 1 && (
            <Select value={s?.instructor.id ?? ''} onValueChange={selectInstructor}>
              <SelectTrigger className="w-full sm:w-64" aria-label={t('statement.instructor')}>
                <SelectValue placeholder={t('statement.selectInstructor')} />
              </SelectTrigger>
              <SelectContent>
                {instructors.map((i) => (
                  <SelectItem key={i.id} value={i.id}>
                    {i.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {s && <MonthSwitcher month={s.month} />}
        </div>
        {s && (
          <div className="flex flex-wrap gap-2">
            {editable && (
              <>
                <Button onClick={() => setDialog((d) => ({ kind: 'payout', key: (d?.key ?? 0) + 1 }))}>
                  <Banknote /> {t('payouts.pay')}
                </Button>
                <Button variant="outline" onClick={() => setDialog((d) => ({ kind: 'adjustment', key: (d?.key ?? 0) + 1 }))}>
                  <Plus /> {t('payouts.addItem')}
                </Button>
              </>
            )}
            <Button variant="outline" onClick={() => window.print()}>
              <Printer /> {t('statement.print')}
            </Button>
            <Button variant="outline" onClick={downloadCsv}>
              <Download /> {t('statement.downloadCsv')}
            </Button>
          </div>
        )}
      </div>

      {s && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold">
              {s.instructor.name} · <span className="capitalize">{monthLabel(s.month)}</span>
            </h2>
            {s.isClosed && (
              <Badge variant="secondary">
                <Lock /> {t('period.closed')}
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            {(['opening', 'earned', 'adjustments', 'paid', 'closing'] as const).map((key) => (
              <Card key={key} className={key === 'closing' ? 'col-span-2 gap-1 p-4 md:col-span-1' : 'gap-1 p-4'}>
                <p className="truncate text-xs text-muted-foreground sm:text-sm">{t(`summary.${key}`)}</p>
                <p className={cn('truncate text-xl font-bold tabular-nums sm:text-2xl', key === 'closing' && 'text-primary')}>
                  {money(s.summary[key])}
                </p>
                {key === 'earned' && (
                  <p className="text-xs text-muted-foreground">{t('summary.lessons', { count: s.summary.lessonCount })}</p>
                )}
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('statement.lessons')}</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable<Lesson, unknown>
                columns={columns}
                data={s.lessons}
                enablePagination={false}
                enableSearch={false}
                enableFilters={false}
                emptyMessage={t('statement.noLessons')}
                getRowCanExpand={(row) => !!row.original.breakdown}
                renderSubComponent={({ row }) =>
                  row.original.breakdown ? <Breakdown b={row.original.breakdown} /> : null
                }
              />
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t('statement.items')}</CardTitle>
              </CardHeader>
              <CardContent>
                {s.adjustments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('statement.noItems')}</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>
                          <ColumnHeader k="date" />
                        </TableHead>
                        <TableHead>
                          <ColumnHeader k="description" />
                        </TableHead>
                        <TableHead className="text-right">
                          <ColumnHeader k="amount" />
                        </TableHead>
                        {editable && <TableHead className="w-10 print:hidden" />}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {s.adjustments.map((a) => (
                        <TableRow key={a.id}>
                          <TableCell className="whitespace-nowrap">
                            <FormattedDate value={`${a.date}T00:00:00`} />
                          </TableCell>
                          <TableCell>
                            <p>{kindLabel(a)}</p>
                            {a.description && <p className="text-xs text-muted-foreground">{a.description}</p>}
                          </TableCell>
                          <TableCell className={cn('text-right tabular-nums', a.amount < 0 && 'text-danger')}>
                            {money(a.amount)}
                          </TableCell>
                          {editable && (
                            <TableCell className="print:hidden">
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                className="text-destructive"
                                aria-label={tc('delete')}
                                disabled={remove.pending}
                                onClick={async () => {
                                  if (!(await confirm({ title: t('statement.deleteItemConfirm'), destructive: true }))) return
                                  remove.run(() => deleteAdjustment(a.id), { success: t('statement.deleted') })
                                }}
                              >
                                <Trash2 />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('statement.payments')}</CardTitle>
              </CardHeader>
              <CardContent>
                {s.payouts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('statement.noPayments')}</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>
                          <ColumnHeader k="date" />
                        </TableHead>
                        <TableHead>
                          <ColumnHeader k="method" />
                        </TableHead>
                        <TableHead className="text-right">
                          <ColumnHeader k="amount" />
                        </TableHead>
                        {editable && <TableHead className="w-10 print:hidden" />}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {s.payouts.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="whitespace-nowrap">
                            <FormattedDate value={`${p.date}T00:00:00`} />
                          </TableCell>
                          <TableCell>
                            <p>{t(`methods.${p.method}`)}</p>
                            <p className="text-xs text-muted-foreground">{[p.branch, p.note].filter(Boolean).join(' · ')}</p>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{money(p.amount)}</TableCell>
                          {editable && (
                            <TableCell className="print:hidden">
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                className="text-destructive"
                                aria-label={tc('delete')}
                                disabled={remove.pending}
                                onClick={async () => {
                                  if (!(await confirm({ title: t('statement.deletePaymentConfirm'), destructive: true }))) return
                                  remove.run(() => deletePayout(p.id), { success: t('statement.deleted') })
                                }}
                              >
                                <Trash2 />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          {dialog?.kind === 'payout' && (
            <PayoutDialog
              key={dialog.key}
              open
              onOpenChange={(o) => !o && setDialog(null)}
              instructor={s.instructor}
              balance={s.summary.closing}
              branches={s.branches}
              defaultDate={defaultDate}
            />
          )}
          {dialog?.kind === 'adjustment' && (
            <AdjustmentDialog
              key={dialog.key}
              open
              onOpenChange={(o) => !o && setDialog(null)}
              instructor={s.instructor}
              defaultDate={defaultDate}
            />
          )}
        </>
      )}
    </>
  )
}

/** The month's last day, or today when that is earlier. */
function lastDay(month: string, today: string) {
  const [y, m] = month.split('-').map(Number)
  const last = `${month}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`
  return last < today ? last : today
}

'use client'

import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import type { ColumnDef } from '@tanstack/react-table'
import { MessageCircle, MessageSquare } from 'lucide-react'
import { Link, useRouter } from '@/i18n/navigation'
import { Card } from '@/components/ui/card'
import { DataTable } from '@/components/table/data-table'
import { ColumnHeader } from '@/components/table/column-header'
import { FormattedDate } from '@/components/common/FormattedDate'
import type { getMessageLogs } from '@/lib/actions/messages.actions'
import type { ActionData } from '@/lib/types/actions'

type Log = ActionData<typeof getMessageLogs>[number]

export function HistoryPanel({
  logs,
  totalCount,
  page,
  pageSize,
}: {
  logs: Log[]
  totalCount: number
  page: number
  pageSize: number
}) {
  const t = useTranslations('messages')
  const router = useRouter()
  const searchParams = useSearchParams()

  const columns: ColumnDef<Log>[] = [
    {
      accessorKey: 'created_at',
      header: () => <ColumnHeader k="date" />,
      cell: ({ row }) => (
        <span className="whitespace-nowrap">
          <FormattedDate value={row.original.created_at} withTime />
        </span>
      ),
    },
    {
      id: 'student',
      header: () => <ColumnHeader k="studentName" />,
      cell: ({ row }) =>
        row.original.students && row.original.student_id ? (
          <Link href={`/dashboard/students/${row.original.student_id}`} className="font-medium hover:underline">
            {row.original.students.first_name} {row.original.students.last_name}
          </Link>
        ) : (
          '—'
        ),
    },
    {
      accessorKey: 'channel',
      header: () => <ColumnHeader k="channel" />,
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
          {row.original.channel === 'whatsapp' ? <MessageCircle className="size-4" /> : <MessageSquare className="size-4" />}
          {row.original.channel === 'whatsapp' ? 'WhatsApp' : 'SMS'}
        </span>
      ),
    },
    {
      id: 'message',
      header: () => <ColumnHeader k="message" />,
      cell: ({ row }) => (
        <div className="max-w-md">
          {row.original.message_templates?.name && (
            <p className="text-xs font-medium">{row.original.message_templates.name}</p>
          )}
          <p className="line-clamp-2 text-sm whitespace-pre-line text-muted-foreground">{row.original.body}</p>
        </div>
      ),
    },
  ]

  return (
    <Card className="p-3 sm:p-4 md:p-6">
      <DataTable<Log, unknown>
        columns={columns}
        data={logs}
        enableSearch={false}
        enableFilters={false}
        totalItems={totalCount}
        currentPage={page}
        pageSize={pageSize}
        onPageChange={(p) => {
          const params = new URLSearchParams(searchParams.toString())
          params.set('page', String(p))
          router.push(`?${params.toString()}`)
        }}
        emptyMessage={t('history.empty')}
      />
      <p className="mt-3 text-xs text-muted-foreground">{t('history.note')}</p>
    </Card>
  )
}

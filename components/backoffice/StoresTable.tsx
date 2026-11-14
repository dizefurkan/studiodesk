'use client'

import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/table/data-table'
import type { StoreSummary } from '@/lib/actions/backoffice.actions'
import { FormattedDate } from '@/components/common/FormattedDate'

export function StoresTable({ stores }: { stores: StoreSummary[] }) {
  const t = useTranslations('backoffice')
  const columns: ColumnDef<StoreSummary>[] = [
    {
      accessorKey: 'name',
      header: t('stores.name'),
      cell: ({ row }) => (
        <div>
          <Link
            href={`/backoffice/stores/${row.original.id}`}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {row.original.name}
          </Link>
          <div className="text-xs text-muted-foreground"><FormattedDate value={row.original.created_at} /></div>
        </div>
      ),
    },
    {
      id: 'owner',
      header: t('stores.owner'),
      cell: ({ row }) =>
        row.original.owners.length ? row.original.owners.map((o) => o.full_name || o.email).join(', ') : '—',
    },
    { accessorKey: 'branchCount', header: t('branches.title') },
    { accessorKey: 'memberCount', header: t('members.title') },
    {
      id: 'status',
      header: t('common.status'),
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? 'secondary' : 'destructive'}>
          {row.original.is_active ? t('stores.active') : t('stores.suspended')}
        </Badge>
      ),
    },
  ]
  return (
    <DataTable<StoreSummary, unknown>
      columns={columns}
      data={stores}
      enableSearch={false}
      enableFilters={false}
      enablePagination={false}
    />
  )
}

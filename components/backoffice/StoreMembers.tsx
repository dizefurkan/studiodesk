'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Trash2, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/table/data-table'
import { useConfirm } from '@/components/common/ConfirmProvider'
import {
  addStoreMember,
  removeStoreMember,
  updateStoreMemberRole,
  type StoreMember,
  type StoreRole,
} from '@/lib/actions/backoffice.actions'
import { useServerAction } from '@/hooks/useServerAction'

const ROLES: StoreRole[] = ['owner', 'manager', 'instructor', 'staff']

export function StoreMembers({
  organizationId,
  members,
  accounts,
}: {
  organizationId: string
  members: StoreMember[]
  accounts: { id: string; label: string }[]
}) {
  const t = useTranslations('backoffice')
  const confirm = useConfirm()
  const add = useServerAction()
  const rowAction = useServerAction()
  const [userId, setUserId] = useState('')
  const [role, setRole] = useState<StoreRole>('staff')

  const memberIds = new Set(members.map((m) => m.user_id))
  const candidates = accounts.filter((a) => !memberIds.has(a.id))

  const roleSelect = (value: StoreRole, onChange: (r: StoreRole) => void, props: { className?: string; disabled?: boolean; label: string }) => (
    <Select value={value} onValueChange={(v) => onChange(v as StoreRole)} disabled={props.disabled}>
      <SelectTrigger className={props.className} aria-label={props.label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ROLES.map((r) => (
          <SelectItem key={r} value={r}>
            {t(`roles.${r}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )

  const columns: ColumnDef<StoreMember>[] = [
    {
      id: 'name',
      header: t('accounts.name'),
      cell: ({ row }) => (
        <div className="font-medium">
          {row.original.full_name || '—'}
          <span className="block text-xs font-normal text-muted-foreground">{row.original.email}</span>
        </div>
      ),
    },
    {
      id: 'role',
      header: t('members.role'),
      cell: ({ row }) =>
        roleSelect(
          row.original.role,
          (r) => rowAction.run(() => updateStoreMemberRole(row.original.id, r), { success: t('common.updated') }),
          { className: 'w-32', disabled: rowAction.pending, label: t('members.role') }
        ),
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">{t('common.actions')}</span>,
      cell: ({ row }) => {
        const m = row.original
        return (
          <div className="text-right">
            <Button
              size="icon-sm"
              variant="ghost"
              disabled={rowAction.pending}
              aria-label={t('members.remove')}
              onClick={async () => {
                if (
                  !(await confirm({
                    title: t('members.removeConfirm', { name: m.full_name || m.email || '' }),
                    destructive: true,
                    confirmLabel: t('members.remove'),
                  }))
                )
                  return
                rowAction.run(() => removeStoreMember(m.id), { success: t('common.deleted') })
              }}
            >
              <Trash2 className="text-destructive" />
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">
        {t('members.title')} <span className="text-muted-foreground">({members.length})</span>
      </h2>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          add.run(() => addStoreMember(organizationId, userId, role), {
            success: t('common.saved'),
            onSuccess: () => setUserId(''),
          })
        }}
      >
        <div className="flex flex-col gap-2 sm:flex-row">
          <Select value={userId} onValueChange={setUserId}>
            <SelectTrigger className="w-full sm:flex-1" aria-label={t('members.selectAccount')}>
              <SelectValue placeholder={t('members.selectAccount')} />
            </SelectTrigger>
            <SelectContent>
              {candidates.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {roleSelect(role, setRole, { className: 'w-full sm:w-40', label: t('members.role') })}
          <Button type="submit" disabled={add.pending || !userId}>
            <UserPlus /> {t('members.add')}
          </Button>
        </div>
      </form>

      <DataTable<StoreMember, unknown>
        columns={columns}
        data={members}
        enableSearch={false}
        enableFilters={false}
        enablePagination={false}
        emptyMessage={t('members.empty')}
      />
    </div>
  )
}

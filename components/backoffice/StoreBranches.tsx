'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Archive, ArchiveRestore, Pencil, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/table/data-table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useConfirm } from '@/components/common/ConfirmProvider'
import { createBranch, setBranchArchived, updateBranch, type StoreBranch } from '@/lib/actions/backoffice.actions'
import { useServerAction } from '@/hooks/useServerAction'

function BranchDialog({
  open,
  onOpenChange,
  organizationId,
  branch,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  organizationId: string
  branch: StoreBranch | null
}) {
  const t = useTranslations('backoffice')
  const { pending, run } = useServerAction()
  const [name, setName] = useState(branch?.name ?? '')
  const [address, setAddress] = useState(branch?.address ?? '')
  const [phone, setPhone] = useState(branch?.phone ?? '')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form
          className="grid gap-6"
          onSubmit={(e) => {
            e.preventDefault()
            const input = { name, address, phone }
            run(() => (branch ? updateBranch(branch.id, input) : createBranch(organizationId, input)), {
              success: t('common.saved'),
              onSuccess: () => onOpenChange(false),
            })
          }}
        >
          <DialogHeader>
            <DialogTitle>{branch ? t('branches.edit') : t('branches.add')}</DialogTitle>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="branch-name">{t('branches.name')}</FieldLabel>
              <Input id="branch-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </Field>
            <Field>
              <FieldLabel htmlFor="branch-address">{t('branches.address')}</FieldLabel>
              <Input id="branch-address" value={address} onChange={(e) => setAddress(e.target.value)} />
            </Field>
            <Field>
              <FieldLabel htmlFor="branch-phone">{t('branches.phone')}</FieldLabel>
              <Input id="branch-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Spinner />}
              {pending ? t('common.saving') : t('common.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function StoreBranches({ organizationId, branches }: { organizationId: string; branches: StoreBranch[] }) {
  const t = useTranslations('backoffice')
  const confirm = useConfirm()
  const archive = useServerAction()
  const [dialog, setDialog] = useState<{ open: boolean; branch: StoreBranch | null; key: number }>({
    open: false,
    branch: null,
    key: 0,
  })
  const open = (branch: StoreBranch | null) => setDialog((d) => ({ open: true, branch, key: d.key + 1 }))

  const columns: ColumnDef<StoreBranch>[] = [
    { accessorKey: 'name', header: t('branches.name'), cell: ({ row }) => <span className="font-medium">{row.original.name}</span> },
    { accessorKey: 'address', header: t('branches.address'), cell: ({ row }) => row.original.address || '—' },
    { accessorKey: 'phone', header: t('branches.phone'), cell: ({ row }) => row.original.phone || '—' },
    {
      id: 'status',
      header: t('common.status'),
      cell: ({ row }) => (
        <Badge variant={row.original.deleted_at ? 'outline' : 'secondary'}>
          {row.original.deleted_at ? t('branches.archived') : t('stores.active')}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">{t('common.actions')}</span>,
      cell: ({ row }) => {
        const b = row.original
        return (
          <div className="text-right whitespace-nowrap">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon-sm" variant="ghost" onClick={() => open(b)} aria-label={t('branches.edit')}>
                  <Pencil />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('branches.edit')}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  disabled={archive.pending}
                  aria-label={b.deleted_at ? t('branches.restore') : t('branches.archive')}
                  onClick={async () => {
                    if (
                      !b.deleted_at &&
                      !(await confirm({
                        title: t('branches.archiveConfirm', { name: b.name }),
                        destructive: true,
                        confirmLabel: t('branches.archive'),
                      }))
                    )
                      return
                    archive.run(() => setBranchArchived(b.id, !b.deleted_at), { success: t('common.updated') })
                  }}
                >
                  {b.deleted_at ? <ArchiveRestore /> : <Archive />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{b.deleted_at ? t('branches.restore') : t('branches.archive')}</TooltipContent>
            </Tooltip>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {t('branches.title')}{' '}
          <span className="text-muted-foreground">({branches.filter((b) => !b.deleted_at).length})</span>
        </h2>
        <Button size="sm" onClick={() => open(null)}>
          <Plus /> {t('branches.add')}
        </Button>
      </div>
      <DataTable<StoreBranch, unknown>
        columns={columns}
        data={branches}
        enableSearch={false}
        enableFilters={false}
        enablePagination={false}
        emptyMessage={t('branches.empty')}
      />
      <BranchDialog
        key={dialog.key}
        open={dialog.open}
        onOpenChange={(o) => setDialog((d) => ({ ...d, open: o }))}
        organizationId={organizationId}
        branch={dialog.branch}
      />
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Layers, Pencil, Plus, Tag, Trash2 } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/table/data-table'
import { ColumnHeader } from '@/components/table/column-header'
import { useConfirm } from '@/components/common/ConfirmProvider'
import { useServerAction } from '@/hooks/useServerAction'
import { createLabel, deleteLabel, renameLabel } from '@/lib/actions/labels.actions'
import type { ActionData } from '@/lib/types/actions'
import type { getLabels } from '@/lib/actions/labels.actions'

type Label = ActionData<typeof getLabels>[number]

/** Create, rename and delete the studio's labels (e.g. levels). */
export function LabelsManager({ labels }: { labels: Label[] }) {
  const t = useTranslations('labels')
  const confirm = useConfirm()
  const { pending, run } = useServerAction()
  const [name, setName] = useState('')
  const [editing, setEditing] = useState<Label | null>(null)
  const [editName, setEditName] = useState('')

  const add = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    run(() => createLabel(name), { success: t('created'), onSuccess: () => setName('') })
  }

  // One tap for the common case: level labels
  const addLevels = () =>
    run(
      async () => {
        for (const level of [t('levels.beginner'), t('levels.intermediate'), t('levels.advanced')]) {
          const res = await createLabel(level)
          if (res.error && !res.duplicate) return res
        }
        return {}
      },
      { success: t('levelsCreated') }
    )

  const columns: ColumnDef<Label>[] = [
    {
      id: 'name',
      header: () => <ColumnHeader k="name" />,
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      id: 'students',
      header: () => <ColumnHeader k="students" />,
      cell: ({ row }) =>
        row.original.studentCount > 0 ? (
          <Link href={`/dashboard/students?label=${row.original.id}`} className="tabular-nums text-primary hover:underline">
            {row.original.studentCount}
          </Link>
        ) : (
          <span className="tabular-nums text-muted-foreground">0</span>
        ),
    },
    {
      id: 'courses',
      header: () => <ColumnHeader k="courses" />,
      cell: ({ row }) => <span className="tabular-nums">{row.original.courseCount}</span>,
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">{t('actions')}</span>,
      cell: ({ row }) => {
        const l = row.original
        return (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t('rename')}
              onClick={() => {
                setEditing(l)
                setEditName(l.name)
              }}
            >
              <Pencil />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-destructive"
              aria-label={t('delete')}
              disabled={pending}
              onClick={async () => {
                const ok = await confirm({
                  title: t('deleteConfirmTitle', { name: l.name }),
                  description: t('deleteConfirmDescription'),
                  destructive: true,
                })
                if (ok) run(() => deleteLabel(l.id), { success: t('deleted') })
              }}
            >
              <Trash2 />
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <form onSubmit={add} className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <Field className="flex-1">
            <FieldLabel htmlFor="new-label">{t('newLabel')}</FieldLabel>
            <Input
              id="new-label"
              value={name}
              maxLength={40}
              placeholder={t('newLabelPlaceholder')}
              onChange={(e) => setName(e.target.value)}
              disabled={pending}
            />
          </Field>
          <Button type="submit" disabled={pending || !name.trim()}>
            {pending ? <Spinner /> : <Plus />} {t('addButton')}
          </Button>
        </form>
      </Card>

      {labels.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Tag />
            </EmptyMedia>
            <EmptyTitle>{t('emptyTitle')}</EmptyTitle>
            <EmptyDescription>{t('emptyDescription')}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" onClick={addLevels} disabled={pending}>
              <Layers /> {t('addLevels')}
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <DataTable<Label, unknown>
          columns={columns}
          data={labels}
          enableSearch={false}
          enableFilters={false}
          enablePagination={false}
        />
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!editing) return
              run(() => renameLabel(editing.id, editName), { success: t('renamed'), onSuccess: () => setEditing(null) })
            }}
            className="space-y-4"
          >
            <DialogHeader>
              <DialogTitle>{t('rename')}</DialogTitle>
              <DialogDescription>{t('renameHint')}</DialogDescription>
            </DialogHeader>
            <Field>
              <FieldLabel htmlFor="edit-label">{t('name')}</FieldLabel>
              <Input id="edit-label" value={editName} maxLength={40} onChange={(e) => setEditName(e.target.value)} />
            </Field>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                {t('cancel')}
              </Button>
              <Button type="submit" disabled={pending || !editName.trim()}>
                {pending && <Spinner />} {t('save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

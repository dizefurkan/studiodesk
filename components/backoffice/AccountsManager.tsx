'use client'

import { Link } from '@/i18n/navigation'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Ban, Check, Copy, KeyRound, MoreHorizontal, Plus, Shield, ShieldOff, UserCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { Spinner } from '@/components/ui/spinner'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/table/data-table'
import { useConfirm } from '@/components/common/ConfirmProvider'
import { generateTemporaryPassword } from '@/lib/utils/generatePassword'
import {
  createAccount,
  setAccountBanned,
  setAccountPassword,
  setPlatformAdmin,
  type Account,
} from '@/lib/actions/backoffice.actions'
import { useServerAction } from '@/hooks/useServerAction'
import { FormattedDate } from '@/components/common/FormattedDate'

function PasswordField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (v: string) => void }) {
  const t = useTranslations('backoffice')
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <InputGroup>
        <InputGroupInput
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          minLength={8}
          className="font-mono"
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton onClick={() => onChange(generateTemporaryPassword())}>{t('accounts.generate')}</InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </Field>
  )
}

function Credentials({ email, password }: { email: string; password: string }) {
  const t = useTranslations('backoffice')
  const [copied, setCopied] = useState(false)
  return (
    <InputGroup>
      <InputGroupInput readOnly value={email ? `${email}  ·  ${password}` : password} className="font-mono" />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          size="icon-xs"
          aria-label={t('copy')}
          onClick={() => {
            navigator.clipboard.writeText(email ? `${email}\n${password}` : password)
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
          }}
        >
          {copied ? <Check /> : <Copy />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  )
}

function CreateAccountDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const t = useTranslations('backoffice')
  const { pending, run } = useServerAction()
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState(() => generateTemporaryPassword())
  const [created, setCreated] = useState(false)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('accounts.create')}</DialogTitle>
          {created && <DialogDescription>{t('accounts.createdHint')}</DialogDescription>}
        </DialogHeader>
        {created ? (
          <>
            <Credentials email={email} password={password} />
            <DialogFooter>
              <Button onClick={() => onOpenChange(false)}>{t('common.close')}</Button>
            </DialogFooter>
          </>
        ) : (
          <form
            className="grid gap-6"
            onSubmit={(e) => {
              e.preventDefault()
              run(() => createAccount({ email, password, fullName }), { onSuccess: () => setCreated(true) })
            }}
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="acc-name">{t('accounts.name')}</FieldLabel>
                <Input id="acc-name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </Field>
              <Field>
                <FieldLabel htmlFor="acc-email">{t('accounts.email')}</FieldLabel>
                <Input id="acc-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </Field>
              <PasswordField id="acc-password" label={t('accounts.password')} value={password} onChange={setPassword} />
            </FieldGroup>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={pending}>
                {pending && <Spinner />}
                {pending ? t('common.saving') : t('accounts.create')}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

function PasswordDialog({ account, onClose }: { account: Account; onClose: () => void }) {
  const t = useTranslations('backoffice')
  const { pending, run } = useServerAction()
  const [password, setPassword] = useState(() => generateTemporaryPassword())
  const [done, setDone] = useState(false)

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('accounts.setPassword')}</DialogTitle>
          <DialogDescription>{done ? t('accounts.passwordUpdated') : account.email}</DialogDescription>
        </DialogHeader>
        {done ? (
          <>
            <Credentials email="" password={password} />
            <DialogFooter>
              <Button onClick={onClose}>{t('common.close')}</Button>
            </DialogFooter>
          </>
        ) : (
          <form
            className="grid gap-6"
            onSubmit={(e) => {
              e.preventDefault()
              run(() => setAccountPassword(account.id, password), { onSuccess: () => setDone(true) })
            }}
          >
            <PasswordField id="acc-new-password" label={t('accounts.newPassword')} value={password} onChange={setPassword} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={pending}>
                {pending && <Spinner />}
                {t('common.save')}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

export function AccountsManager({ accounts, currentUserId }: { accounts: Account[]; currentUserId: string }) {
  const t = useTranslations('backoffice')
  const confirm = useConfirm()
  const rowAction = useServerAction()
  const [createKey, setCreateKey] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)
  const [pwFor, setPwFor] = useState<Account | null>(null)

  const columns: ColumnDef<Account>[] = [
    {
      id: 'name',
      header: t('accounts.name'),
      cell: ({ row }) => {
        const a = row.original
        return (
          <div>
            <div className="flex items-center gap-1.5 font-medium">
              {a.full_name || '—'}
              {a.is_platform_admin && (
                <Badge variant="secondary">
                  <Shield /> {t('accounts.platformAdmin')}
                </Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground">{a.email}</div>
          </div>
        )
      },
    },
    {
      id: 'stores',
      header: t('accounts.stores'),
      cell: ({ row }) =>
        row.original.memberships.length === 0 ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {row.original.memberships.map((m) => (
              <Badge key={m.id} variant="outline" asChild>
                <Link href={`/backoffice/stores/${m.organization_id}`}>
                  {m.organization_name} · {t(`roles.${m.role}`)}
                </Link>
              </Badge>
            ))}
          </div>
        ),
    },
    {
      id: 'lastSignIn',
      header: t('accounts.lastSignIn'),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.last_sign_in_at ? <FormattedDate value={row.original.last_sign_in_at} withTime /> : t('accounts.never')}
        </span>
      ),
    },
    {
      id: 'status',
      header: t('common.status'),
      cell: ({ row }) => (
        <Badge variant={row.original.banned ? 'destructive' : 'secondary'}>
          {row.original.banned ? t('accounts.disabled') : t('stores.active')}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">{t('common.actions')}</span>,
      cell: ({ row }) => {
        const a = row.original
        const isMe = a.id === currentUserId
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label={t('common.actions')} disabled={rowAction.pending}>
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setPwFor(a)}>
                  <KeyRound /> {t('accounts.setPassword')}
                </DropdownMenuItem>
                {!isMe && (
                  <>
                    <DropdownMenuItem
                      onSelect={() =>
                        rowAction.run(() => setPlatformAdmin(a.id, !a.is_platform_admin), { success: t('common.updated') })
                      }
                    >
                      {a.is_platform_admin ? <ShieldOff /> : <Shield />}
                      {a.is_platform_admin ? t('accounts.removeAdmin') : t('accounts.makeAdmin')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant={a.banned ? 'default' : 'destructive'}
                      onSelect={async () => {
                        if (
                          !a.banned &&
                          !(await confirm({
                            title: t('accounts.disableConfirm', { email: a.email || '' }),
                            destructive: true,
                            confirmLabel: t('accounts.disable'),
                          }))
                        )
                          return
                        rowAction.run(() => setAccountBanned(a.id, !a.banned), { success: t('common.updated') })
                      }}
                    >
                      {a.banned ? <UserCheck /> : <Ban />}
                      {a.banned ? t('accounts.enable') : t('accounts.disable')}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={() => {
            setCreateKey((k) => k + 1)
            setCreateOpen(true)
          }}
        >
          <Plus /> {t('accounts.create')}
        </Button>
      </div>

      <DataTable<Account, unknown>
        columns={columns}
        data={accounts}
        enableSearch={false}
        enableFilters={false}
        enablePagination={false}
        emptyMessage={t('accounts.empty')}
      />

      <CreateAccountDialog key={createKey} open={createOpen} onOpenChange={setCreateOpen} />
      {pwFor && <PasswordDialog account={pwFor} onClose={() => setPwFor(null)} />}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Check, Copy, KeyRound, Trash2, UserPlus, Users } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '@/components/ui/item'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { sendTeamInvitation } from '@/lib/actions/invitations.actions'
import { removeTeamMember, resetTeamMemberPassword, updateTeamMemberRole } from '@/lib/actions/organization.actions'
import { useServerAction } from '@/hooks/useServerAction'

export interface TeamMember {
  id: string
  user_id: string
  role: 'owner' | 'manager' | 'instructor' | 'staff'
  email: string | null
  full_name: string | null
}

interface Props {
  members: TeamMember[]
  currentUserId: string
  isOwner: boolean
  canInvite: boolean
  canChangeRoles: boolean
  canRemove: boolean
}

function initials(m: TeamMember) {
  const src = m.full_name || m.email || '?'
  return src
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join('')
}

function CopyField({ id, label, value }: { id: string; label: string; value: string }) {
  const t = useTranslations('settings')
  const [copied, setCopied] = useState(false)
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <InputGroup>
        <InputGroupInput id={id} value={value} readOnly className="font-mono" />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            size="icon-xs"
            aria-label={t('copy')}
            onClick={() => {
              navigator.clipboard.writeText(value)
              setCopied(true)
              setTimeout(() => setCopied(false), 1500)
            }}
          >
            {copied ? <Check /> : <Copy />}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </Field>
  )
}

function CredentialsDialog({
  credentials,
  onClose,
}: {
  credentials: { email: string; password: string } | null
  onClose: () => void
}) {
  const t = useTranslations('settings')
  return (
    <Dialog open={!!credentials} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('teamPage.credentialsTitle')}</DialogTitle>
          <DialogDescription>{t('teamPage.credentialsDescription')}</DialogDescription>
        </DialogHeader>
        {credentials && (
          <FieldGroup>
            <CopyField id="cred-email" label={t('teamPage.email')} value={credentials.email} />
            <CopyField id="cred-password" label={t('teamPage.password')} value={credentials.password} />
          </FieldGroup>
        )}
        <DialogFooter>
          <Button onClick={onClose}>{t('close')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AddMemberDialog({
  open,
  onOpenChange,
  isOwner,
  onCreated,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  isOwner: boolean
  onCreated: (c: { email: string; password: string } | null) => void
}) {
  const t = useTranslations('settings')
  const { pending, run } = useServerAction()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('staff')
  const roles = isOwner ? ['staff', 'instructor', 'manager'] : ['staff', 'instructor']

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            run(
              async () => {
                const res = await sendTeamInvitation(email, role)
                if (!res.error) {
                  onOpenChange(false)
                  onCreated(
                    res.isNewUser && res.temporaryPassword
                      ? { email: res.email || email, password: res.temporaryPassword }
                      : null
                  )
                  setEmail('')
                  setRole('staff')
                }
                return res
              },
              { success: t('teamPage.added') }
            )
          }}
          className="grid gap-6"
        >
          <DialogHeader>
            <DialogTitle>{t('teamPage.addTitle')}</DialogTitle>
            <DialogDescription>{t('teamPage.addDescription')}</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="member-email">{t('teamPage.email')}</FieldLabel>
              <Input id="member-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </Field>
            <Field>
              <FieldLabel htmlFor="member-role">{t('teamPage.role')}</FieldLabel>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger id="member-role" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r} value={r}>
                      {t(`roles.${r}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Spinner />}
              {t('teamPage.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function TeamSettings({ members, currentUserId, isOwner, canInvite, canChangeRoles, canRemove }: Props) {
  const t = useTranslations('settings')
  const row = useServerAction()
  const [addOpen, setAddOpen] = useState(false)
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null)
  const [removing, setRemoving] = useState<TeamMember | null>(null)

  const addButton = canInvite && (
    <Button onClick={() => setAddOpen(true)}>
      <UserPlus /> {t('teamPage.add')}
    </Button>
  )

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t('sections.team.title')}</CardTitle>
          <CardDescription>{t('teamPage.members', { count: members.length })}</CardDescription>
          {members.length > 0 && <CardAction>{addButton}</CardAction>}
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <Empty className="border border-dashed">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Users />
                </EmptyMedia>
                <EmptyTitle>{t('teamPage.empty')}</EmptyTitle>
                <EmptyDescription>{t('teamPage.emptyHint')}</EmptyDescription>
              </EmptyHeader>
              {addButton && <EmptyContent>{addButton}</EmptyContent>}
            </Empty>
          ) : (
            <ItemGroup className="gap-2">
              {members.map((m) => {
                const isMe = m.user_id === currentUserId
                const editable = m.role !== 'owner' && !isMe
                const name = m.full_name || m.email || '—'
                return (
                  <Item key={m.id} variant="outline">
                    <ItemMedia>
                      <Avatar>
                        <AvatarFallback>{initials(m)}</AvatarFallback>
                      </Avatar>
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>
                        {name}
                        {isMe && <Badge variant="secondary">{t('teamPage.you')}</Badge>}
                      </ItemTitle>
                      {m.full_name && <ItemDescription>{m.email}</ItemDescription>}
                    </ItemContent>
                    <ItemActions>
                      {editable && canChangeRoles ? (
                        <Select
                          value={m.role}
                          disabled={row.pending}
                          onValueChange={(role) =>
                            row.run(() => updateTeamMemberRole(m.id, role), { success: t('teamPage.roleUpdated') })
                          }
                        >
                          <SelectTrigger size="sm" className="w-32" aria-label={t('teamPage.role')}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {['staff', 'instructor', 'manager'].map((r) => (
                              <SelectItem key={r} value={r}>
                                {t(`roles.${r}`)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant={m.role === 'owner' ? 'default' : 'outline'}>{t(`roles.${m.role}`)}</Badge>
                      )}
                      {editable && isOwner && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              disabled={row.pending}
                              aria-label={t('teamPage.resetPassword')}
                              onClick={() =>
                                row.run(async () => {
                                  const res = await resetTeamMemberPassword(m.id)
                                  if (res.success && res.temporaryPassword)
                                    setCredentials({ email: m.email || '', password: res.temporaryPassword })
                                  return res
                                })
                              }
                            >
                              <KeyRound />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{t('teamPage.resetPassword')}</TooltipContent>
                        </Tooltip>
                      )}
                      {editable && canRemove && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              disabled={row.pending}
                              aria-label={t('teamPage.remove')}
                              onClick={() => setRemoving(m)}
                            >
                              <Trash2 className="text-destructive" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{t('teamPage.remove')}</TooltipContent>
                        </Tooltip>
                      )}
                    </ItemActions>
                  </Item>
                )
              })}
            </ItemGroup>
          )}
        </CardContent>
      </Card>

      <AddMemberDialog open={addOpen} onOpenChange={setAddOpen} isOwner={isOwner} onCreated={setCredentials} />
      <CredentialsDialog credentials={credentials} onClose={() => setCredentials(null)} />

      <AlertDialog open={!!removing} onOpenChange={(o) => !o && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('teamPage.removeTitle', { name: removing?.full_name || removing?.email || '' })}
            </AlertDialogTitle>
            <AlertDialogDescription>{t('teamPage.removeDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                const m = removing
                setRemoving(null)
                if (m) row.run(() => removeTeamMember(m.id), { success: t('teamPage.removed') })
              }}
            >
              {t('teamPage.remove')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

'use client'

import { useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { useConfirm } from '@/components/common/ConfirmProvider'
import { useServerAction } from '@/hooks/useServerAction'
import { deleteMessageTemplate, saveMessageTemplate, type getMessageTemplates } from '@/lib/actions/messages.actions'
import { MESSAGE_CATEGORIES, MESSAGE_TOKENS, renderTemplate, type MessageToken } from '@/lib/messages/template'
import type { ActionData } from '@/lib/types/actions'

type Template = ActionData<typeof getMessageTemplates>[number]

/** Sample values for the live preview in the editor. */
function useSampleVars(studioName: string) {
  const t = useTranslations('messages.sample')
  const locale = useLocale()
  const inTenDays = new Date()
  inTenDays.setDate(inTenDays.getDate() + 10)
  return {
    first_name: t('firstName'),
    last_name: t('lastName'),
    credits: '1',
    package: t('package'),
    expires: new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(inTenDays),
    course: t('course'),
    studio: studioName,
  } satisfies Record<MessageToken, string>
}

function TemplateDialog({
  open,
  onOpenChange,
  template,
  studioName,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: Template | null
  studioName: string
}) {
  const t = useTranslations('messages')
  const tc = useTranslations('common')
  const { pending, run } = useServerAction()
  const [name, setName] = useState(template?.name ?? '')
  const [category, setCategory] = useState(template?.category ?? 'announcement')
  const [body, setBody] = useState(template?.body ?? '')
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const sample = useSampleVars(studioName)

  // Insert a placeholder where the cursor is
  const insertToken = (token: MessageToken) => {
    const el = bodyRef.current
    const text = `{${token}}`
    if (!el) return setBody((b) => b + text)
    const start = el.selectionStart ?? body.length
    const end = el.selectionEnd ?? body.length
    const next = body.slice(0, start) + text + body.slice(end)
    setBody(next)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(start + text.length, start + text.length)
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <form
          className="grid gap-6"
          onSubmit={(e) => {
            e.preventDefault()
            run(() => saveMessageTemplate({ id: template?.id, name, category, body }), {
              success: t('templates.saved'),
              onSuccess: () => onOpenChange(false),
            })
          }}
        >
          <DialogHeader>
            <DialogTitle>{template ? t('templates.edit') : t('templates.new')}</DialogTitle>
            <DialogDescription>{t('templates.dialogHint')}</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
              <Field>
                <FieldLabel htmlFor="template-name">{t('templates.name')}</FieldLabel>
                <Input id="template-name" value={name} maxLength={120} onChange={(e) => setName(e.target.value)} required />
              </Field>
              <Field>
                <FieldLabel htmlFor="template-category">{t('templates.category')}</FieldLabel>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="template-category" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MESSAGE_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {t(`categories.${c}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="template-body">{t('templates.body')}</FieldLabel>
              <Textarea
                id="template-body"
                ref={bodyRef}
                rows={6}
                maxLength={2000}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
              />
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-muted-foreground">{t('templates.insert')}</span>
                {MESSAGE_TOKENS.map((token) => (
                  <Button key={token} type="button" size="xs" variant="outline" onClick={() => insertToken(token)}>
                    {t(`tokens.${token}`)}
                  </Button>
                ))}
              </div>
            </Field>
            <Field>
              <FieldLabel>{t('templates.preview')}</FieldLabel>
              <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm whitespace-pre-line">
                {renderTemplate(body, sample) || <span className="text-muted-foreground">—</span>}
              </div>
              <FieldDescription>{t('templates.previewHint')}</FieldDescription>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {tc('cancel')}
            </Button>
            <Button type="submit" disabled={pending || !name.trim() || !body.trim()}>
              {pending && <Spinner />}
              {pending ? tc('saving') : tc('save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/** Template text with its {fields} shown as labelled chips ("First name", "Credits left"). */
function TemplateBody({ body }: { body: string }) {
  const t = useTranslations('messages.tokens')
  const parts = body.split(/(\{\w+\})/g)
  return (
    <p className="line-clamp-5 text-sm whitespace-pre-line text-muted-foreground">
      {parts.map((part, i) => {
        const token = part.slice(1, -1)
        return part.startsWith('{') && (MESSAGE_TOKENS as readonly string[]).includes(token) ? (
          <span key={i} className="rounded bg-primary/10 px-1 font-medium text-foreground">
            {t(token as MessageToken)}
          </span>
        ) : (
          part
        )
      })}
    </p>
  )
}

export function TemplatesPanel({ templates, studioName }: { templates: Template[]; studioName: string }) {
  const t = useTranslations('messages')
  const tc = useTranslations('common')
  const confirm = useConfirm()
  const remove = useServerAction()
  const [dialog, setDialog] = useState<{ template: Template | null; key: number } | null>(null)
  const open = (template: Template | null) => setDialog((d) => ({ template, key: (d?.key ?? 0) + 1 }))

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => open(null)}>
          <Plus /> {t('templates.new')}
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {templates.map((tpl) => (
          <Card key={tpl.id}>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2">
                {tpl.name}
                <Badge variant="secondary">{t(`categories.${tpl.category}`)}</Badge>
              </CardTitle>
              <CardAction className="flex gap-1">
                <Button size="icon-sm" variant="ghost" aria-label={tc('edit')} onClick={() => open(tpl)}>
                  <Pencil />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  className="text-destructive"
                  aria-label={tc('delete')}
                  disabled={remove.pending}
                  onClick={async () => {
                    if (!(await confirm({ title: t('templates.deleteConfirm', { name: tpl.name }), destructive: true }))) return
                    remove.run(() => deleteMessageTemplate(tpl.id), { success: t('templates.deleted') })
                  }}
                >
                  <Trash2 />
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              <TemplateBody body={tpl.body} />
            </CardContent>
          </Card>
        ))}
      </div>
      {dialog && (
        <TemplateDialog
          key={dialog.key}
          open
          onOpenChange={(o) => !o && setDialog(null)}
          template={dialog.template}
          studioName={studioName}
        />
      )}
    </div>
  )
}

'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { CheckCheck, ExternalLink, MessageCircle, MessageSquare, SkipForward } from 'lucide-react'
import { useRouter } from '@/i18n/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { getMessageRecipients, logMessage } from '@/lib/actions/messages.actions'
import {
  COURSE_AUDIENCES,
  MESSAGE_AUDIENCES,
  messageLink,
  renderTemplate,
  type MessageAudience,
  type MessageChannel,
} from '@/lib/messages/template'
import type { ActionData } from '@/lib/types/actions'
import type { getMessageTemplates } from '@/lib/actions/messages.actions'

type Template = ActionData<typeof getMessageTemplates>[number]
type Recipient = ActionData<typeof getMessageRecipients>[number]

const CUSTOM = 'custom'

/**
 * Pick a template (or write a message), pick who gets it, then open WhatsApp / SMS on this
 * phone for each student with the message already filled in. Every opened message is logged.
 */
export function SendPanel({
  templates,
  courses,
  labels,
  studioName,
  initialAudience,
  initialCourseId,
  initialLabelId,
  initialTemplateId,
}: {
  templates: Template[]
  courses: { id: string; name: string }[]
  labels: { id: string; name: string }[]
  studioName: string
  initialAudience: MessageAudience
  initialCourseId?: string
  initialLabelId?: string
  initialTemplateId?: string
}) {
  const t = useTranslations('messages')
  const locale = useLocale()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [templateId, setTemplateId] = useState(initialTemplateId ?? templates[0]?.id ?? CUSTOM)
  const [body, setBody] = useState(templates.find((x) => x.id === (initialTemplateId ?? templates[0]?.id))?.body ?? '')
  const [channel, setChannel] = useState<MessageChannel>('whatsapp')
  const [audience, setAudience] = useState<MessageAudience>(initialAudience)
  const [courseId, setCourseId] = useState(initialCourseId ?? '')
  const [labelId, setLabelId] = useState(initialLabelId ?? '')
  const needsCourse = COURSE_AUDIENCES.includes(audience)
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [sent, setSent] = useState<Set<string>>(new Set())
  const [loading, startLoading] = useTransition()

  useEffect(() => {
    startLoading(async () => {
      const res = await getMessageRecipients({
        audience,
        courseId: courseId || undefined,
        labelId: labelId || undefined,
      })
      setRecipients(res.data ?? [])
      setSent(new Set())
    })
  }, [audience, courseId, labelId])

  // Keep the choice in the URL so a reload or a shared link opens the same list
  const syncUrl = (patch: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    for (const [k, v] of Object.entries(patch)) {
      if (v) params.set(k, v)
      else params.delete(k)
    }
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  const dateFmt = useMemo(() => new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }), [locale])
  const render = (r: Recipient) =>
    renderTemplate(body, {
      first_name: r.firstName,
      last_name: r.lastName,
      credits: String(r.credits),
      package: r.packageName ?? '',
      expires: r.expires ? dateFmt.format(new Date(`${r.expires}T00:00:00`)) : '',
      course: needsCourse ? (courses.find((c) => c.id === courseId)?.name ?? '') : '',
      studio: studioName,
    })

  const sendable = recipients.filter((r) => r.phone && !r.optOut)
  const nextUp = sendable.find((r) => !sent.has(r.id))

  const markSent = (r: Recipient, text: string) => {
    setSent((prev) => new Set(prev).add(r.id))
    void logMessage({ studentId: r.id, templateId: templateId === CUSTOM ? null : templateId, channel, body: text })
  }

  const openNext = () => {
    if (!nextUp?.phone) return
    const text = render(nextUp)
    window.open(messageLink(channel, nextUp.phone, text), '_blank', 'noopener')
    markSent(nextUp, text)
  }

  const ChannelIcon = channel === 'whatsapp' ? MessageCircle : MessageSquare

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr] lg:items-start">
      <Card>
        <CardHeader>
          <CardTitle>{t('send.compose')}</CardTitle>
          <CardDescription>{t('send.composeHint')}</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="message-template">{t('send.template')}</FieldLabel>
              <Select
                value={templateId}
                onValueChange={(v) => {
                  setTemplateId(v)
                  if (v !== CUSTOM) setBody(templates.find((x) => x.id === v)?.body ?? '')
                  syncUrl({ template: v === CUSTOM ? null : v })
                }}
              >
                <SelectTrigger id="message-template" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((x) => (
                    <SelectItem key={x.id} value={x.id}>
                      {x.name}
                    </SelectItem>
                  ))}
                  <SelectItem value={CUSTOM}>{t('send.custom')}</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="message-body">{t('send.message')}</FieldLabel>
              <Textarea
                id="message-body"
                rows={7}
                maxLength={2000}
                value={body}
                onChange={(e) => {
                  setBody(e.target.value)
                  if (templateId !== CUSTOM) setTemplateId(CUSTOM)
                }}
              />
              <FieldDescription>{t('send.messageHint')}</FieldDescription>
            </Field>
            <Field>
              <FieldLabel>{t('send.channel')}</FieldLabel>
              <ToggleGroup
                type="single"
                variant="outline"
                value={channel}
                onValueChange={(v) => v && setChannel(v as MessageChannel)}
                className="w-full"
              >
                <ToggleGroupItem value="whatsapp" className="flex-1">
                  <MessageCircle /> WhatsApp
                </ToggleGroupItem>
                <ToggleGroupItem value="sms" className="flex-1">
                  <MessageSquare /> SMS
                </ToggleGroupItem>
              </ToggleGroup>
            </Field>
            <Field>
              <FieldLabel htmlFor="message-audience">{t('send.audience')}</FieldLabel>
              <Select
                value={audience}
                onValueChange={(v) => {
                  setAudience(v as MessageAudience)
                  const a = v as MessageAudience
                  syncUrl({
                    audience: a === 'all' ? null : a,
                    course: COURSE_AUDIENCES.includes(a) ? courseId || null : null,
                    label: a === 'label' ? labelId || null : null,
                  })
                }}
              >
                <SelectTrigger id="message-audience" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MESSAGE_AUDIENCES.map((a) => (
                    <SelectItem key={a} value={a}>
                      {t(`audiences.${a}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            {audience === 'label' && (
              <Field>
                <FieldLabel htmlFor="message-label">{t('send.label')}</FieldLabel>
                <Select
                  value={labelId}
                  onValueChange={(v) => {
                    setLabelId(v)
                    syncUrl({ label: v })
                  }}
                >
                  <SelectTrigger id="message-label" className="w-full">
                    <SelectValue placeholder={t('send.selectLabel')} />
                  </SelectTrigger>
                  <SelectContent>
                    {labels.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {labels.length === 0 && <FieldDescription>{t('send.noLabels')}</FieldDescription>}
              </Field>
            )}
            {needsCourse && (
              <Field>
                <FieldLabel htmlFor="message-course">{t('send.course')}</FieldLabel>
                <Select
                  value={courseId}
                  onValueChange={(v) => {
                    setCourseId(v)
                    syncUrl({ course: v })
                  }}
                >
                  <SelectTrigger id="message-course" className="w-full">
                    <SelectValue placeholder={t('send.selectCourse')} />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>{t('send.recipients')}</CardTitle>
            <CardDescription>
              {t('send.recipientsSummary', { total: sendable.length, sent: sent.size })}
            </CardDescription>
          </div>
          <Button onClick={openNext} disabled={!nextUp || !body.trim()}>
            {nextUp ? <SkipForward /> : <CheckCheck />}
            {nextUp ? t('send.openNext', { name: nextUp.firstName }) : t('send.allDone')}
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : recipients.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {needsCourse && !courseId
                ? t('send.pickCourse')
                : audience === 'label' && !labelId
                  ? t('send.pickLabel')
                  : audience === 'course_invite'
                    ? t('send.noInviteRecipients')
                    : audience === 'birthday'
                      ? t('send.noBirthdays')
                      : t('send.noRecipients')}
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {recipients.map((r) => {
                const text = render(r)
                const disabledReason = r.optOut ? t('send.optedOut') : !r.phone ? t('send.noPhone') : null
                const isSent = sent.has(r.id)
                return (
                  <li key={r.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">
                          {r.firstName} {r.lastName}
                        </span>
                        <Badge variant="secondary">{t('send.credits', { count: r.credits })}</Badge>
                        {r.expiringSoon && r.expires && (
                          <Badge variant="outline">
                            {t('send.expires', { date: dateFmt.format(new Date(`${r.expires}T00:00:00`)) })}
                          </Badge>
                        )}
                        {isSent && (
                          <Badge variant="outline" className="text-success">
                            <CheckCheck /> {t('send.sent')}
                          </Badge>
                        )}
                      </div>
                      <p className="line-clamp-2 text-sm whitespace-pre-line text-muted-foreground">{text}</p>
                    </div>
                    {disabledReason ? (
                      <span className="shrink-0 text-xs text-muted-foreground">{disabledReason}</span>
                    ) : (
                      <Button
                        asChild
                        size="sm"
                        variant={isSent ? 'outline' : 'default'}
                        className="shrink-0"
                        aria-disabled={!body.trim()}
                      >
                        <a
                          href={messageLink(channel, r.phone!, text)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => {
                            if (!body.trim()) {
                              e.preventDefault()
                              return
                            }
                            markSent(r, text)
                          }}
                        >
                          <ChannelIcon /> {isSent ? t('send.openAgain') : t('send.open')}
                          <ExternalLink className="opacity-60" />
                        </a>
                      </Button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
          <p className="mt-4 text-xs text-muted-foreground">{t('send.consentNote')}</p>
        </CardContent>
      </Card>
    </div>
  )
}

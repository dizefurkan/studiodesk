import { getTranslations } from 'next-intl/server'
import { Lock } from 'lucide-react'
import { getMessageLogs, getMessageSetup, getMessageTemplates } from '@/lib/actions/messages.actions'
import { getMemberAccess } from '@/lib/auth/memberAccess'
import { Card } from '@/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { PageHeader } from '@/components/common/PageHeader'
import { MessagesTabs } from '@/components/messages/MessagesTabs'
import { SendPanel } from '@/components/messages/SendPanel'
import { TemplatesPanel } from '@/components/messages/TemplatesPanel'
import { HistoryPanel } from '@/components/messages/HistoryPanel'
import { MESSAGE_AUDIENCES, MESSAGE_TABS, type MessageAudience, type MessageTab } from '@/lib/messages/template'

const HISTORY_PAGE_SIZE = 20

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const t = await getTranslations('messages')
  const params = await searchParams
  const str = (k: string) => (typeof params[k] === 'string' ? (params[k] as string) : undefined)

  const access = await getMemberAccess()
  if (!access?.canMessage) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('title')} description={t('description')} />
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Lock />
            </EmptyMedia>
            <EmptyTitle>{t('noAccess.title')}</EmptyTitle>
            <EmptyDescription>{t('noAccess.description')}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    )
  }

  const tab: MessageTab = (MESSAGE_TABS as readonly string[]).includes(str('tab') ?? '') ? (str('tab') as MessageTab) : 'send'
  const audience: MessageAudience = (MESSAGE_AUDIENCES as readonly string[]).includes(str('audience') ?? '')
    ? (str('audience') as MessageAudience)
    : 'all'
  const page = Math.max(1, parseInt(str('page') ?? '1', 10) || 1)

  const [templatesResult, setupResult, logsResult] = await Promise.all([
    getMessageTemplates(),
    getMessageSetup(),
    tab === 'history' ? getMessageLogs(page, HISTORY_PAGE_SIZE) : Promise.resolve({ data: [], totalCount: 0 }),
  ])
  const templates = templatesResult.data ?? []
  const setup = setupResult.data

  // ?category=payment_reminder preselects the first template of that kind (dashboard shortcut)
  const category = str('category')
  const initialTemplateId =
    templates.find((x) => x.id === str('template'))?.id ?? templates.find((x) => x.category === category)?.id

  if (!setup) {
    return <Card className="p-6 text-sm text-danger">{setupResult.error ?? templatesResult.error}</Card>
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('description')} />
      <MessagesTabs
        tab={tab}
        send={
          <SendPanel
            key={`${initialTemplateId ?? ''}-${audience}-${str('course') ?? ''}-${str('label') ?? ''}`}
            templates={templates}
            courses={setup.courses}
            labels={setup.labels}
            studioName={setup.studioName}
            initialAudience={audience}
            initialCourseId={str('course')}
            initialLabelId={str('label')}
            initialTemplateId={initialTemplateId}
          />
        }
        templates={<TemplatesPanel templates={templates} studioName={setup.studioName} />}
        history={
          <HistoryPanel
            logs={logsResult.data ?? []}
            totalCount={logsResult.totalCount ?? 0}
            page={page}
            pageSize={HISTORY_PAGE_SIZE}
          />
        }
      />
    </div>
  )
}

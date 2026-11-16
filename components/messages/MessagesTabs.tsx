'use client'

import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { useRouter } from '@/i18n/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MESSAGE_TABS, type MessageTab } from '@/lib/messages/template'


/** Send / Templates / History, with the tab kept in the URL. */
export function MessagesTabs({
  tab,
  send,
  templates,
  history,
}: {
  tab: MessageTab
  send: React.ReactNode
  templates: React.ReactNode
  history: React.ReactNode
}) {
  const t = useTranslations('messages.tabs')
  const router = useRouter()
  const searchParams = useSearchParams()

  return (
    <Tabs
      value={tab}
      onValueChange={(v) => {
        const params = new URLSearchParams(searchParams.toString())
        params.delete('page')
        if (v === 'send') params.delete('tab')
        else params.set('tab', v)
        router.push(`?${params.toString()}`, { scroll: false })
      }}
    >
      <TabsList variant="line" className="w-full justify-start border-b border-border [&>button]:flex-none [&>button]:px-3">
        {MESSAGE_TABS.map((v) => (
          <TabsTrigger key={v} value={v}>
            {t(v)}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value="send" className="pt-4">
        {send}
      </TabsContent>
      <TabsContent value="templates" className="pt-4">
        {templates}
      </TabsContent>
      <TabsContent value="history" className="pt-4">
        {history}
      </TabsContent>
    </Tabs>
  )
}

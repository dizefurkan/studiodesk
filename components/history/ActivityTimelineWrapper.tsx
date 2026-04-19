'use client'

import { useState } from 'react'
import { HistoryComponent } from './HistoryComponent'
import { getEntityHistory } from '@/lib/actions/history.actions'

interface ActivityTimelineWrapperProps {
  entity: string
  entityId: string
  initialLogs: any[]
  title?: string
  description?: string
  maxItems?: number
  showFullPage?: boolean
}

export function ActivityTimelineWrapper({
  entity,
  entityId,
  initialLogs,
  title,
  description,
  maxItems,
  showFullPage,
}: ActivityTimelineWrapperProps) {
  const [logs, setLogs] = useState(initialLogs)

  const handleRefresh = async () => {
    const freshLogs = await getEntityHistory(entity, entityId, maxItems || 20)
    setLogs(freshLogs)
  }

  return (
    <HistoryComponent
      logs={logs}
      title={title}
      description={description}
      maxItems={maxItems}
      showFullPage={showFullPage}
      onRefresh={handleRefresh}
    />
  )
}

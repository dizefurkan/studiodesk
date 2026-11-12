import { getBranch } from '@/lib/actions/branches.actions'
import { getEntityHistory } from '@/lib/actions/history.actions'
import { notFound } from 'next/navigation'
import { BranchForm } from '@/components/branches/BranchForm'
import { ActivityTimelineWrapper } from '@/components/history/ActivityTimelineWrapper'

interface EditBranchPageProps {
  params: {
    id: string
  }
}

export default async function EditBranchPage({ params }: EditBranchPageProps) {
  const { id } = await params
  const result = await getBranch(id)

  if (result.error) {
    notFound()
  }

  const branch = result.data

  // Get entity activity history
  const entityHistory = await getEntityHistory('branch', id, 20) || []

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/50 to-white p-8">
      <BranchForm branch={branch} />
      
      {/* Activity Timeline */}
      <div className="mt-12 pt-8 border-t border-border">
        <ActivityTimelineWrapper
          entity="branch"
          entityId={id}
          initialLogs={entityHistory}
          title="Activity Timeline"
          description="All changes and actions related to this branch"
          showFullPage={false}
        />
      </div>
    </div>
  )
}

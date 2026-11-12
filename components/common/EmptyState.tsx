'use client'

import dynamic from 'next/dynamic'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { cn } from '@/lib/utils'

// lottie-web touches `document` on import, so it only loads in the browser.
const DancerAnimation = dynamic(() => import('./DancerAnimation'), {
  ssr: false,
  loading: () => <div className="size-28" />,
})

interface EmptyStateProps {
  title: string
  description?: string
  /** The single call to action. Pages hide their header "create" button while this is shown. */
  action?: React.ReactNode
  className?: string
}

/** First-run empty state for list pages: shadcn Empty + brand Lottie animation + one CTA. */
export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <Empty className={cn('border bg-card py-12', className)}>
      <EmptyHeader>
        <EmptyMedia>
          <DancerAnimation className="size-28" />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        {description && <EmptyDescription>{description}</EmptyDescription>}
      </EmptyHeader>
      {action && <EmptyContent>{action}</EmptyContent>}
    </Empty>
  )
}

'use client'

import { useTranslations } from 'next-intl'
import { BookOpen, Zap } from 'lucide-react'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface StudentPopoverProps {
  type: 'courses' | 'credits'
  courses?: Array<{ id: string; name: string }>
  credits?: number
  packageDetails?: Array<{
    id: string
    name: string
    danceType: string
    danceTypeId: string
    remaining: number
  }>
  filteredDanceTypeId?: string
}

const triggerClass = '-ml-2 font-normal'

export function StudentPopover({
  type,
  courses,
  credits,
  packageDetails,
  filteredDanceTypeId,
}: StudentPopoverProps) {
  const t = useTranslations('students')

  if (type === 'courses') {
    const count = courses?.length ?? 0
    const summary = (
      <>
        <BookOpen className="size-3.5 text-muted-foreground" />
        <span className="font-semibold text-foreground">{count}</span>
      </>
    )
    if (count === 0) return <span className="inline-flex items-center gap-1">{summary}</span>

    return (
      <HoverCard openDelay={100} closeDelay={100}>
        <HoverCardTrigger asChild>
          <Button variant="ghost" size="xs" className={triggerClass}>
            {summary}
          </Button>
        </HoverCardTrigger>
        <HoverCardContent className="w-56">
          <h4 className="mb-2 text-sm font-semibold">{t('enrolledCoursesTitle')}</h4>
          <ul className="space-y-1 text-xs text-muted-foreground">
            {courses!.map((course) => (
              <li key={course.id}>{course.name}</li>
            ))}
          </ul>
        </HoverCardContent>
      </HoverCard>
    )
  }

  const total = credits ?? 0
  const filtered = filteredDanceTypeId
    ? packageDetails?.find((p) => p.danceTypeId === filteredDanceTypeId)
    : undefined
  const others = (packageDetails ?? []).filter(
    (pkg) => !filteredDanceTypeId || pkg.danceTypeId !== filteredDanceTypeId
  )

  const details = (
    <HoverCardContent className="w-60">
      <h4 className="mb-2 text-sm font-semibold">
        {filteredDanceTypeId ? t('otherCredits') : t('creditsByDanceType')}
      </h4>
      {others.length > 0 ? (
        <div className="space-y-1.5">
          {others.map((pkg) => (
            <div key={pkg.id} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{pkg.danceType}</span>
              <span className={cn('font-semibold', pkg.remaining === 0 && 'text-destructive')}>
                {pkg.remaining}{' '}
                <span className="text-xs font-normal text-muted-foreground">
                  {t('creditUnit', { count: pkg.remaining })}
                </span>
              </span>
            </div>
          ))}
          {!filteredDanceTypeId && (
            <div className="mt-2 border-t pt-2 text-sm font-semibold">
              {t('totalCredits', { count: total })}
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm font-medium text-destructive">{t('noCredits')}</p>
      )}
    </HoverCardContent>
  )

  if (filteredDanceTypeId && packageDetails) {
    return (
      <div className="flex items-start gap-2">
        <div className="flex items-center gap-1">
          <Zap className="size-3.5 text-highlight" />
          <span className="font-semibold text-foreground">{filtered?.remaining ?? 0}</span>
          <span className="text-xs text-muted-foreground">{filtered?.danceType}</span>
        </div>
        {packageDetails.length > 1 && (
          <HoverCard openDelay={100} closeDelay={100}>
            <HoverCardTrigger asChild>
              <Button variant="ghost" size="xs" className="font-semibold text-primary">
                +{packageDetails.length - 1}
              </Button>
            </HoverCardTrigger>
            {details}
          </HoverCard>
        )}
      </div>
    )
  }

  return (
    <HoverCard openDelay={100} closeDelay={100}>
      <HoverCardTrigger asChild>
        <Button
          variant="ghost"
          size="xs"
          className={cn(triggerClass, total === 0 ? 'text-destructive' : 'text-foreground')}
        >
          <Zap className={cn('size-3.5', total === 0 ? 'text-destructive' : 'text-highlight')} />
          <span className="font-semibold">{total}</span>
        </Button>
      </HoverCardTrigger>
      {details}
    </HoverCard>
  )
}

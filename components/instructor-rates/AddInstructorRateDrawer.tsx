'use client'

import { useTranslations } from 'next-intl'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { InstructorRateForm } from './InstructorRateForm'
import type { InstructorRate } from './types'

interface AddInstructorRateDrawerProps {
  instructors: Array<{ id: string; first_name: string; last_name: string }>
  branches: Array<{ id: string; name: string }>
  danceTypes: Array<{ id: string; name: string }>
  rates: InstructorRate[]
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  /** Set: add a new pay period to this rate */
  initialRate?: InstructorRate
  selectedInstructorId?: string
  onSuccess?: () => void
}

export function AddInstructorRateDrawer({
  instructors,
  branches,
  danceTypes,
  rates,
  isOpen,
  onOpenChange,
  initialRate,
  selectedInstructorId,
  onSuccess,
}: AddInstructorRateDrawerProps) {
  const tx = useTranslations('instructorRateDrawer')

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{initialRate ? tx('newPeriodTitle') : tx('addTitle')}</SheetTitle>
          <SheetDescription>{initialRate ? tx('newPeriodDescription') : tx('description')}</SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-4">
          <InstructorRateForm
            instructors={instructors}
            branches={branches}
            danceTypes={danceTypes}
            rates={rates}
            rate={initialRate}
            selectedInstructorId={selectedInstructorId}
            onSuccess={() => {
              onOpenChange(false)
              onSuccess?.()
            }}
            onCancel={() => onOpenChange(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}

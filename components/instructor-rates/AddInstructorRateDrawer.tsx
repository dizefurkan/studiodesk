'use client'

import { useRouter } from '@/i18n/navigation'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { InstructorRateForm } from './InstructorRateForm'
import { useTranslations } from 'next-intl'

interface Instructor {
  id: string
  first_name: string
  last_name: string
}

interface Branch {
  id: string
  name: string
}

interface DanceType {
  id: string
  name: string
}

interface InstructorRate {
  id: string
  ratio_per_class: number
  instructors: Instructor
  branches: Branch
  dance_types: DanceType
}

interface AddInstructorRateDrawerProps {
  instructors: Instructor[]
  branches: Branch[]
  danceTypes: DanceType[]
  rates: InstructorRate[]
  isOpen: boolean
  onOpenChange: (open: boolean) => void
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
  const router = useRouter()

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{initialRate ? tx('editTitle') : tx('addTitle')}</SheetTitle>
          <SheetDescription className="sr-only">{tx('description')}</SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-4">
          <InstructorRateForm
            instructors={instructors}
            branches={branches}
            danceTypes={danceTypes}
            rates={rates}
            initialRate={initialRate}
            selectedInstructorId={selectedInstructorId}
            onSuccess={() => {
              onOpenChange(false)
              onSuccess?.()
            }}
            onCancel={() => {
              onOpenChange(false)
              router.push('/dashboard/instructor-rates')
            }}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}

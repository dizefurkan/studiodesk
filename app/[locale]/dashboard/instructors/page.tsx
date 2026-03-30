import { getInstructors, getInstructorFilterOptions } from '@/lib/actions/instructors.actions'
import { getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { InstructorTableWrapper } from '@/components/instructors/InstructorTableWrapper'
import Link from 'next/link'
import { Plus, UserCheck } from 'lucide-react'
import type { Database } from '@/lib/types/database.types'

type Instructor = Database['public']['Tables']['instructors']['Row']

export default async function InstructorsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const t = await getTranslations()
  const params = await searchParams
  const searchQuery = typeof params.q === 'string' ? params.q : undefined
  const danceTypeId = typeof params.danceType === 'string' ? params.danceType : undefined
  const branchId = typeof params.branch === 'string' ? params.branch : undefined

  const result = await getInstructors(searchQuery, { danceTypeId, branchId })

  // Handle auth errors specifically
  if (result.error === 'Not authenticated') {
    console.warn('[InstructorsPage] Not authenticated, redirecting to login')
    redirect('/login')
  }

  if (result.error) {
    console.error('[InstructorsPage] Error fetching instructors:', result.error)
  }

  const instructors = result.data || []

  const filterOptions = await getInstructorFilterOptions()
  const danceTypes = (filterOptions as any).danceTypes || []
  const branches = (filterOptions as any).branches || []

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#111827]">{t('instructors.title')}</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">{t('instructors.description')}</p>
        </div>
        <Link className="inline-block w-max" href="/dashboard/instructors/new">
          <Button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white text-sm md:text-base h-9 md:h-10">
            <Plus size={20} className="mr-2" />
            {t('instructors.addNew')}
          </Button>
        </Link>
      </div>

      {/* Content */}
      {instructors.length === 0 ? (
        <Card className="border-[#E5E7EB]">
          <div className="p-6 sm:p-8 md:p-12 text-center">
            <UserCheck className="mx-auto text-[#9CA3AF] mb-4" size={48} />
            <h3 className="text-lg font-semibold text-[#111827] mb-1">{t('instructors.noInstructors')}</h3>
            <p className="text-gray-600 mb-6">{t('instructors.getStarted')}</p>
            <Link href="/dashboard/instructors/new">
              <Button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white">
                <Plus size={20} className="mr-2" />
                {t('instructors.addNew')}
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <Card className="border-[#E5E7EB] p-3 sm:p-4 md:p-6">
          <InstructorTableWrapper
            instructors={instructors}
            danceTypes={danceTypes}
            branches={branches}
            searchQuery={searchQuery}
            danceTypeId={danceTypeId}
            branchId={branchId}
          />
        </Card>
      )}
    </div>
  )
}

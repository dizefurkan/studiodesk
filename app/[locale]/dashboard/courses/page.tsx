import { getCourses } from '@/lib/actions/courses.actions'
import { getBranches } from '@/lib/actions/branches.actions'
import { getDanceTypes } from '@/lib/actions/dance-types.actions'
import { getTranslations } from 'next-intl/server'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CoursesPageClient } from './courses-client'
import Link from 'next/link'
import { Plus, Clock } from 'lucide-react'

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const t = await getTranslations()
  const params = await searchParams
  const branchId = typeof params.branch === 'string' ? params.branch : undefined
  const searchQuery = typeof params.q === 'string' ? params.q : undefined
  const danceTypeId = typeof params.danceType === 'string' ? params.danceType : undefined

  const [coursesResult, branchesResult, danceTypesResult] = await Promise.all([
    getCourses(branchId, searchQuery, danceTypeId),
    getBranches(),
    getDanceTypes(),
  ])

  const courses = coursesResult.data || []
  const branches = branchesResult.data || []
  const danceTypes = danceTypesResult.data || []

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#111827]">{t('courses.title')}</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">{t('courses.description')}</p>
        </div>
        <Link href="/dashboard/courses/new" className="inline-block w-fit">
          <Button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white gap-2 text-sm md:text-base h-9 md:h-10">
            <Plus size={20} />
            {t('courses.addNew')}
          </Button>
        </Link>
      </div>

      {/* Content */}
      {courses.length === 0 ? (
        <Card className="border-[#E5E7EB] p-6 sm:p-8 md:p-12 text-center">
          <div className="text-gray-500">
            <Clock size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg">{t('courses.noCourses')}</p>
            <p className="text-sm mt-1">{t('courses.createFirstCourse')}</p>
          </div>
        </Card>
      ) : (
        <Card className="border-[#E5E7EB] p-3 sm:p-4 md:p-6">
          <CoursesPageClient
            courses={courses}
            branches={branches}
            danceTypes={danceTypes}
            searchQuery={searchQuery}
            branchId={branchId}
            danceTypeId={danceTypeId}
          />
        </Card>
      )}
    </div>
  )
}

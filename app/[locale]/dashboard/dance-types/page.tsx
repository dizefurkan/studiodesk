import { getDanceTypes } from '@/lib/actions/dance-types.actions'
import { getTranslations } from 'next-intl/server'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DanceTypesPageClient } from './dance-types-client'
import Link from 'next/link'
import { Plus, Music2 } from 'lucide-react'

const PAGE_SIZE = 10

export default async function DanceTypesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const t = await getTranslations()
  const params = await searchParams
  const searchQuery = typeof params.q === 'string' ? params.q : undefined
  const pageParam = typeof params.page === 'string' ? parseInt(params.page, 10) : 1
  const page = Math.max(1, pageParam)

  const result = await getDanceTypes(searchQuery, page, PAGE_SIZE)
  const danceTypes = result.data || []
  const totalCount = result.totalCount || 0
  const totalPages = result.totalPages || 1

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#111827]">{t('danceTypes.title')}</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">{t('danceTypes.description')}</p>
        </div>
        <Link href="/dashboard/dance-types/new" className="inline-block w-fit">
          <Button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white gap-2 text-sm md:text-base h-9 md:h-10">
            <Plus size={20} />
            {t('danceTypes.addNew')}
          </Button>
        </Link>
      </div>

      {/* Content */}
      {danceTypes.length === 0 ? (
        <Card className="border-[#E5E7EB] p-6 sm:p-8 md:p-12 text-center">
          <div className="text-gray-500">
            <Music2 size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg">{t('danceTypes.noDanceTypes')}</p>
            <p className="text-sm mt-1">{t('danceTypes.getStarted')}</p>
          </div>
        </Card>
      ) : (
        <Card className="border-[#E5E7EB] p-3 sm:p-4 md:p-6">
          <DanceTypesPageClient
            danceTypes={danceTypes}
            searchQuery={searchQuery}
            currentPage={page}
            totalCount={totalCount}
            pageSize={PAGE_SIZE}
          />
        </Card>
      )}
    </div>
  )
}

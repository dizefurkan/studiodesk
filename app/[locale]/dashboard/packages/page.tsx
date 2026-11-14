import { getOrganization } from '@/lib/auth/getOrganization'
import { PackagesPageContent } from './packages-client'
import { getPackages } from '@/lib/actions/packages.actions'

const PAGE_SIZE = 10

export default async function PackagesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const organization = await getOrganization()
  const currency = organization?.currency || 'TRY'
  const params = await searchParams
  const searchQuery = typeof params.q === 'string' ? params.q : undefined
  const pageParam = typeof params.page === 'string' ? parseInt(params.page, 10) : 1
  const page = Math.max(1, pageParam)

  const result = await getPackages(searchQuery, page, PAGE_SIZE)
  const packages = result.data || []
  const totalCount = result.totalCount || 0

  return (
    <PackagesPageContent
      currency={currency}
      packages={packages}
      searchQuery={searchQuery}
      currentPage={page}
      totalCount={totalCount}
      pageSize={PAGE_SIZE}
    />
  )
}

import { getBranches } from '@/lib/actions/branches.actions'
import { getTranslations } from 'next-intl/server'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { MapPin, Plus } from 'lucide-react'
import type { Database } from '@/lib/types/database.types'
import { BranchesPageClient } from './branches-client'

type Branch = Database['public']['Tables']['branches']['Row']

export default async function BranchesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const t = await getTranslations()
  const params = await searchParams
  const searchQuery = typeof params.q === 'string' ? params.q : undefined

  const result = await getBranches(searchQuery)
  console.log('[BranchesPage] Result from getBranches:', result)
  console.log('[BranchesPage] Result.error:', result.error)
  console.log('[BranchesPage] Result.data:', result.data)
  const branches = result.data || []
  console.log('[BranchesPage] Branches to render:', branches)
  console.log('[BranchesPage] Branches length:', branches.length)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#111827]">Branches</h1>
          <p className="text-gray-600 mt-1">Manage your dance studio branches</p>
        </div>
        <Link href="/dashboard/branches/new">
          <Button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white">
            <Plus size={20} className="mr-2" />
            Add Branch
          </Button>
        </Link>
      </div>

      {/* Content */}
      {branches.length === 0 ? (
        <Card className="border-[#E5E7EB]">
          <div className="p-12 text-center">
            <MapPin className="mx-auto text-[#9CA3AF] mb-4" size={48} />
            <h3 className="text-lg font-semibold text-[#111827] mb-1">No branches yet</h3>
            <p className="text-gray-600 mb-6">Get started by adding your first branch</p>
            <Link href="/dashboard/branches/new">
              <Button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white">
                <Plus size={20} className="mr-2" />
                Add First Branch
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <BranchesPageClient branches={branches} />
      )}
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Edit2, Trash2, Search, Package as PackageIcon } from 'lucide-react'
import { getPackages, deletePackage } from '@/lib/actions/packages.actions'
import { formatCurrency } from '@/lib/utils/format'
import type { Database } from '@/lib/types/database.types'

type Package = Database['public']['Tables']['packages']['Row']

interface PackagesPageContentProps {
  currency: string
}

export function PackagesPageContent({ currency }: PackagesPageContentProps) {
  const t = useTranslations()
  const [packages, setPackages] = useState<Package[]>([])
  const [filteredPackages, setFilteredPackages] = useState<Package[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    loadPackages()
  }, [])

  async function loadPackages() {
    setIsLoading(true)
    setError(null)
    const result = await getPackages()

    if (result.error) {
      setError(result.error)
    } else if (result.data) {
      setPackages(result.data)
      setFilteredPackages(result.data)
    }

    setIsLoading(false)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (!query.trim()) {
      setFilteredPackages(packages)
    } else {
      const query_lower = query.toLowerCase()
      const filtered = packages.filter((pkg) => pkg.name?.toLowerCase().includes(query_lower))
      setFilteredPackages(filtered)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this package?')) return

    setDeletingId(id)
    const result = await deletePackage(id)

    if (result.error) {
      setError(result.error)
    } else {
      setPackages(packages.filter((p) => p.id !== id))
      setFilteredPackages(filteredPackages.filter((p) => p.id !== id))
    }

    setDeletingId(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#111827]">{t('packages.title')}</h1>
          <p className="text-gray-600 mt-1">{t('packages.description')}</p>
        </div>
        <Link href="/dashboard/packages/new">
          <Button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white">
            <Plus size={20} className="mr-2" />
            {t('packages.addNew')}
          </Button>
        </Link>
      </div>

      {/* Search */}
      <Card className="border-[#E5E7EB]">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-[#9CA3AF]" size={18} />
            <Input
              type="search"
              placeholder="Search packages..."
              className="pl-10 bg-[#F9FAFB] border-[#E5E7EB]"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* List */}
      {isLoading ? (
        <Card className="border-[#E5E7EB]">
          <CardContent className="pt-6">
            <p className="text-gray-500">Loading...</p>
          </CardContent>
        </Card>
      ) : filteredPackages.length === 0 ? (
        <Card className="border-[#E5E7EB]">
          <CardContent className="pt-12 text-center">
            <PackageIcon className="mx-auto text-[#9CA3AF] mb-4" size={48} />
            <h3 className="text-lg font-semibold text-[#111827] mb-1">No packages yet</h3>
            <p className="text-gray-600 mb-6">Create your first package to get started</p>
            <Link href="/dashboard/packages/new">
              <Button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white">
                <Plus size={20} className="mr-2" />
                Create Package
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {filteredPackages.map((pkg) => (
            <Card key={pkg.id} className="border-[#E5E7EB] hover:shadow-lg transition-all hover:border-[#4F46E5]">
              <div className="p-4">
                {/* Title */}
                <h3 className="text-base font-bold text-[#111827] mb-2">{pkg.name}</h3>
                
                {/* Info */}
                <div className="text-xs text-gray-600 mb-4 space-y-1">
                  <p>
                    <span className="font-medium">Credits:</span> {pkg.total_credits}
                  </p>
                  <p>
                    <span className="font-medium">Price:</span> {formatCurrency(pkg.price || 0, currency)}
                  </p>
                </div>
                
                {/* Divider */}
                <div className="border-t border-[#E5E7EB] mb-3"></div>
                
                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Link href={`/dashboard/packages/${pkg.id}/edit`} className="flex-1">
                    <Button
                      size="sm"
                      className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs h-8"
                    >
                      <Edit2 size={14} className="mr-1" />
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:bg-red-50 hover:text-red-700 h-8"
                    onClick={() => handleDelete(pkg.id)}
                    disabled={deletingId === pkg.id}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

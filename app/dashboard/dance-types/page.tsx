'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Edit2, Trash2, Search, Music2 } from 'lucide-react'
import { getDanceTypes, deleteDanceType } from '@/lib/actions/dance-types.actions'
import type { Database } from '@/lib/types/database.types'

type DanceType = Database['public']['Tables']['dance_types']['Row']

export default function DanceTypesPage() {
  const router = useRouter()
  const [danceTypes, setDanceTypes] = useState<DanceType[]>([])
  const [filteredDanceTypes, setFilteredDanceTypes] = useState<DanceType[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    loadDanceTypes()
  }, [])

  async function loadDanceTypes() {
    setIsLoading(true)
    setError(null)
    const result = await getDanceTypes()

    if (result.error) {
      setError(result.error)
    } else if (result.data) {
      setDanceTypes(result.data)
      setFilteredDanceTypes(result.data)
    }

    setIsLoading(false)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (!query.trim()) {
      setFilteredDanceTypes(danceTypes)
    } else {
      const query_lower = query.toLowerCase()
      const filtered = danceTypes.filter((dt) =>
        dt.name?.toLowerCase().includes(query_lower)
      )
      setFilteredDanceTypes(filtered)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this dance type?')) return

    setDeletingId(id)
    const result = await deleteDanceType(id)

    if (result.error) {
      setError(result.error)
    } else {
      setDanceTypes(danceTypes.filter((dt) => dt.id !== id))
      setFilteredDanceTypes(filteredDanceTypes.filter((dt) => dt.id !== id))
    }

    setDeletingId(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#111827]">Dance Types</h1>
          <p className="text-gray-600 mt-1">Manage dance styles</p>
        </div>
        <Link href="/dashboard/dance-types/new">
          <Button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white">
            <Plus size={20} className="mr-2" />
            Add Dance Type
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
              placeholder="Search dance types..."
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
      ) : filteredDanceTypes.length === 0 ? (
        <Card className="border-[#E5E7EB]">
          <CardContent className="pt-12 text-center">
            <Music2 className="mx-auto text-[#9CA3AF] mb-4" size={48} />
            <h3 className="text-lg font-semibold text-[#111827] mb-1">No dance types yet</h3>
            <p className="text-gray-600 mb-6">Get started by adding your first dance type</p>
            <Link href="/dashboard/dance-types/new">
              <Button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white">
                <Plus size={20} className="mr-2" />
                Add First Dance Type
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDanceTypes.map((danceType) => (
            <Card key={danceType.id} className="border-[#E5E7EB] hover:shadow-lg transition-shadow">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-[#111827] mb-2">{danceType.name}</h3>
                {danceType.description && (
                  <p className="text-gray-600 text-sm mb-4">{danceType.description}</p>
                )}
                <div className="flex gap-2">
                  <Link href={`/dashboard/dance-types/${danceType.id}/edit`} className="flex-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-[#4F46E5] hover:bg-[#EEF2FF]"
                    >
                     <Edit2 size={16} />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => handleDelete(danceType.id)}
                    disabled={deletingId === danceType.id}
                  >
                    <Trash2 size={16} />
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

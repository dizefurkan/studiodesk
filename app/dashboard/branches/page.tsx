'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Edit2, Trash2, Search, MapPin } from 'lucide-react'
import { getBranches, deleteBranch } from '@/lib/actions/branches.actions'
import type { Database } from '@/lib/types/database.types'

type Branch = Database['public']['Tables']['branches']['Row']

export default function BranchesPage() {
  const router = useRouter()
  const [branches, setBranches] = useState<Branch[]>([])
  const [filteredBranches, setFilteredBranches] = useState<Branch[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    loadBranches()
  }, [])

  async function loadBranches() {
    setIsLoading(true)
    setError(null)
    const result = await getBranches()

    if (result.error) {
      setError(result.error)
    } else if (result.data) {
      setBranches(result.data)
      setFilteredBranches(result.data)
    }

    setIsLoading(false)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (!query.trim()) {
      setFilteredBranches(branches)
    } else {
      const query_lower = query.toLowerCase()
      const filtered = branches.filter(
        (branch) =>
          branch.name?.toLowerCase().includes(query_lower) ||
          branch.address?.toLowerCase().includes(query_lower)
      )
      setFilteredBranches(filtered)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this branch?')) return

    setDeletingId(id)
    const result = await deleteBranch(id)

    if (result.error) {
      setError(result.error)
    } else {
      setBranches(branches.filter((b) => b.id !== id))
      setFilteredBranches(filteredBranches.filter((b) => b.id !== id))
    }

    setDeletingId(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#111827]">Branches</h1>
          <p className="text-gray-600 mt-1">Manage your studio locations</p>
        </div>
        <Link href="/dashboard/branches/new">
          <Button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white">
            <Plus size={20} className="mr-2" />
            Add Branch
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
              placeholder="Search by name or address..."
              className="pl-10 bg-[#F9FAFB] border-[#E5E7EB]"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Content */}
      {isLoading ? (
        <Card className="border-[#E5E7EB]">
          <CardContent className="pt-6">
            <p className="text-gray-500">Loading branches...</p>
          </CardContent>
        </Card>
      ) : filteredBranches.length === 0 ? (
        <Card className="border-[#E5E7EB]">
          <CardContent className="pt-12 text-center">
            <MapPin className="mx-auto text-[#9CA3AF] mb-4" size={48} />
            <h3 className="text-lg font-semibold text-[#111827] mb-1">No branches yet</h3>
            <p className="text-gray-600 mb-6">Get started by adding your first branch</p>
            <Link href="/dashboard/branches/new">
              <Button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white">
                <Plus size={20} className="mr-2" />
                Add First Branch
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-[#E5E7EB] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#111827]">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#111827]">Address</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#111827]">Phone</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#111827]">Created</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-[#111827]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {filteredBranches.map((branch) => (
                  <tr key={branch.id} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/branches/${branch.id}`}
                        className="font-medium text-[#111827] hover:text-[#4F46E5]"
                      >
                        {branch.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{branch.address || '-'}</td>
                    <td className="px-6 py-4 text-gray-600">{branch.phone || '-'}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(branch.created_at!).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2 flex justify-end">
                      <Link href={`/dashboard/branches/${branch.id}/edit`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[#4F46E5] hover:bg-[#EEF2FF]"
                        >
                          <Edit2 size={16} />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(branch.id)}
                        disabled={deletingId === branch.id}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <CardContent className="pt-4 text-sm text-gray-600">
            Showing {filteredBranches.length} of {branches.length} branches
          </CardContent>
        </Card>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Edit2, Trash2, Search, UserCheck } from 'lucide-react'
import { getInstructors, deleteInstructor } from '@/lib/actions/instructors.actions'
import type { Database } from '@/lib/types/database.types'

type Instructor = Database['public']['Tables']['instructors']['Row']

export default function InstructorsPage() {
  const router = useRouter()
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [filteredInstructors, setFilteredInstructors] = useState<Instructor[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    loadInstructors()
  }, [])

  async function loadInstructors() {
    setIsLoading(true)
    setError(null)
    const result = await getInstructors()

    if (result.error) {
      setError(result.error)
    } else if (result.data) {
      setInstructors(result.data)
      setFilteredInstructors(result.data)
    }

    setIsLoading(false)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (!query.trim()) {
      setFilteredInstructors(instructors)
    } else {
      const query_lower = query.toLowerCase()
      const filtered = instructors.filter(
        (instructor) =>
          instructor.first_name?.toLowerCase().includes(query_lower) ||
          instructor.last_name?.toLowerCase().includes(query_lower) ||
          instructor.email?.toLowerCase().includes(query_lower)
      )
      setFilteredInstructors(filtered)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this instructor?')) return

    setDeletingId(id)
    const result = await deleteInstructor(id)

    if (result.error) {
      setError(result.error)
    } else {
      setInstructors(instructors.filter((i) => i.id !== id))
      setFilteredInstructors(filteredInstructors.filter((i) => i.id !== id))
    }

    setDeletingId(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#111827]">Instructors</h1>
          <p className="text-gray-600 mt-1">Manage your dance instructors</p>
        </div>
        <Link href="/dashboard/instructors/new">
          <Button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white">
            <Plus size={20} className="mr-2" />
            Add Instructor
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
              placeholder="Search by name or email..."
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
      ) : filteredInstructors.length === 0 ? (
        <Card className="border-[#E5E7EB]">
          <CardContent className="pt-12 text-center">
            <UserCheck className="mx-auto text-[#9CA3AF] mb-4" size={48} />
            <h3 className="text-lg font-semibold text-[#111827] mb-1">No instructors yet</h3>
            <p className="text-gray-600 mb-6">Get started by adding your first instructor</p>
            <Link href="/dashboard/instructors/new">
              <Button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white">
                <Plus size={20} className="mr-2" />
                Add Instructor
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
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#111827]">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#111827]">Phone</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#111827]">Joined</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-[#111827]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {filteredInstructors.map((instructor) => (
                  <tr key={instructor.id} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/instructors/${instructor.id}`}
                        className="font-medium text-[#111827] hover:text-[#4F46E5]"
                      >
                        {instructor.first_name} {instructor.last_name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{instructor.email}</td>
                    <td className="px-6 py-4 text-gray-600">{instructor.phone || '-'}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(instructor.created_at!).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2 flex justify-end">
                      <Link href={`/dashboard/instructors/${instructor.id}/edit`}>
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
                        onClick={() => handleDelete(instructor.id)}
                        disabled={deletingId === instructor.id}
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
            Showing {filteredInstructors.length} of {instructors.length} instructors
          </CardContent>
        </Card>
      )}
    </div>
  )
}

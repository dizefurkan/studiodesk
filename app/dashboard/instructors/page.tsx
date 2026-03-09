import { getInstructors } from '@/lib/actions/instructors.actions'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus, Edit2, Trash2, UserCheck } from 'lucide-react'
import type { Database } from '@/lib/types/database.types'

type Instructor = Database['public']['Tables']['instructors']['Row']

export default async function InstructorsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const searchQuery = typeof params.q === 'string' ? params.q : undefined

  const result = await getInstructors(searchQuery)
  console.log('[InstructorsPage] Result from getInstructors:', result)
  console.log('[InstructorsPage] Result.error:', result.error)
  console.log('[InstructorsPage] Result.data:', result.data)
  const instructors = result.data || []
  console.log('[InstructorsPage] Instructors to render:', instructors)
  console.log('[InstructorsPage] Instructors length:', instructors.length)

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

      {/* Content */}
      {instructors.length === 0 ? (
        <Card className="border-[#E5E7EB]">
          <div className="p-12 text-center">
            <UserCheck className="mx-auto text-[#9CA3AF] mb-4" size={48} />
            <h3 className="text-lg font-semibold text-[#111827] mb-1">No instructors yet</h3>
            <p className="text-gray-600 mb-6">Get started by adding your first instructor</p>
            <Link href="/dashboard/instructors/new">
              <Button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white">
                <Plus size={20} className="mr-2" />
                Add Instructor
              </Button>
            </Link>
          </div>
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
                {instructors.map((instructor) => (
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
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 text-sm text-gray-600 border-t border-[#E5E7EB]">
            Showing {instructors.length} instructors
          </div>
        </Card>
      )}
    </div>
  )
}

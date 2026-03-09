import { getStudents } from '@/lib/actions/students.actions'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Users, Plus, Edit2, Trash2 } from 'lucide-react'
import type { Database } from '@/lib/types/database.types'

type Student = Database['public']['Tables']['students']['Row']

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const searchQuery = typeof params.q === 'string' ? params.q : undefined

  const result = await getStudents(searchQuery)
  console.log('[StudentsPage] Result from getStudents:', result)
  console.log('[StudentsPage] Result.error:', result.error)
  console.log('[StudentsPage] Result.data:', result.data)
  const students = result.data || []
  console.log('[StudentsPage] Students to render:', students)
  console.log('[StudentsPage] Students length:', students.length)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#111827]">Students</h1>
          <p className="text-gray-600 mt-1">Manage your studio students</p>
        </div>
        <Link href="/dashboard/students/new">
          <Button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white">
            <Plus size={20} className="mr-2" />
            Add Student
          </Button>
        </Link>
      </div>

      {/* Content */}
      {students.length === 0 ? (
        <Card className="border-[#E5E7EB]">
          <div className="p-12 text-center">
            <Users className="mx-auto text-[#9CA3AF] mb-4" size={48} />
            <h3 className="text-lg font-semibold text-[#111827] mb-1">No students yet</h3>
            <p className="text-gray-600 mb-6">Get started by adding your first student</p>
            <Link href="/dashboard/students/new">
              <Button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white">
                <Plus size={20} className="mr-2" />
                Add First Student
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
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/students/${student.id}`}
                        className="font-medium text-[#111827] hover:text-[#4F46E5]"
                      >
                        {student.first_name} {student.last_name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{student.email}</td>
                    <td className="px-6 py-4 text-gray-600">{student.phone || '-'}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(student.created_at!).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2 flex justify-end">
                      <Link href={`/dashboard/students/${student.id}/edit`}>
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
            Showing {students.length} students
          </div>
        </Card>
      )}
    </div>
  )
}

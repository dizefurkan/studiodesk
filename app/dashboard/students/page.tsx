'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Users, Plus, Edit2, Trash2, Search } from 'lucide-react'
import { getStudents, deleteStudent } from '@/lib/actions/students.actions'
import type { Database } from '@/lib/types/database.types'

type Student = Database['public']['Tables']['students']['Row']

export default function StudentsPage() {
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    loadStudents()
  }, [])

  async function loadStudents() {
    setIsLoading(true)
    setError(null)
    const result = await getStudents()

    if (result.error) {
      setError(result.error)
    } else if (result.data) {
      setStudents(result.data)
      setFilteredStudents(result.data)
    }

    setIsLoading(false)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (!query.trim()) {
      setFilteredStudents(students)
    } else {
      const query_lower = query.toLowerCase()
      const filtered = students.filter(
        (student) =>
          student.first_name?.toLowerCase().includes(query_lower) ||
          student.last_name?.toLowerCase().includes(query_lower) ||
          student.email?.toLowerCase().includes(query_lower)
      )
      setFilteredStudents(filtered)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this student?')) return

    setDeletingId(id)
    const result = await deleteStudent(id)

    if (result.error) {
      setError(result.error)
    } else {
      setStudents(students.filter((s) => s.id !== id))
      setFilteredStudents(filteredStudents.filter((s) => s.id !== id))
    }

    setDeletingId(null)
  }

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
            <p className="text-gray-500">Loading students...</p>
          </CardContent>
        </Card>
      ) : filteredStudents.length === 0 ? (
        <Card className="border-[#E5E7EB]">
          <CardContent className="pt-12 text-center">
            <Users className="mx-auto text-[#9CA3AF] mb-4" size={48} />
            <h3 className="text-lg font-semibold text-[#111827] mb-1">No students yet</h3>
            <p className="text-gray-600 mb-6">Get started by adding your first student</p>
            <Link href="/dashboard/students/new">
              <Button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white">
                <Plus size={20} className="mr-2" />
                Add First Student
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
                {filteredStudents.map((student) => (
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
                        onClick={() => handleDelete(student.id)}
                        disabled={deletingId === student.id}
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
            Showing {filteredStudents.length} of {students.length} students
          </CardContent>
        </Card>
      )}
    </div>
  )
}

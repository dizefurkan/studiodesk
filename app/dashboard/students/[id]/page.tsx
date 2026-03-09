import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Edit2, ArrowLeft, Mail, Phone } from 'lucide-react'
import { getStudent } from '@/lib/actions/students.actions'

interface StudentDetailPageProps {
  params: {
    id: string
  }
}

export default async function StudentDetailPage({ params }: StudentDetailPageProps) {
  const { id } = await params
  const result = await getStudent(id)

  if (result.error || !result.data) {
    notFound()
  }

  const student = result.data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <Link href="/dashboard/students">
              <Button variant="ghost" size="sm" className="text-[#6B7280]">
                <ArrowLeft size={16} className="mr-2" />
                Back to Students
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-[#111827]">
            {student.first_name} {student.last_name}
          </h1>
          <p className="text-gray-600 mt-1">Student Profile</p>
        </div>
        <Link href={`/dashboard/students/${student.id}/edit`}>
          <Button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white">
            <Edit2 size={16} className="mr-2" />
            Edit
          </Button>
        </Link>
      </div>

      {/* Main Info Card */}
      <Card className="border-[#E5E7EB]">
        <div className="p-8">
          <h2 className="text-lg font-semibold text-[#111827] mb-6">Contact Information</h2>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Mail className="text-[#4F46E5]" size={20} />
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium text-[#111827]">{student.email}</p>
              </div>
            </div>

            {student.phone && (
              <div className="flex items-center gap-4">
                <Phone className="text-[#4F46E5]" size={20} />
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium text-[#111827]">{student.phone}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Notes */}
      {student.notes && (
        <Card className="border-[#E5E7EB]">
          <div className="p-8">
            <h2 className="text-lg font-semibold text-[#111827] mb-4">Notes</h2>
            <p className="text-gray-600 whitespace-pre-wrap">{student.notes}</p>
          </div>
        </Card>
      )}

      {/* Meta Info */}
      <Card className="border-[#E5E7EB]">
        <div className="p-8">
          <h2 className="text-lg font-semibold text-[#111827] mb-4">Information</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600">Joined</p>
              <p className="font-medium text-[#111827]">{new Date(student.created_at!).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Last Updated</p>
              <p className="font-medium text-[#111827]">{new Date(student.updated_at!).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

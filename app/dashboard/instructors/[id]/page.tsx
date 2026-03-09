import { getInstructor } from '@/lib/actions/instructors.actions'
import { notFound, redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { trash2, edit } from 'lucide-react'
import { User, Mail, Phone } from 'lucide-react'

interface InstructorDetailPageProps {
  params: {
    id: string
  }
}

export default async function InstructorDetailPage({ params }: InstructorDetailPageProps) {
  const result = await getInstructor(params.id)

  if (result.error) {
    notFound()
  }

  const instructor = result.data

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-8">
      <div className="max-w-2xl">
        <Link href="/dashboard/instructors" className="text-[#4F46E5] hover:underline mb-6 inline-block">
          ← Back to Instructors
        </Link>

        <Card className="border-[#E5E7EB]">
          <div className="p-8">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-3xl font-bold text-[#111827] mb-2">
                  {instructor.first_name} {instructor.last_name}
                </h1>
                <p className="text-gray-600">Instructor Information</p>
              </div>
              <div className="flex gap-2">
                <Link href={`/dashboard/instructors/${instructor.id}/edit`}>
                  <Button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white gap-2">
                    <edit size={18} />
                    Edit
                  </Button>
                </Link>
              </div>
            </div>

            <div className="space-y-6 border-t border-[#E5E7EB] pt-6">
              <div className="flex items-center gap-4">
                <Mail className="text-[#4F46E5]" size={20} />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="text-lg font-medium text-[#111827]">{instructor.email}</p>
                </div>
              </div>

              {instructor.phone && (
                <div className="flex items-center gap-4">
                  <Phone className="text-[#4F46E5]" size={20} />
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="text-lg font-medium text-[#111827]">{instructor.phone}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 pt-4">
                <User className="text-[#4F46E5]" size={20} />
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="text-lg font-medium text-[#111827]">Active</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

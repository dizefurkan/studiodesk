import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Edit2, ArrowLeft, Mail, Phone } from 'lucide-react'
import { getStudent, getStudentPackages } from '@/lib/actions/students.actions'
import { getPackages } from '@/lib/actions/packages.actions'
import { getOrganization } from '@/lib/auth/getOrganization'
import { DEFAULT_CURRENCY } from '@/config/currencies'
import { getStudentAttendanceHistory, getStudentPackageHistory } from '@/lib/actions/history.actions'
import { StudentCredits } from '@/components/students/StudentCredits'
import { StudentPurchaseDialog } from '@/components/students/StudentPurchaseDialog'
import { StudentCoursesSection } from '@/components/students/StudentCoursesSection'
import { StudentHistory } from '@/components/students/StudentHistory'

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
  const organization = await getOrganization()
  const currency = organization?.currency || 'TRY'

  // Fetch student packages, available packages, and history
  const [packagesResult, availablePackagesResult, attendanceHistoryResult, packageHistoryResult] = await Promise.all([
    getStudentPackages(id),
    getPackages(),
    getStudentAttendanceHistory(id),
    getStudentPackageHistory(id),
  ])

  const studentPackages = packagesResult.data || []
  const availablePackages = availablePackagesResult.data || []
  const attendanceHistory = attendanceHistoryResult.data || []
  const packageHistory = packageHistoryResult.data || []

  return (
    <div className="space-y-6">
      {/* Header - Mobile: Stacked, Desktop: Side-by-side */}
      <div className="space-y-4 md:space-y-0 flex flex-col md:flex-row md:items-start md:justify-between">
        {/* Left Section - Mobile: Full width */}
        <div className="min-w-0">
          {/* Back Button - Mobile: text-only, Desktop: full */}
          <Link href="/dashboard/students">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-[#6B7280] px-0 md:px-2 -ml-2 md:ml-0"
            >
              <ArrowLeft size={16} className="mr-2 shrink-0" />
              <span className="hidden md:inline">Back to Students</span>
              <span className="md:hidden">Back</span>
            </Button>
          </Link>
          
          {/* Student Name - Responsive size */}
          <h1 className="text-2xl md:text-3xl font-bold text-[#111827] mt-3 truncate">
            {student.first_name} {student.last_name}
          </h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">Student Profile</p>
        </div>

        {/* Right Section - Mobile: 2-column grid, Desktop: flex row */}
        <div className="grid grid-cols-2 md:flex gap-2">
          <div className="col-span-1">
            <StudentPurchaseDialog studentId={id} packages={availablePackages as any} currency={currency} />
          </div>
          <Link href={`/dashboard/students/${student.id}/edit`} className="col-span-1">
            <Button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white w-full md:w-auto">
              <Edit2 size={16} className="mr-2 shrink-0" />
              <span className="hidden md:inline">Edit</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Credits Section */}
      <StudentCredits packages={studentPackages as any} />

      {/* Enrolled Courses Section */}
      <StudentCoursesSection studentId={id} />

      {/* History Section */}
      <StudentHistory 
        attendanceHistory={attendanceHistory}
        packageHistory={packageHistory}
      />

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

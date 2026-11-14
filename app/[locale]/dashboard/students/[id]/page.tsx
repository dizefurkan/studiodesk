import { Link } from '@/i18n/navigation'
import { notFound } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Edit2, ArrowLeft, Mail, Phone } from 'lucide-react'
import { getStudent, getStudentPackages } from '@/lib/actions/students.actions'
import { getPackages } from '@/lib/actions/packages.actions'
import { getOrganization } from '@/lib/auth/getOrganization'
import { getEntityHistory } from '@/lib/actions/history.actions'
import { getStudentAttendanceHistory, getStudentPackageHistory } from '@/lib/actions/history.actions'
import { StudentCredits } from '@/components/students/StudentCredits'
import { StudentPurchaseDialog } from '@/components/students/StudentPurchaseDialog'
import { StudentCoursesSection } from '@/components/students/StudentCoursesSection'
import { StudentHistory } from '@/components/students/StudentHistory'
import { ActivityTimelineWrapper } from '@/components/history/ActivityTimelineWrapper'
import { getLocale, getTranslations } from 'next-intl/server'

interface StudentDetailPageProps {
  params: {
    id: string
  }
}

export default async function StudentDetailPage({ params }: StudentDetailPageProps) {
  const tx = await getTranslations('studentDetail')
  const td = await getTranslations('detailPages')
  const locale = await getLocale()
  const { id } = await params
  const result = await getStudent(id)

  if (result.error || !result.data) {
    notFound()
  }

  const student = result.data
  const organization = await getOrganization()
  const currency = organization?.currency || 'TRY'

  // Fetch student packages, available packages, and history
  const [packagesResult, availablePackagesResult, attendanceHistoryResult, packageHistoryResult, entityHistoryResult] = await Promise.all([
    getStudentPackages(id),
    getPackages(),
    getStudentAttendanceHistory(id),
    getStudentPackageHistory(id),
    getEntityHistory('student', id, 20),
  ])

  const studentPackages = packagesResult.data || []
  const availablePackages = availablePackagesResult.data || []
  const attendanceHistory = attendanceHistoryResult.data || []
  const packageHistory = packageHistoryResult.data || []
  const entityHistory = entityHistoryResult || []

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
              className="text-muted-foreground px-0 md:px-2 -ml-2 md:ml-0"
            >
              <ArrowLeft size={16} className="mr-2 shrink-0" />
              <span className="hidden md:inline">{tx('backToList')}</span>
              <span className="md:hidden">{td('back')}</span>
            </Button>
          </Link>
          
          {/* Student Name - Responsive size */}
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mt-3 truncate">
            {student.first_name} {student.last_name}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">{tx('subtitle')}</p>
        </div>

        {/* Right Section - Mobile: 2-column grid, Desktop: flex row */}
        <div className="grid grid-cols-2 md:flex gap-2">
          <div className="col-span-1">
            <StudentPurchaseDialog studentId={id} packages={availablePackages} currency={currency} />
          </div>
          <Link href={`/dashboard/students/${student.id}/edit`} className="col-span-1">
            <Button className="w-full md:w-auto">
              <Edit2 size={16} className="mr-2 shrink-0" />
              <span className="hidden md:inline">{td('edit')}</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Credits Section */}
      <StudentCredits packages={studentPackages} />

      {/* Enrolled Courses Section */}
      <StudentCoursesSection studentId={id} />

      {/* History Section */}
      <StudentHistory 
        attendanceHistory={attendanceHistory}
        packageHistory={packageHistory}
      />

      {/* Main Info Card */}
      <Card className="border-border">
        <div className="p-8">
          <h2 className="text-lg font-semibold text-foreground mb-6">{tx('contact')}</h2>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Mail className="text-primary" size={20} />
              <div>
                <p className="text-sm text-muted-foreground">{td('email')}</p>
                <p className="font-medium text-foreground">{student.email}</p>
              </div>
            </div>

            {student.phone && (
              <div className="flex items-center gap-4">
                <Phone className="text-primary" size={20} />
                <div>
                  <p className="text-sm text-muted-foreground">{td('phone')}</p>
                  <p className="font-medium text-foreground">{student.phone}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Notes */}
      {student.notes && (
        <Card className="border-border">
          <div className="p-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">{tx('notes')}</h2>
            <p className="text-muted-foreground whitespace-pre-wrap">{student.notes}</p>
          </div>
        </Card>
      )}

      {/* Meta Info */}
      <Card className="border-border">
        <div className="p-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">{tx('information')}</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">{tx('joined')}</p>
              <p className="font-medium text-foreground">{new Date(student.created_at).toLocaleDateString(locale)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{tx('updated')}</p>
              <p className="font-medium text-foreground">{new Date(student.updated_at).toLocaleDateString(locale)}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Timeline History */}
      <ActivityTimelineWrapper 
        entity="student"
        entityId={id}
        initialLogs={entityHistory}
        title={td('activityTimeline')}
        description={tx('timelineDescription')}
        showFullPage={false}
      />
    </div>
  )
}

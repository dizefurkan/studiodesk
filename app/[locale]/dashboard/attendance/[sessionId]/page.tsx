import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import Link from 'next/link'
import { ArrowLeft, Users, Check, X, User } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

interface AttendanceDetailPageProps {
  params: Promise<{
    locale: string
    sessionId: string
  }>
}

export default async function AttendanceDetailPage({ params }: AttendanceDetailPageProps) {
  const { sessionId } = await params
  const t = await getTranslations()
  
  const user = await getCurrentUser()
  if (!user) {
    return <div>Not authenticated</div>
  }

  const supabase = await createServerSupabaseClient()

  // Fetch session details
  const { data: session, error: sessionError } = await (supabase
    .from('course_sessions') as any)
    .select(
      `
      id,
      session_date,
      course:courses(id, name, branch:branches(name)),
      attendances(
        id,
        is_present,
        notes,
        student:students(id, first_name, last_name),
        studio:studios(id, name)
      ),
      session_instructors(
        instructor:instructors(id, first_name, last_name)
      )
    `
    )
    .eq('id', sessionId)
    .single()

  if (sessionError || !session) {
    return (
      <div className="space-y-6">
        <Link href="/dashboard/attendance" className="text-[#4F46E5] hover:underline text-sm">
          ← Back
        </Link>
        <p className="text-red-600">Session not found</p>
      </div>
    )
  }

  const attendances = session.attendances || []
  const presentCount = attendances.filter((a: any) => a.is_present).length
  const absentCount = attendances.filter((a: any) => !a.is_present).length
  const instructors = session.session_instructors?.map((si: any) => si.instructor) || []

  // Format date for display
  const sessionDate = new Date(session.session_date + 'T00:00:00Z')
  const formattedDate = sessionDate.toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })

  return (
    <div className="space-y-6 p-6 md:p-0">
      {/* Header */}
      <div>
        <Link href="/dashboard/attendance" className="text-[#4F46E5] hover:underline text-sm inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          Yoklamalara Dön
        </Link>
      </div>

      {/* Session Info Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">{session.course?.name}</h1>
          <p className="text-sm text-gray-600 mt-1">{session.course?.branch?.name}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Tarih</p>
            <p className="text-sm font-semibold text-[#111827] mt-1">{formattedDate}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Geldi</p>
            <p className="text-sm font-semibold text-green-600 mt-1 flex items-center gap-1">
              <Check className="w-4 h-4" />
              {presentCount}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Gelmedi</p>
            <p className="text-sm font-semibold text-red-600 mt-1 flex items-center gap-1">
              <X className="w-4 h-4" />
              {absentCount}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Toplam</p>
            <p className="text-sm font-semibold text-[#111827] mt-1 flex items-center gap-1">
              <Users className="w-4 h-4" />
              {attendances.length}
            </p>
          </div>
        </div>

        {/* Instructors */}
        {instructors.length > 0 && (
          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Öğretmenler</p>
            <div className="flex flex-wrap gap-2">
              {instructors.map((instructor: any) => (
                <span
                  key={instructor.id}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {instructor.first_name} {instructor.last_name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Attendance Records */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-[#111827]">Yoklama Kayıtları</h2>

        {attendances.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-600">
            Bu oturum için yoklama kaydı yok
          </div>
        ) : (
          <div className="space-y-2">
            {attendances.map((attendance: any) => (
              <div
                key={attendance.id}
                className={`flex items-center gap-4 p-4 rounded-lg border ${
                  attendance.is_present
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    attendance.is_present ? 'bg-green-200' : 'bg-red-200'
                  }`}
                >
                  {attendance.is_present ? (
                    <Check className="w-5 h-5 text-green-700" />
                  ) : (
                    <X className="w-5 h-5 text-red-700" />
                  )}
                </div>

                <div className="flex-1">
                  <p className="font-semibold text-[#111827]">
                    {attendance.student?.first_name} {attendance.student?.last_name}
                  </p>
                  {attendance.notes && (
                    <p className="text-xs text-gray-600 mt-1">{attendance.notes}</p>
                  )}
                  {attendance.studio?.name && (
                    <p className="text-xs text-gray-500 mt-1">Stüdyo: {attendance.studio.name}</p>
                  )}
                </div>

                <div className="text-right">
                  <p className="text-xs font-semibold text-gray-600">
                    {attendance.is_present ? 'Geldi' : 'Gelmedi'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

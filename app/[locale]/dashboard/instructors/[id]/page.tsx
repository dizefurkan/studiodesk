import { Link } from '@/i18n/navigation'
import { getInstructor } from "@/lib/actions/instructors.actions";
import {
  getInstructorCourses,
  getInstructorMonthlyStats,
  getInstructorTotalEarnings,
} from "@/lib/actions/instructor-detail.actions";
import { getEntityHistory } from "@/lib/actions/history.actions";
import { notFound } from 'next/navigation'
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Edit2,
  Mail,
  Phone,
  BookOpen,
  DollarSign,
  Calendar,
} from "lucide-react";
import { InstructorAttendanceHistory } from "@/components/instructors/InstructorAttendanceHistory";
import { ActivityTimelineWrapper } from "@/components/history/ActivityTimelineWrapper";
import { formatTime } from "@/lib/utils/formatTime";
import { formatCurrency } from "@/lib/utils/format";
import { weekdayNames } from "@/lib/i18n/dates";
import { getOrganization } from "@/lib/auth/getOrganization";
import { getLocale, getTranslations } from 'next-intl/server'


interface InstructorDetailPageProps {
  params: {
    id: string;
  };
}

export default async function InstructorDetailPage({
  params,
}: InstructorDetailPageProps) {
  const tx = await getTranslations('instructorDetail')
  const td = await getTranslations('detailPages')
  const locale = await getLocale()
  const DAYS = weekdayNames(locale)
  const currency = (await getOrganization())?.currency || 'TRY'
  const { id } = await params;
  const result = await getInstructor(id);

  if (result.error) {
    notFound();
  }

  const instructor = result.data!;

  // Fetch instructor stats in parallel
  const [coursesResult, statsResult, totalEarningsResult, entityHistoryResult] =
    await Promise.all([
      getInstructorCourses(id),
      getInstructorMonthlyStats(id),
      getInstructorTotalEarnings(id),
      getEntityHistory("instructor", id, 20),
    ]);

  const courses = coursesResult.data || [];
  const stats = statsResult.data;
  const totalStats = totalEarningsResult.data;
  const entityHistory = entityHistoryResult || [];

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/instructors"
        className="text-primary hover:underline inline-block"
      >
        {tx('backToList')}
      </Link>

      <Card className="border-border">
        <div className="p-4 sm:p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 md:gap-8 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                {instructor.first_name} {instructor.last_name}
              </h1>
              <p className="text-muted-foreground">{tx('subtitle')}</p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Link
                href={`/dashboard/instructors/${instructor.id}/edit`}
                className="w-full sm:w-auto"
              >
                <Button className="gap-2 w-full sm:w-auto">
                  <Edit2 size={18} />
                  {td('edit')}
                </Button>
              </Link>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4 border-t border-border pt-6 pb-8 mb-8">
            <div className="flex items-center gap-4">
              <Mail className="text-primary" size={20} />
              <div>
                <p className="text-sm text-muted-foreground">{td('email')}</p>
                <p className="text-lg font-medium text-foreground">
                  {instructor.email}
                </p>
              </div>
            </div>

            {instructor.phone && (
              <div className="flex items-center gap-4">
                <Phone className="text-primary" size={20} />
                <div>
                  <p className="text-sm text-muted-foreground">{td('phone')}</p>
                  <a
                    href={`tel:${instructor.phone}`}
                    className="text-lg font-medium text-primary hover:underline"
                  >
                    {instructor.phone}
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* Total Earnings Card */}
            <Card className="border-border p-6 bg-linear-to-br from-green-50 to-green-100">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{tx('totalEarnings')}</p>
                  <p className="text-3xl font-bold text-green-700">
                    {formatCurrency(totalStats?.totalEarnings ?? 0, currency)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {tx('classCount', { count: totalStats?.sessionCount || 0 })}
                  </p>
                </div>
                <DollarSign className="text-green-600" size={28} />
              </div>
            </Card>

            {/* This Month Earnings Card */}
            <Card className="border-border p-6 bg-linear-to-br from-blue-50 to-blue-100">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {tx('monthEarnings')}
                  </p>
                  <p className="text-3xl font-bold text-blue-700">
                    {formatCurrency(stats?.totalEarnings ?? 0, currency)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {tx('sessionCount', { count: stats?.earningCount || 0 })}
                  </p>
                </div>
                <Calendar className="text-blue-600" size={28} />
              </div>
            </Card>

            {/* Attendance Count Card */}
            <Card className="border-border p-6 bg-linear-to-br from-purple-50 to-purple-100">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {tx('monthSessions')}
                  </p>
                  <p className="text-3xl font-bold text-purple-700">
                    {stats?.sessionCount || 0}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {tx('studentsMarked', { count: stats?.attendanceCount || 0 })}
                  </p>
                </div>
                <BookOpen className="text-purple-600" size={28} />
              </div>
            </Card>
          </div>

          {/* Assigned Courses Section */}
          {courses.length > 0 && (
            <div className="border-t border-border pt-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                {tx('assignedCourses', { count: courses.length })}
              </h2>
              <div className="space-y-3">
                {courses.map((course) => (
                  <Card
                    key={course.id}
                    className="border-border p-4 hover:border-primary transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground text-lg">
                          {course.name}
                        </h3>
                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            📚 {course.dance_types?.name}
                          </span>
                          <span className="flex items-center gap-1">
                            🏢 {course.branches?.name}
                          </span>
                          <span className="flex items-center gap-1">
                            ⏰ {DAYS[course.day_of_week]}{" "}
                            {formatTime(course.start_time)} -{" "}
                            {formatTime(course.end_time)}
                          </span>
                        </div>
                      </div>
                      <Link href={`/dashboard/courses/${course.id}`}>
                        <Button className="text-sm ml-4 shrink-0">
                          {td('view')}
                        </Button>
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {courses.length === 0 && (
            <div className="border-t border-border pt-8 text-center text-muted-foreground">
              <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg">{tx('noCourses')}</p>
            </div>
          )}

          {/* Attendance History */}
          <InstructorAttendanceHistory
            instructorId={id}
            showCourseInfo={true}
            showInstructors={true}
          />

          {/* Activity Timeline */}
          <div className="mt-12 pt-8 border-t border-border">
            <ActivityTimelineWrapper
              entity="instructor"
              entityId={id}
              initialLogs={entityHistory}
              title={td('activityTimeline')}
              description={tx('timelineDescription')}
              showFullPage={false}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}

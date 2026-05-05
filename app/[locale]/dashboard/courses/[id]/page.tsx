import { getCourse, getCourseSessions } from "@/lib/actions/courses.actions";
import { getCourseAttendanceHistory } from "@/lib/actions/course-attendance.actions";
import { getEntityHistory } from "@/lib/actions/history.actions";
import { CourseStudentsContainer } from "@/components/courses/CourseStudentsContainer";
import { ActivityTimelineWrapper } from "@/components/history/ActivityTimelineWrapper";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Clock, Users, Edit2, BookOpen, CheckCircle } from "lucide-react";
import { formatTime } from "@/lib/utils/formatTime";
import { format, isToday, isYesterday } from "date-fns";

interface CourseDetailPageProps {
  params: {
    id: string;
  };
}

export default async function CourseDetailPage({
  params,
}: CourseDetailPageProps) {
  const { id } = await params;
  const t = await getTranslations();
  const result = await getCourse(id);

  if (result.error) {
    notFound();
  }

  const course = result.data!;

  // Get attendance history
  const historyResult = await getCourseAttendanceHistory(course.id);
  const attendanceHistory = historyResult.data || [];

  // Get entity activity history
  const entityHistory = (await getEntityHistory("course", id, 20)) || [];

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/courses"
        className="text-[#4F46E5] hover:underline inline-block"
      >
        ← {t("common.backToCourses")}
      </Link>

      <Card className="border-[#E5E7EB]">
        <div className="p-4 sm:p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 md:gap-8 mb-8">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] mb-2">
                {course.name}
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                {course.branches?.name} • {course.dance_types?.name}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Link
                href={`/dashboard/attendance?course=${course.id}`}
                className="w-full sm:w-auto"
              >
                <Button className="bg-green-600 hover:bg-green-700 text-white gap-2 w-full sm:w-auto">
                  <CheckCircle size={18} />
                  {t("courses.markAttendance")}
                </Button>
              </Link>
              <Link
                href={`/dashboard/courses/${course.id}/edit`}
                className="w-full sm:w-auto"
              >
                <Button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white gap-2 w-full sm:w-auto">
                  <Edit2 size={18} />
                  {t("common.edit")}
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 border-t border-[#E5E7EB] pt-8">
            <div>
              <p className="text-sm text-gray-600 mb-2">
                {t("courses.schedule")}
              </p>
              <div className="flex items-center gap-2 text-lg font-medium text-[#111827]">
                <Clock size={20} className="text-[#4F46E5]" />
                {t(
                  `data.days.${["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][course.day_of_week]}`
                )}{" "}
                {formatTime(course.start_time)} - {formatTime(course.end_time)}
              </div>
            </div>
          </div>

          {course.course_instructors &&
            course.course_instructors.length > 0 && (
              <div className="mt-8 pt-8 border-t border-[#E5E7EB]">
                <p className="text-sm text-gray-600 mb-4">
                  {t("courses.assignedInstructors")}
                </p>
                <div className="flex gap-2 flex-wrap">
                  {course.course_instructors.map((ci: any) => {
                    const instructor = ci.instructors;
                    const instructorName = instructor
                      ? `${instructor.first_name} ${instructor.last_name}`
                      : ci.instructor_id;

                    return (
                      <a
                        key={ci.instructor_id}
                        href={`/dashboard/instructors/${ci.instructor_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-[#4F46E5] text-white px-4 py-2 rounded-full text-sm hover:bg-[#4338CA] transition-colors cursor-pointer font-medium"
                      >
                        {instructorName}
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
        </div>
      </Card>

      {/* Attendance History */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-[#111827] mb-4">
          {t("courses.attendanceHistory")}
        </h2>

        {attendanceHistory.length === 0 ? (
          <Card className="border-[#E5E7EB] p-12 text-center">
            <div className="text-gray-500">
              <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg">{t("courses.noAttendanceRecords")}</p>
              <p className="text-sm mt-1">
                {t("courses.startMarkingAttendance")}
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-2">
            {attendanceHistory.map((record: any) => (
              <details
                key={record.id}
                className="border border-[#E5E7EB] rounded-lg hover:border-[#4F46E5] transition-colors group"
              >
                <summary className="p-4 cursor-pointer hover:bg-gray-50 transition-colors flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                  <div className="flex-1">
                    <div className="space-y-1">
                      <p className="font-medium text-[#111827]">
                        {(() => {
                          const date = new Date(record.session_date);
                          if (isToday(date)) {
                            return `Today, ${format(date, "MMMM d, yyyy")}`;
                          } else if (isYesterday(date)) {
                            return `Yesterday, ${format(date, "MMMM d, yyyy")}`;
                          }
                          return format(date, "EEEE, MMMM d, yyyy");
                        })()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(record.session_date), "HH:mm")}
                      </p>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      {record.attendance_count} {t("attendance.presentOutOf")} (
                      {t("attendance.outOf")} {record.attendances?.length || 0}{" "}
                      {t("attendance.total")})
                      {record.attendances?.length > 0 &&
                        record.attendances[0]?.studios?.name &&
                        ` • ${t("common.studio")}: ${record.attendances[0].studios.name}`}
                    </p>
                    {record.instructors && record.instructors.length > 0 && (
                      <p className="text-sm text-[#4F46E5] mt-1 font-medium">
                        {t("common.instructor")}:{" "}
                        {record.instructors
                          .map((i: any) => `${i.first_name} ${i.last_name}`)
                          .join(", ")}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 self-start md:self-center md:ml-4">
                    <span className="text-sm font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full">
                      {record.attendance_count}/
                      {record.attendances?.length || 0}
                    </span>
                    <Link
                      href={`/dashboard/attendance/${record.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline"
                    >
                      {t("common.viewDetails")} →
                    </Link>
                  </div>
                </summary>
                <div className="px-4 pb-4 border-t border-[#E5E7EB] pt-4 bg-gray-50">
                  <p className="text-sm font-semibold text-[#111827] mb-3">
                    {t("common.attendees")}:
                  </p>
                  <div className="space-y-2">
                    {record.attendances && record.attendances.length > 0 ? (
                      record.attendances.map((att: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 text-sm"
                        >
                          <span
                            className={`font-bold ${att.is_present ? "text-green-600" : "text-red-600"}`}
                          >
                            {att.is_present ? "✓" : "✗"}
                          </span>
                          <Link
                            href={`/dashboard/students/${att.student.id}`}
                            className="text-[#4F46E5] hover:underline font-medium"
                          >
                            {att.student.first_name} {att.student.last_name}
                          </Link>
                          {att.notes && (
                            <span className="text-gray-600">({att.notes})</span>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">
                        {t("attendance.noAttendance")}
                      </p>
                    )}
                  </div>
                </div>
              </details>
            ))}
          </div>
        )}
      </div>

      {/* Students */}
      <CourseStudentsContainer
        courseId={course.id}
        danceTypeId={course.dance_type_id}
      />

      {/* Activity Timeline */}
      <div className="mt-12 pt-8 border-t border-[#E5E7EB]">
        <ActivityTimelineWrapper
          entity="course"
          entityId={course.id}
          initialLogs={entityHistory}
          title="Activity Timeline"
          description="All changes and actions related to this course"
          showFullPage={false}
        />
      </div>
    </div>
  );
}

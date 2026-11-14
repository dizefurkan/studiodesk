import { Link } from '@/i18n/navigation'
import { getCourse } from "@/lib/actions/courses.actions";
import { getCourseAttendanceHistory } from "@/lib/actions/course-attendance.actions";
import { getEntityHistory } from "@/lib/actions/history.actions";
import { CourseStudentsContainer } from "@/components/courses/CourseStudentsContainer";
import { AttendanceHistorySection } from "@/components/courses/AttendanceHistorySection";
import { ActivityTimelineWrapper } from "@/components/history/ActivityTimelineWrapper";
import { notFound } from 'next/navigation'
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getTranslations } from "next-intl/server";
import { Clock, Edit2, CheckCircle } from "lucide-react";
import { formatTime } from "@/lib/utils/formatTime";

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
        className="text-primary hover:underline inline-block"
      >
        ← {t("common.backToCourses")}
      </Link>

      <Card className="border-border">
        <div className="p-4 sm:p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 md:gap-8 mb-8">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                {course.name}
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
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
                <Button className="gap-2 w-full sm:w-auto">
                  <Edit2 size={18} />
                  {t("common.edit")}
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 border-t border-border pt-8">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                {t("courses.schedule")}
              </p>
              <div className="flex items-center gap-2 text-lg font-medium text-foreground">
                <Clock size={20} className="text-primary" />
                {t(
                  `data.days.${["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][course.day_of_week]}`
                )}{" "}
                {formatTime(course.start_time)} - {formatTime(course.end_time)}
              </div>
            </div>
          </div>

          {course.course_instructors &&
            course.course_instructors.length > 0 && (
              <div className="mt-8 pt-8 border-t border-border">
                <p className="text-sm text-muted-foreground mb-4">
                  {t("courses.assignedInstructors")}
                </p>
                <div className="flex gap-2 flex-wrap">
                  {course.course_instructors.map((ci) => {
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
                        className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm hover:bg-primary/90 transition-colors cursor-pointer font-medium"
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
      <AttendanceHistorySection attendanceHistory={attendanceHistory} />

      {/* Students */}
      <CourseStudentsContainer
        courseId={course.id}
        danceTypeId={course.dance_type_id}
      />

      {/* Activity Timeline */}
      <div className="mt-12 pt-8 border-t border-border">
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

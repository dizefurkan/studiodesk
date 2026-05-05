import { getInstructor } from "@/lib/actions/instructors.actions";
import {
  getInstructorCourses,
  getInstructorMonthlyStats,
  getInstructorTotalEarnings,
} from "@/lib/actions/instructor-detail.actions";
import { getEntityHistory } from "@/lib/actions/history.actions";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
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

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

interface InstructorDetailPageProps {
  params: {
    id: string;
  };
}

export default async function InstructorDetailPage({
  params,
}: InstructorDetailPageProps) {
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
        className="text-[#4F46E5] hover:underline inline-block"
      >
        ← Back to Instructors
      </Link>

      <Card className="border-[#E5E7EB]">
        <div className="p-4 sm:p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 md:gap-8 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] mb-2">
                {instructor.first_name} {instructor.last_name}
              </h1>
              <p className="text-gray-600">Instructor Profile</p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Link
                href={`/dashboard/instructors/${instructor.id}/edit`}
                className="w-full sm:w-auto"
              >
                <Button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white gap-2 w-full sm:w-auto">
                  <Edit2 size={18} />
                  Edit
                </Button>
              </Link>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4 border-t border-[#E5E7EB] pt-6 pb-8 mb-8">
            <div className="flex items-center gap-4">
              <Mail className="text-[#4F46E5]" size={20} />
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="text-lg font-medium text-[#111827]">
                  {instructor.email}
                </p>
              </div>
            </div>

            {instructor.phone && (
              <div className="flex items-center gap-4">
                <Phone className="text-[#4F46E5]" size={20} />
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <a
                    href={`tel:${instructor.phone}`}
                    className="text-lg font-medium text-[#4F46E5] hover:underline"
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
            <Card className="border-[#E5E7EB] p-6 bg-linear-to-br from-green-50 to-green-100">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Earnings</p>
                  <p className="text-3xl font-bold text-green-700">
                    ₺{totalStats?.totalEarnings?.toFixed(2) || "0.00"}
                  </p>
                  <p className="text-xs text-gray-600 mt-2">
                    {totalStats?.sessionCount || 0} class
                    {totalStats?.sessionCount !== 1 ? "es" : ""}
                  </p>
                </div>
                <DollarSign className="text-green-600" size={28} />
              </div>
            </Card>

            {/* This Month Earnings Card */}
            <Card className="border-[#E5E7EB] p-6 bg-linear-to-br from-blue-50 to-blue-100">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    This Month Earnings
                  </p>
                  <p className="text-3xl font-bold text-blue-700">
                    ₺{stats?.totalEarnings?.toFixed(2) || "0.00"}
                  </p>
                  <p className="text-xs text-gray-600 mt-2">
                    {stats?.earningCount || 0} session
                    {stats?.earningCount !== 1 ? "s" : ""}
                  </p>
                </div>
                <Calendar className="text-blue-600" size={28} />
              </div>
            </Card>

            {/* Attendance Count Card */}
            <Card className="border-[#E5E7EB] p-6 bg-linear-to-br from-purple-50 to-purple-100">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    This Month Sessions
                  </p>
                  <p className="text-3xl font-bold text-purple-700">
                    {stats?.sessionCount || 0}
                  </p>
                  <p className="text-xs text-gray-600 mt-2">
                    {stats?.attendanceCount || 0} students marked
                  </p>
                </div>
                <BookOpen className="text-purple-600" size={28} />
              </div>
            </Card>
          </div>

          {/* Assigned Courses Section */}
          {courses.length > 0 && (
            <div className="border-t border-[#E5E7EB] pt-8">
              <h2 className="text-2xl font-bold text-[#111827] mb-4">
                Assigned Courses ({courses.length})
              </h2>
              <div className="space-y-3">
                {courses.map((course: any) => (
                  <Card
                    key={course.id}
                    className="border-[#E5E7EB] p-4 hover:border-[#4F46E5] transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-[#111827] text-lg">
                          {course.name}
                        </h3>
                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
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
                        <Button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white text-sm ml-4 shrink-0">
                          View
                        </Button>
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {courses.length === 0 && (
            <div className="border-t border-[#E5E7EB] pt-8 text-center text-gray-500">
              <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg">Not assigned to any courses yet</p>
            </div>
          )}

          {/* Attendance History */}
          <InstructorAttendanceHistory
            instructorId={id}
            showCourseInfo={true}
            showInstructors={true}
          />

          {/* Activity Timeline */}
          <div className="mt-12 pt-8 border-t border-[#E5E7EB]">
            <ActivityTimelineWrapper
              entity="instructor"
              entityId={id}
              initialLogs={entityHistory}
              title="Activity Timeline"
              description="All changes and actions related to this instructor"
              showFullPage={false}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import Link from "next/link";
import { ArrowLeft, Users, Check, X, User } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/card";
import { format, isToday, isYesterday, toDate } from "date-fns";
import { tr, enUS } from "date-fns/locale";

interface AttendanceDetailPageProps {
  params: Promise<{
    locale: string;
    sessionId: string;
  }>;
}

export default async function AttendanceDetailPage({
  params,
}: AttendanceDetailPageProps) {
  const { sessionId, locale } = await params;
  const t = await getTranslations();

  const user = await getCurrentUser();
  if (!user) {
    return <div>Not authenticated</div>;
  }

  const supabase = await createServerSupabaseClient();

  // Fetch session details
  const { data: session, error: sessionError } = await (
    supabase.from("course_sessions") as any
  )
    .select(
      `
      id,
      session_date,
      notes,
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
    .eq("id", sessionId)
    .single();

  if (sessionError || !session) {
    return (
      <div className="space-y-6">
        <Link
          href="/dashboard/attendance"
          className="text-primary hover:underline text-sm"
        >
          ← Back
        </Link>
        <p className="text-red-600">Session not found</p>
      </div>
    );
  }

  const attendances = session.attendances || [];
  const presentCount = attendances.filter((a: any) => a.is_present).length;
  const absentCount = attendances.filter((a: any) => !a.is_present).length;

  // ✅ Get session-specific instructors, fallback to course instructors
  let instructors =
    session.session_instructors?.map((si: any) => si.instructor) || [];

  if (instructors.length === 0 && session.course?.id) {
    // Fallback: Get course instructors if session has none
    const query = supabase
      .from("course_instructors")
      .select("instructor:instructors(id, first_name, last_name)")
      .eq("course_id", session.course.id)
      .overrideTypes<{ instructor: any }[]>();

    const { data: courseInstructors } = (await query) as {
      data: { instructor: any }[] | null;
    };

    instructors = (courseInstructors || []).map((ci: any) => ci.instructor);
  }

  const studio = attendances.find((a: any) => a.studio?.name)?.studio;

  // Format date for display
  const sessionDate = new Date(session.session_date + "T00:00:00Z");
  const dateLocale = locale === "tr" ? tr : enUS;
  const formattedDate = (() => {
    if (isToday(sessionDate)) {
      return `${t("common.today")}, ${format(sessionDate, "MMMM d, yyyy", { locale: dateLocale })}`;
    } else if (isYesterday(sessionDate)) {
      return `${t("common.yesterday")}, ${format(sessionDate, "MMMM d, yyyy", { locale: dateLocale })}`;
    }
    return format(sessionDate, "EEEE, MMMM d, yyyy", { locale: dateLocale });
  })();

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/attendance"
        className="text-primary hover:underline text-sm inline-flex items-center gap-1"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("attendance.backToAttendance")}
      </Link>

      <Card className="border-border">
        <div className="p-4 sm:p-6 md:p-8 space-y-4">
          <div>
            <Link
              href={`/${locale}/dashboard/courses/${session.course?.id}`}
              className="text-2xl font-bold text-primary hover:underline block"
            >
              {session.course?.name}
            </Link>
            <p className="text-sm text-muted-foreground mt-1">
              {session.course?.branch?.name}
            </p>
            {studio?.name && (
              <p className="text-sm text-muted-foreground mt-1">
                {t("common.studio")}: {studio.name}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                {t("attendance.date")}
              </p>
              <p className="text-sm font-semibold text-foreground mt-1">
                {formattedDate}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                {t("attendance.present")}
              </p>
              <p className="text-sm font-semibold text-green-600 mt-1 flex items-center gap-1">
                <Check className="w-4 h-4" />
                {presentCount}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                {t("attendance.absent")}
              </p>
              <p className="text-sm font-semibold text-red-600 mt-1 flex items-center gap-1">
                <X className="w-4 h-4" />
                {absentCount}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                {t("common.total")}
              </p>
              <p className="text-sm font-semibold text-foreground mt-1 flex items-center gap-1">
                <Users className="w-4 h-4" />
                {attendances.length}
              </p>
            </div>
          </div>

          {/* Instructors */}
          {instructors.length > 0 && (
            <div className="pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                {t("attendance.instructors")}
              </p>
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

          {/* Lesson Note */}
          {session.notes && (
            <div className="pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                {t("attendance.lessonNote")}
              </p>
              <p className="text-sm text-foreground whitespace-pre-wrap bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                {session.notes}
              </p>
            </div>
          )}

          {/* Attendance Records */}
          <div className="pt-4 border-t border-border space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              {t("attendance.attendanceRecords")}
            </h2>

            {attendances.length === 0 ? (
              <div className="bg-muted/50 rounded-lg p-6 text-center text-muted-foreground">
                {t("attendance.noRecordsForSession")}
              </div>
            ) : (
              <div className="space-y-2">
                {attendances.map((attendance: any) => (
                  <div
                    key={attendance.id}
                    className={`flex items-center gap-4 p-4 rounded-lg border ${
                      attendance.is_present
                        ? "bg-green-50 border-green-200"
                        : "bg-red-50 border-red-200"
                    }`}
                  >
                    <div
                      className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                        attendance.is_present ? "bg-green-200" : "bg-red-200"
                      }`}
                    >
                      {attendance.is_present ? (
                        <Check className="w-5 h-5 text-green-700" />
                      ) : (
                        <X className="w-5 h-5 text-red-700" />
                      )}
                    </div>

                    <div className="flex-1">
                      <Link
                        href={`/${locale}/dashboard/students/${attendance.student?.id}`}
                        className="font-semibold text-primary hover:underline"
                      >
                        {attendance.student?.first_name}{" "}
                        {attendance.student?.last_name}
                      </Link>
                      {attendance.notes && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {attendance.notes}
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-semibold text-muted-foreground">
                        {attendance.is_present
                          ? t("attendance.present")
                          : t("attendance.absent")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

import { getLocale, getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { Link, redirect } from "@/i18n/navigation";
import { getOrganization } from "@/lib/auth/getOrganization";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCourse } from "@/lib/actions/courses.actions";
import { getStudios } from "@/lib/actions/studios.actions";
import {
  getScheduleCourses,
  getSessionsInRange,
} from "@/lib/actions/schedule.actions";
import {
  addDaysToDateString,
  formatDay,
  lastOccurrence,
  parseDateOnly,
  todayInTimeZone,
  weekdayNames,
} from "@/lib/i18n/dates";
import { formatTime } from "@/lib/utils/formatTime";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import {
  AttendanceSheet,
  type SheetStudent,
} from "@/components/attendance/AttendanceSheet";
import { AttendanceDateNav } from "@/components/attendance/AttendanceDateNav";
import { SessionSummary } from "@/components/attendance/SessionSummary";
import { LessonRow } from "@/components/attendance/LessonRow";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  // Old links: ?session=<id>
  if (typeof params.session === "string") {
    redirect({
      href: `/dashboard/attendance/${params.session}`,
      locale: await getLocale(),
    });
  }
  const courseId =
    typeof params.course === "string" ? params.course : undefined;
  const date =
    typeof params.date === "string" && DATE_RE.test(params.date)
      ? params.date
      : undefined;

  return courseId ? (
    <CourseAttendance courseId={courseId} date={date} />
  ) : (
    <AttendanceOverview date={date} />
  );
}

/* ------------------------------------------------------------------ */
/* Overview: today's lessons first, then the rest of the past week     */
/* ------------------------------------------------------------------ */

async function AttendanceOverview({ date: requestedDate }: { date?: string }) {
  const t = await getTranslations();
  const tx = await getTranslations("attendanceSheet");
  const locale = await getLocale();
  const organization = await getOrganization();
  const today = todayInTimeZone(organization?.timezone);
  // Any past day can be opened; the future can't
  const day = requestedDate && requestedDate <= today ? requestedDate : today;
  const isTodayView = day === today;
  const weekAgo = addDaysToDateString(day, -6);

  const [{ data: courses = [] }, { data: sessions = [] }] = await Promise.all([
    getScheduleCourses(),
    getSessionsInRange(weekAgo, day),
  ]);

  if (courses.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("attendance.title")} />
        <EmptyState
          title={t("attendance.noCoursesFound")}
          description={t("attendance.noCoursesMessage")}
          action={
            <Button asChild>
              <Link href="/dashboard/courses/new">
                {t("courses.createCourse")}
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  const takenFor = (courseId: string, d: string) => {
    const s = sessions.find(
      (x) => x.course_id === courseId && x.session_date === d
    );
    return s && s.attendanceCount > 0 ? s : undefined;
  };
  const studentsLabel = (count: number) => tx("studentCount", { count });

  // Lessons on the chosen day
  const dayDow = parseDateOnly(day).getDay();
  const onDay = courses
    .filter((c) => c.day_of_week === dayDow)
    .map((course) => ({
      course,
      date: day,
      session: takenFor(course.id, day),
    }));

  // The six days before it, most recent first
  const earlier = courses
    .filter((c) => c.day_of_week !== dayDow)
    .map((course) => {
      const d = lastOccurrence(course.day_of_week, day);
      return { course, date: d, session: takenFor(course.id, d) };
    })
    .sort((a, b) =>
      a.date === b.date
        ? a.course.start_time.localeCompare(b.course.start_time)
        : b.date.localeCompare(a.date)
    );
  const pendingEarlier = earlier.filter((r) => !r.session).length;

  const lessonDays = [...new Set(courses.map((c) => c.day_of_week))];
  const dayLabel = formatDay(locale, parseDateOnly(day), "long");

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("attendance.title")}
        description={tx("overviewHint")}
        action={<AttendanceDateNav date={day} lessonDays={lessonDays} />}
      />

      <section className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            {isTodayView ? tx("today") : dayLabel}
          </h2>
          {!isTodayView && (
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/attendance">{tx("backToToday")}</Link>
            </Button>
          )}
        </div>
        {onDay.length === 0 ? (
          <Card className="p-6 text-center text-sm text-muted-foreground">
            {isTodayView ? tx("noLessonsToday") : tx("noLessonsOnDay")}
          </Card>
        ) : (
          <Card className="gap-0 divide-y divide-border p-0">
            {onDay.map((r) => (
              <LessonRow
                key={r.course.id}
                {...r}
                takeLabel={tx("take")}
                studentsLabel={studentsLabel(r.course.studentCount)}
              />
            ))}
          </Card>
        )}
      </section>

      {earlier.length > 0 && (
        <section className="space-y-2">
          <h2 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            {isTodayView ? tx("thisWeek") : tx("weekBefore")}
            {pendingEarlier > 0 && (
              <Badge
                variant="secondary"
                className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
              >
                {tx("pendingCount", { count: pendingEarlier })}
              </Badge>
            )}
          </h2>
          <Card className="gap-0 divide-y divide-border p-0">
            {earlier.map((r) => (
              <LessonRow
                key={r.course.id}
                {...r}
                dayLabel={formatDay(locale, parseDateOnly(r.date), "short")}
                takeLabel={tx("take")}
                studentsLabel={studentsLabel(r.course.studentCount)}
              />
            ))}
          </Card>
        </section>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* One course on one day                                               */
/* ------------------------------------------------------------------ */

async function CourseAttendance({
  courseId,
  date: requestedDate,
}: {
  courseId: string;
  date?: string;
}) {
  const t = await getTranslations();
  const locale = await getLocale();
  const organization = await getOrganization();
  const courseResult = await getCourse(courseId);

  if (courseResult.error || !courseResult.data || !organization) {
    return (
      <div className="space-y-4">
        <BackLink label={t("attendance.title")} />
        <p className="text-muted-foreground">
          {t("attendancePage.courseNotFound")}
        </p>
      </div>
    );
  }

  const course = courseResult.data;
  const today = todayInTimeZone(organization.timezone);
  const date = requestedDate ?? lastOccurrence(course.day_of_week, today);
  const supabase = await createServerSupabaseClient();

  const [{ data: sessions }, studiosResult] = await Promise.all([
    supabase
      .from("course_sessions")
      .select("id, session_date, attendances(count)")
      .eq("course_id", courseId)
      .order("session_date", { ascending: false }),
    getStudios(course.branch_id),
  ]);

  const takenSessions = (sessions ?? []).filter(
    (s) => (s.attendances?.[0]?.count ?? 0) > 0
  );
  const takenSession = takenSessions.find((s) => s.session_date === date);
  const DAYS = weekdayNames(locale);

  const header = (
    <div className="space-y-4">
      <BackLink label={t("attendance.title")} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">
            {course.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {[
              course.branches?.name,
              course.dance_types?.name,
              `${DAYS[course.day_of_week]} ${formatTime(course.start_time)}–${formatTime(course.end_time)}`,
            ]
              .filter(Boolean)
              .join(" • ")}
          </p>
        </div>
        <AttendanceDateNav
          courseId={courseId}
          date={date}
          lessonDays={[course.day_of_week]}
          takenDates={takenSessions.map((s) => s.session_date)}
        />
      </div>
    </div>
  );

  if (date > today) {
    return (
      <div className="space-y-6">
        {header}
        <Card className="p-6 text-center text-sm text-muted-foreground">
          {t("attendanceSheet.futureLesson")}
        </Card>
      </div>
    );
  }

  if (takenSession) {
    return (
      <div className="space-y-6">
        {header}
        <SessionSummary sessionId={takenSession.id} />
      </div>
    );
  }

  // Enrolled students with their usable credits for this dance type on this day
  const [{ data: enrolled }, { data: orgInstructors }, { data: rates }] =
    await Promise.all([
      supabase
        .from("course_students")
        .select(
          "students(id, first_name, last_name, deleted_at, is_active, student_packages(id, remaining_credits, expire_date, purchase_date, packages(dance_type_id)))"
        )
        .eq("course_id", courseId),
      supabase
        .from("instructors")
        .select("id, first_name, last_name")
        .eq("organization_id", organization.id)
        .is("deleted_at", null)
        .order("first_name"),
      supabase
        .from("instructor_rates")
        .select("instructor_id, dance_type_id, ratio_per_class")
        .eq("dance_type_id", course.dance_type_id)
        .eq("branch_id", course.branch_id),
    ]);

  const students: SheetStudent[] = (enrolled ?? [])
    .map((cs) => cs.students)
    // Passive students are left out of the sheet (their enrolment is kept)
    .filter((s): s is NonNullable<typeof s> => s !== null && !s.deleted_at && s.is_active)
    .map((s) => {
      // Usable packages: this dance type, credits left, not expired on the lesson day.
      // The credit comes from the package that expires (or was bought) first.
      const usable = (s.student_packages ?? [])
        .filter(
          (p) =>
            p.packages?.dance_type_id === course.dance_type_id &&
            p.remaining_credits > 0 &&
            (!p.expire_date || p.expire_date.slice(0, 10) >= date)
        )
        .sort(
          (a, b) =>
            (a.expire_date ?? "9999").localeCompare(b.expire_date ?? "9999") ||
            a.purchase_date.localeCompare(b.purchase_date)
        );
      return {
        id: s.id,
        first_name: s.first_name,
        last_name: s.last_name,
        credits: usable.reduce((sum, p) => sum + p.remaining_credits, 0),
        packageId: usable[0]?.id ?? null,
      };
    })
    .sort((a, b) =>
      `${a.first_name} ${a.last_name}`.localeCompare(
        `${b.first_name} ${b.last_name}`,
        locale
      )
    );

  const courseInstructors = (course.course_instructors ?? [])
    .map((ci) => ci.instructors)
    .filter((i): i is NonNullable<typeof i> => !!i);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {header}
      <AttendanceSheet
        key={date}
        courseId={courseId}
        danceTypeId={course.dance_type_id}
        date={date}
        students={students}
        studios={studiosResult.data ?? []}
        instructors={courseInstructors}
        allInstructors={orgInstructors ?? []}
        instructorRates={rates ?? []}
      />
    </div>
  );
}

function BackLink({ label }: { label: string }) {
  return (
    <Link
      href="/dashboard/attendance"
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-4" /> {label}
    </Link>
  );
}

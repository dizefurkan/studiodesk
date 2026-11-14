"use client";

import { Link } from '@/i18n/navigation'
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { ChevronDown, BookOpen } from "lucide-react";
import { isToday, isYesterday } from "date-fns";
import { useLocale, useTranslations } from "next-intl";
import { formatDay, parseDateOnly } from "@/lib/i18n/dates";
import type { getCourseAttendanceHistory } from '@/lib/actions/course-attendance.actions'
import type { ActionData } from '@/lib/types/actions'

interface AttendanceHistorySectionProps {
  attendanceHistory: ActionData<typeof getCourseAttendanceHistory>;
}

export function AttendanceHistorySection({
  attendanceHistory,
}: AttendanceHistorySectionProps) {
  const t = useTranslations();
  const tHist = useTranslations("attendanceHistory");
  const locale = useLocale();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (attendanceHistory.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">
          {t("courses.attendanceHistory")}
        </h2>
        <Card className="border-border p-12 text-center">
          <div className="text-muted-foreground">
            <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg">{t("courses.noAttendanceRecords")}</p>
            <p className="text-sm mt-1">
              {t("courses.startMarkingAttendance")}
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <h2 className="text-2xl font-bold text-foreground">
        {t("courses.attendanceHistory")}
      </h2>

      <div className="space-y-2">
        {attendanceHistory.map((record) => {
          const isExpanded = expandedId === record.id;

          return (
            <Card
              key={record.id}
              className="border-border overflow-hidden hover:shadow-md transition-all duration-200 py-0"
            >
              {/* Summary - Single Line */}
              <div
                onClick={() => setExpandedId(isExpanded ? null : record.id)}
                className="flex items-center justify-between gap-1.5 p-2.5 sm:p-3 hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="flex-1 flex items-center justify-between gap-1.5 text-left">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                      <p className="font-semibold text-foreground">
                        {(() => {
                          const date = parseDateOnly(record.session_date);
                          const label = formatDay(locale, date, "short");
                          if (isToday(date)) return tHist('today', { date: label });
                          if (isYesterday(date)) return tHist('yesterday', { date: label });
                          return label;
                        })()}
                      </p>
                      {record.attendances?.length > 0 &&
                        record.attendances[0]?.studios?.name && (
                          <>
                            <span className="text-muted-foreground/70">•</span>
                            <span className="text-muted-foreground truncate">
                              {record.attendances[0].studios.name}
                            </span>
                          </>
                        )}
                    </div>
                  </div>

                  {/* Attendance Badge & Expand Icon */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs font-semibold text-green-700 bg-green-50 px-1.5 py-0.5 rounded-lg border border-green-200 whitespace-nowrap">
                      {record.attendance_count}/
                      {record.attendances?.length || 0}
                    </span>
                    <ChevronDown
                      size={18}
                      className={`text-muted-foreground/70 transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </div>

                {/* View Details Button */}
                <Link
                  href={`/dashboard/attendance/${record.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-shrink-0 px-2 py-1 text-xs font-medium text-primary hover:text-primary/90 hover:bg-blue-50 rounded-md transition-colors"
                >
                  {t("common.viewDetails")}
                </Link>
              </div>

              {/* Expandable Details */}
              {isExpanded && (
                <div className="border-t border-border bg-gradient-to-b from-white to-muted/50 p-2.5 sm:p-3 animate-in fade-in duration-200">
                  <div className="space-y-1.5">
                    {/* Instructor Info */}
                    {record.instructors && record.instructors.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                          {t("common.instructor")}
                        </p>
                        <p className="text-sm text-foreground/80">
                          {record.instructors
                            .map((i) => `${i.first_name} ${i.last_name}`)
                            .join(", ")}
                        </p>
                      </div>
                    )}

                    {/* Attendees List */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        {t("common.attendees")} (
                        {record.attendances?.length || 0})
                      </p>

                      <div className="space-y-0.5 max-h-48 overflow-y-auto pr-1">
                        {record.attendances && record.attendances.length > 0 ? (
                          record.attendances.map((att, idx: number) => (
                            <div
                              key={idx}
                              className="flex items-center gap-1.5 px-1 rounded text-xs"
                            >
                              <span
                                className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                                  att.is_present
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {att.is_present ? "✓" : "✗"}
                              </span>
                              <Link
                                href={`/dashboard/students/${att.student.id}`}
                                className="text-primary hover:underline font-medium flex-1"
                              >
                                {att.student.first_name} {att.student.last_name}
                              </Link>
                              {att.notes && (
                                <span className="text-muted-foreground text-xs">
                                  {att.notes}
                                </span>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            {t("attendance.noAttendance")}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

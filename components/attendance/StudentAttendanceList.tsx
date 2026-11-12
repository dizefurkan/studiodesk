"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Trash2, Save, AlertCircle, Calendar, Search } from "lucide-react";
import {
  recordBatchAttendance,
  removeAttendance,
} from "@/lib/actions/attendance.actions";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { InstructorSelector } from "./InstructorSelector";
import { InstructorDropdown } from "./InstructorDropdown";
import { StudioDropdown } from "./StudioDropdown";
import { useConfirm } from '@/components/common/ConfirmProvider'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'

interface StudentForAttendance {
  id: string;
  first_name: string;
  last_name: string;
  student_packages?: Array<{
    id: string;
    remaining_credits: number;
  }>;
}

interface AttendanceRecord {
  id: string;
  student_id: string;
  student_package_id: string;
  is_present?: boolean;
  notes?: string | null;
  students?: {
    first_name: string | null;
    last_name: string | null;
  };
  student_packages?: {
    remaining_credits: number;
  } | null;
}

interface AttendanceHistoryRecord {
  id: string;
  session_date: string;
  attendance_count: number;
}

interface Studio {
  id: string;
  name: string;
  capacity?: number;
}

interface StudentAttendanceListProps {
  sessionId: string;
  courseId: string;
  danceTypeId: string;
  availableStudents: StudentForAttendance[];
  recordedAttendances: AttendanceRecord[];
  attendanceHistory?: AttendanceHistoryRecord[];
  loading?: boolean;
  studios?: Studio[];
  instructors?: Array<{ id: string; first_name: string; last_name: string }>;
  allInstructors?: Array<{ id: string; first_name: string; last_name: string }>;
  instructorRates?: Array<{
    instructor_id: string;
    dance_type_id: string;
    ratio_per_class: number;
  }>;
  selectedDate?: string;
  onDateChange?: (date: string) => void;
}

type AttendanceStatus = "geldi" | "gelmedi" | "none";

interface AttendanceState {
  studentId: string;
  status: AttendanceStatus;
  existingAttendanceId?: string;
  notes: string;
  deductCredits: boolean; // New: Controls whether to deduct credits
}

export function StudentAttendanceList({
  sessionId,
  courseId,
  danceTypeId,
  availableStudents,
  recordedAttendances,
  attendanceHistory = [],
  loading,
  studios = [],
  instructors = [],
  allInstructors = [],
  instructorRates = [],
  selectedDate: propSelectedDate,
  onDateChange,
}: StudentAttendanceListProps) {
  const router = useRouter();
  const t = useTranslations();
  const [attendanceState, setAttendanceState] = useState<AttendanceState[]>([]);
  const [savingBatch, setSavingBatch] = useState(false);
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [selectedStudioId, setSelectedStudioId] = useState<string | null>(null);
  const [instructorOverrides, setInstructorOverrides] = useState<
    Record<string, string>
  >({});
  const [editingInstructorId, setEditingInstructorId] = useState<string | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [checkedStudentIds, setCheckedStudentIds] = useState<Set<string>>(
    new Set()
  );
  const [showInstructorSelector, setShowInstructorSelector] = useState(false);
  const [sessionNote, setSessionNote] = useState<string>("");
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState<string>(
    propSelectedDate || today
  );

  // Sync propSelectedDate changes to local state
  useEffect(() => {
    if (propSelectedDate) {
      setSelectedDate(propSelectedDate);
    }
  }, [propSelectedDate]);

  // Helper: format date display (Today or X days after DATE DAYNAME)
  const formatDateDisplay = (date: string) => {
    if (date === today) return "Today";

    const selected = new Date(date);
    const todayDate = new Date(today);
    const diffTime = Math.abs(selected.getTime() - todayDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const dayName = selected.toLocaleString("en-US", { weekday: "long" });
    const formattedDate = selected.toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    return `${diffDays} days after ${formattedDate} ${dayName}`;
  };

  // Filter attendance history to last 30 days
  const lastMonthAttendances = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

    return (attendanceHistory || []).filter(
      (a) => a.session_date >= thirtyDaysAgoStr
    );
  }, [attendanceHistory]);

  // Create a map of recorded attendances for quick lookup
  const recordedMap = useMemo(
    () => new Map(recordedAttendances.map((a) => [a.student_id, a])),
    [recordedAttendances]
  );

  // Get remaining credits for a student for this specific dance type
  const getStudentCredits = (
    studentPackages?: StudentForAttendance["student_packages"]
  ) => {
    if (!studentPackages || studentPackages.length === 0) return 0;
    return studentPackages.reduce(
      (sum, pkg) => sum + (pkg.remaining_credits || 0),
      0
    );
  };

  // Separate students: with credits vs needing renewal
  const studentsWithCredits = useMemo(() => {
    const filtered = availableStudents.filter(
      (s) =>
        s.student_packages &&
        s.student_packages.some((sp) => sp.remaining_credits > 0)
    );

    // Apply search filter
    if (!searchQuery.trim()) return filtered;

    const query = searchQuery.toLowerCase();
    return filtered.filter(
      (s) =>
        `${s.first_name} ${s.last_name}`.toLowerCase().includes(query) ||
        s.first_name.toLowerCase().includes(query) ||
        s.last_name.toLowerCase().includes(query)
    );
  }, [availableStudents, searchQuery]);

  const studentsNeedingRenewal = useMemo(
    () =>
      availableStudents.filter(
        (s) =>
          !s.student_packages ||
          s.student_packages.every((sp) => sp.remaining_credits === 0)
      ),
    [availableStudents]
  );

  // Initialize checked students on first load
  useMemo(() => {
    if (checkedStudentIds.size === 0 && studentsWithCredits.length > 0) {
      setCheckedStudentIds(new Set(studentsWithCredits.map((s) => s.id)));
    }
  }, [studentsWithCredits]);

  const handleStatusChange = (
    studentId: string,
    newStatus: AttendanceStatus
  ) => {
    console.log(
      `[StudentAttendanceList] handleStatusChange: ${studentId} -> ${newStatus}`
    );
    setAttendanceState((prev) => {
      // If the row is checked, apply to all checked students
      // Otherwise, apply only to this specific student
      const isRowChecked = checkedStudentIds.has(studentId);
      const studentsToUpdate = isRowChecked
        ? Array.from(checkedStudentIds)
        : [studentId];

      let updated = [...prev];

      studentsToUpdate.forEach((id) => {
        const existingIndex = updated.findIndex((a) => a.studentId === id);

        if (existingIndex >= 0) {
          // Update existing - don't toggle, only set if different
          // Radio button behavior: geldi OR gelmedi, not toggle
          if (updated[existingIndex].status !== newStatus) {
            updated[existingIndex] = {
              ...updated[existingIndex],
              status: newStatus,
            };
          }
          // If same status, keep it (don't deselect)
        } else {
          // Add new entry
          updated.push({
            studentId: id,
            status: newStatus,
            notes: "",
            deductCredits: true,
          });
        }
      });

      console.log(
        `[StudentAttendanceList] Applied ${newStatus} to ${studentsToUpdate.length} students`
      );
      return updated;
    });
    setError("");
    setSuccessMessage("");
  };

  const handleNotesChange = (studentId: string, notes: string) => {
    // If the row is checked, apply to all checked students
    // Otherwise, apply only to this specific student
    setAttendanceState((prev) => {
      const isRowChecked = checkedStudentIds.has(studentId);
      const studentsToUpdate = isRowChecked
        ? Array.from(checkedStudentIds)
        : [studentId];

      let updated = [...prev];

      studentsToUpdate.forEach((id) => {
        const existingIndex = updated.findIndex((a) => a.studentId === id);
        if (existingIndex >= 0) {
          updated[existingIndex] = { ...updated[existingIndex], notes };
        } else {
          updated.push({
            studentId: id,
            status: "none",
            notes,
            deductCredits: true,
          });
        }
      });

      return updated;
    });
  };

  const handleDeductCreditsChange = (
    studentId: string,
    deductCredits: boolean
  ) => {
    // If the row is checked, apply to all checked students
    // Otherwise, apply only to this specific student
    setAttendanceState((prev) => {
      const isRowChecked = checkedStudentIds.has(studentId);
      const studentsToUpdate = isRowChecked
        ? Array.from(checkedStudentIds)
        : [studentId];

      let updated = [...prev];

      studentsToUpdate.forEach((id) => {
        const existingIndex = updated.findIndex((a) => a.studentId === id);
        if (existingIndex >= 0) {
          updated[existingIndex] = { ...updated[existingIndex], deductCredits };
        } else {
          updated.push({
            studentId: id,
            status: "none",
            notes: "",
            deductCredits,
          });
        }
      });

      return updated;
    });
  };

  // Checkbox handlers
  const handleToggleStudent = (studentId: string) => {
    setCheckedStudentIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };

  const handleToggleMasterCheckbox = () => {
    if (checkedStudentIds.size === studentsWithCredits.length) {
      // All checked, uncheck all
      setCheckedStudentIds(new Set());
    } else {
      // Not all checked, check all
      setCheckedStudentIds(new Set(studentsWithCredits.map((s) => s.id)));
    }
  };

  const handleSaveAttendance = async () => {
    console.log(
      "[StudentAttendanceList] Save button clicked, attendanceState:",
      attendanceState
    );
    setError("");
    setSuccessMessage("");

    // Verify that ALL students with credits have been marked (status is required)
    const unmarkedStudents = studentsWithCredits.filter((student) => {
      const record = attendanceState.find((a) => a.studentId === student.id);
      return !record || record.status === "none";
    });

    if (unmarkedStudents.length > 0) {
      const names = unmarkedStudents
        .map((s) => `${s.first_name} ${s.last_name}`)
        .join(", ");
      setError(`All students must be marked. Not marked: ${names}`);
      return;
    }

    // Include all marked records (both geldi and gelmedi)
    const allRecordsToSave = attendanceState.filter((a) => a.status !== "none");

    const presentRecords = allRecordsToSave.filter((a) => a.status === "geldi");
    const absentRecords = allRecordsToSave.filter(
      (a) => a.status === "gelmedi"
    );

    console.log("[StudentAttendanceList] Present records:", presentRecords);
    console.log("[StudentAttendanceList] Absent records:", absentRecords);
    console.log(
      "[StudentAttendanceList] Total records to save:",
      allRecordsToSave.length
    );

    setSavingBatch(true);
    console.log("[StudentAttendanceList] Starting batch save...");

    try {
      const batchData = allRecordsToSave.map((record) => {
        const student = availableStudents.find(
          (s) => s.id === record.studentId
        );
        const activePackage = student?.student_packages?.find(
          (sp) => sp.remaining_credits > 0
        );
        const studentPackageId = activePackage?.id || "";
        const deductCredits = record.deductCredits !== false; // Default to true
        console.log(
          `[StudentAttendanceList] Preparing batch for ${record.studentId}, packageId: ${studentPackageId}, status: ${record.status}, deductCredits: ${deductCredits}`
        );

        return {
          studentId: record.studentId,
          studentPackageId,
          status: record.status,
          notes: record.notes || undefined,
          deductCredits, // Pass this to server action
        };
      });

      // Build instructor IDs: use overrides if set, otherwise use original course instructors
      const instructorIds = instructors.map(
        (instructor) => instructorOverrides[instructor.id] || instructor.id
      );

      console.log(
        "[StudentAttendanceList] Calling recordBatchAttendance with:",
        {
          courseId,
          sessionId,
          batchData,
          studioId: selectedStudioId,
          instructorIds,
          date: selectedDate,
          sessionNote,
        }
      );
      const result = await recordBatchAttendance(
        courseId,
        sessionId,
        batchData,
        selectedStudioId,
        instructorIds,
        selectedDate,
        sessionNote || null
      );
      console.log(
        "[StudentAttendanceList] recordBatchAttendance result:",
        result
      );

      if (result.error) {
        console.log(
          "[StudentAttendanceList] Error from recordBatchAttendance:",
          result.error
        );
        setError(result.error);
      } else if (result.success && result.data) {
        console.log(
          "[StudentAttendanceList] Success! Recorded:",
          result.data.recordedCount
        );
        const presentCount = presentRecords.length;
        const absentCount = absentRecords.length;
        let message = "✅ Attendance saved! ";
        if (presentCount > 0) {
          message +=
            t("attendance.presentMarked", { count: presentCount }) + " ";
        }
        if (absentCount > 0) {
          message += t("attendance.absentMarked", { count: absentCount });
        }
        setSuccessMessage(message);
        setAttendanceState([]);

        // Navigate to attendance details page
        const sessionId = result.data?.sessionId;
        if (sessionId) {
          setTimeout(() => {
            router.push(`/dashboard/attendance/${sessionId}`);
          }, 1500);
        } else {
          // Fallback to page reload if sessionId not returned
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        }
      }
    } catch (err) {
      console.error("[StudentAttendanceList] Unexpected error:", err);
      setError("Failed to save attendance");
    } finally {
      setSavingBatch(false);
    }
  };

  const confirm = useConfirm()

  const handleRemoveAttendance = async (
    attendanceId: string,
    studentPackageId: string
  ) => {
    if (!(await confirm({ title: t("common.deleteConfirm"), destructive: true }))) return;

    setError("");

    try {
      const result = await removeAttendance(attendanceId, studentPackageId);

      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    } catch (err) {
      setError("Failed to remove attendance");
    }
  };

  const totalStudents = availableStudents.length;
  const markedCount = recordedAttendances.length;

  // Count all marked records (both present and absent)
  const pendingPresent = attendanceState.filter(
    (a) => a.status === "geldi"
  ).length;
  const pendingAbsent = attendanceState.filter(
    (a) => a.status === "gelmedi"
  ).length;
  const totalPendingRecords = pendingPresent + pendingAbsent;

  // Debug render
  console.log("[StudentAttendanceList] Render state:", {
    studentsWithCredits: studentsWithCredits.length,
    pendingPresent,
    pendingAbsent,
    attendanceState,
    availableStudents: availableStudents.length,
    recordedAttendances: recordedAttendances.length,
  });

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="text-red-600 mt-0.5" size={20} />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">{successMessage}</p>
        </div>
      )}

      {/* Students with Credits Section - Table Format */}
      {studentsWithCredits.length > 0 && (
        <div className="space-y-4">
          {/* Calendar Heat Map - Last 30 days */}
          {lastMonthAttendances.length > 0 && (
            <Card className="border-border p-4 bg-blue-50">
              <div className="flex items-start gap-3 mb-3">
                <Calendar className="text-primary mt-0.5" size={18} />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Attendance History (Last 30 days)
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("attendance.sessionsRecorded", {
                      count: lastMonthAttendances.length,
                    })}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {lastMonthAttendances.map((record, idx) => (
                  <Button size="xs" variant={selectedDate === record.session_date ? "default" : "outline"}
                    key={`attendance-${record.session_date}-${idx}`}
                    onClick={() => {
                      setSelectedDate(record.session_date);
                      onDateChange?.(record.session_date);
                    }}
                    title={t("attendance.attendanceCount", {
                      count: record.attendance_count,
                    })}
                  >
                    {new Date(record.session_date).toLocaleDateString("tr-TR", {
                      day: "2-digit",
                      month: "2-digit",
                    })}
                  </Button>
                ))}
              </div>
            </Card>
          )}

          <h3 className="text-lg font-semibold text-foreground">
            {t("attendance.markAttendance")} ({studentsWithCredits.length}{" "}
            {t("attendance.enrolled")})
          </h3>

          {/* Studio & Instructor Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {studios && studios.length > 0 && (
              <div>
                <Label className="block mb-2">
                  {t("attendance.studioOptional")}
                </Label>
                <StudioDropdown
                  studios={studios}
                  selectedStudioId={selectedStudioId}
                  onSelect={setSelectedStudioId}
                />
              </div>
            )}

            {instructors && instructors.length > 0 && (
              <div>
                <Label className="block mb-2">
                  Instructors
                </Label>
                <div className="flex gap-2 flex-wrap">
                  {instructors.map((instructor) => {
                    const replacement = instructorOverrides[instructor.id];
                    const isOverridden = !!replacement;
                    const replacementInstructor = isOverridden
                      ? allInstructors.find((i) => i.id === replacement)
                      : undefined;

                    return (
                      <div key={instructor.id} className="">
                        <InstructorDropdown
                          instructor={instructor}
                          replacementInstructor={replacementInstructor}
                          isOverridden={isOverridden}
                          onReplaceClick={() => {
                            setEditingInstructorId(instructor.id);
                            setShowInstructorSelector(true);
                          }}
                          onClearOverride={() => {
                            setInstructorOverrides((prev) => {
                              const newOverrides = { ...prev };
                              delete newOverrides[instructor.id];
                              return newOverrides;
                            });
                          }}
                        />
                        {isOverridden && (
                          <div className="text-xs text-muted-foreground mt-1.5 ml-0.5">
                            Original: {instructor.first_name}{" "}
                            {instructor.last_name}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {showInstructorSelector && editingInstructorId && (
            <InstructorSelector
              instructors={instructors}
              allInstructors={allInstructors}
              instructorRates={instructorRates}
              danceTypeId={danceTypeId}
              editingInstructorId={editingInstructorId}
              selectedReplacementId={instructorOverrides[editingInstructorId]}
              instructorOverrides={instructorOverrides}
              onSave={(replacementId: string) => {
                setInstructorOverrides((prev) => ({
                  ...prev,
                  [editingInstructorId]: replacementId,
                }));
                setShowInstructorSelector(false);
                setEditingInstructorId(null);
              }}
              onClose={() => {
                setShowInstructorSelector(false);
                setEditingInstructorId(null);
              }}
            />
          )}

          {/* Search Input */}
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground/70"
              size={18}
            />
            <Input
              type="text"
              placeholder="Search students by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="overflow-x-auto border border-border rounded-lg">
            <Table className="w-full border-collapse">
              <TableHeader className="bg-muted/50 sticky top-0 border-b border-border">
                <TableRow>
                  <TableHead className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                    <Checkbox onCheckedChange={handleToggleMasterCheckbox}
                      checked={
                        checkedStudentIds.size === studentsWithCredits.length &&
                        studentsWithCredits.length > 0
                      }
                      title={
                        checkedStudentIds.size === studentsWithCredits.length
                          ? "Uncheck all"
                          : "Check all"
                      }
                    />
                  </TableHead>
                  <TableHead className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                    {t("table.studentName")}
                  </TableHead>
                  <TableHead className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                    {t("table.credits")}
                  </TableHead>
                  <TableHead className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                    {t("table.status")}
                  </TableHead>
                  <TableHead className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                    {t("table.deductCredits")}
                  </TableHead>
                  <TableHead className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                    {t("table.notes")}
                  </TableHead>
                  <TableHead className="px-4 py-3 text-right text-sm font-semibold text-foreground">
                    {t("table.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border">
                {studentsWithCredits.map((student) => {
                  const creditsCount = getStudentCredits(
                    student.student_packages
                  );
                  const currentState = attendanceState.find(
                    (a) => a.studentId === student.id
                  );
                  const recordedAttendance = recordedMap.get(student.id);
                  const isMarked = !!recordedAttendance;

                  return (
                    <TableRow
                      key={student.id}
                      className={`hover:bg-muted/50 transition-colors ${
                        isMarked ? "bg-green-50" : ""
                      }`}
                    >
                      <TableCell className="px-4 py-3 text-center">
                        <Checkbox onCheckedChange={() => handleToggleStudent(student.id)}
                          checked={checkedStudentIds.has(student.id)}
                        />
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm font-medium text-foreground">
                        {student.first_name} {student.last_name}
                        {isMarked && (
                          <span className="ml-2 text-xs font-semibold text-green-700">
                            ✓
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm">
                        <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                          {creditsCount}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm">
                        <div className="flex gap-2">
                          <Button size="xs" variant={currentState?.status === "geldi" || (isMarked && !currentState && recordedAttendance?.is_present) ? "default" : "secondary"} className={currentState?.status === "geldi" || (isMarked && !currentState && recordedAttendance?.is_present) ? "bg-green-600 text-white hover:bg-green-600/90" : undefined}
                            onClick={() =>
                              handleStatusChange(student.id, "geldi")
                            }
                          >
                            ✓ Geldi
                          </Button>
                          <Button size="xs" variant={currentState?.status === "gelmedi" || (isMarked && !currentState && !recordedAttendance?.is_present) ? "destructive" : "secondary"} className={currentState?.status === "gelmedi" || (isMarked && !currentState && !recordedAttendance?.is_present) ? "bg-red-600 text-white hover:bg-red-600/90" : undefined}
                            onClick={() =>
                              handleStatusChange(student.id, "gelmedi")
                            }
                          >
                            ✗ Gelmedi
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm">
                        {(currentState?.status === "geldi" ||
                          currentState?.status === "gelmedi" ||
                          (isMarked && recordedAttendance?.notes)) && (
                          <Label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox onCheckedChange={(c) => handleDeductCreditsChange(student.id, c === true)}
                              checked={currentState?.deductCredits ?? true}
                              title="Kredi düşsün mü?"
                            />
                            <span className="text-xs text-muted-foreground">Evet</span>
                          </Label>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm">
                        {(currentState?.status === "geldi" ||
                          currentState?.status === "gelmedi" ||
                          (isMarked && recordedAttendance?.notes)) && (
                          <Input
                            placeholder="Note"
                            value={
                              currentState?.notes ||
                              recordedAttendance?.notes ||
                              ""
                            }
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>
                            ) => handleNotesChange(student.id, e.target.value)}
                            className="text-xs py-1 px-2"
                          />
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right text-sm">
                        {isMarked && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleRemoveAttendance(
                                recordedAttendance.id,
                                recordedAttendance.student_package_id
                              )
                            }
                            className="text-red-600 hover:bg-red-100"
                          >
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Students Needing Package Renewal */}
      {studentsNeedingRenewal.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">
            ⚠️ Package Renewal Needed ({studentsNeedingRenewal.length})
          </h3>
          <div className="space-y-2">
            {studentsNeedingRenewal.map((student) => (
              <Card
                key={student.id}
                className="border-orange-200 bg-orange-50 p-4"
              >
                <div className="flex items-center gap-3">
                  <AlertCircle className="text-orange-600" size={20} />
                  <div>
                    <p className="font-medium text-foreground">
                      {student.first_name} {student.last_name}
                    </p>
                    <p className="text-xs text-orange-700 font-medium">
                      Credits: 0 - Package renewal required
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {availableStudents.length === 0 && recordedAttendances.length === 0 && (
        <Card className="border-border p-12 text-center">
          <p className="text-muted-foreground">
            No students available for this session
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Students must be enrolled in this course to attend sessions
          </p>
        </Card>
      )}

      {/* Studio Selection, Instructor Selection & Save Button */}
      {studentsWithCredits.length > 0 && totalPendingRecords > 0 && (
        <div className="space-y-4">
          {/* Save Button */}
          <Button
            onClick={handleSaveAttendance}
            disabled={savingBatch}
            className="w-full gap-2 py-2.5"
            size="lg"
          >
            <Save size={18} />
            {savingBatch
              ? "Saving..."
              : `Save Attendance (${totalPendingRecords} record${totalPendingRecords !== 1 ? "s" : ""})`}
          </Button>
        </div>
      )}
    </div>
  );
}

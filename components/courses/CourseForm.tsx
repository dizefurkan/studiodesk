"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useLocaleNames } from "@/hooks/useLocaleNames";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  createCourse,
  updateCourse,
  checkDuplicateCourseTime,
} from "@/lib/actions/courses.actions";
import { getBranches } from "@/lib/actions/branches.actions";
import { getDanceTypes } from "@/lib/actions/dance-types.actions";
import { getInstructorsForDanceType } from "@/lib/actions/instructors.actions";
import { InstructorSelectionModal } from "./InstructorSelectionModal";
import { formatTime } from "@/lib/utils/formatTime";
import type { Database } from "@/lib/types/database.types";
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item";

type Course = Database["public"]["Tables"]["courses"]["Row"];
type Branch = Database["public"]["Tables"]["branches"]["Row"];
type DanceType = Database["public"]["Tables"]["dance_types"]["Row"];
type Instructor = Database["public"]["Tables"]["instructors"]["Row"];

const makeCourseSchema = (tx: (key: string) => string) => z.object({
  name: z.string().min(2, tx('nameMin')),
  branchId: z.string().min(1, tx('branchRequired')),
  danceTypeId: z.string().min(1, tx('danceTypeRequired')),
  dayOfWeek: z.coerce.number().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, tx('timeFormat')),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, tx('timeFormat')),
  instructorIds: z.array(z.string()).optional(),
});

type CourseFormValues = z.infer<ReturnType<typeof makeCourseSchema>>;

interface CourseFormProps {
  course?: Course & { course_instructors?: { instructor_id: string }[] };
}

interface InstructorWithRates {
  id: string;
  first_name: string;
  last_name: string;
  instructor_rates?: Array<{
    id: string;
    ratio_per_class: number;
    branch_id: string;
    dance_type_id: string;
  }>;
}

export function CourseForm({ course }: CourseFormProps) {
  const tx = useTranslations('courseForm')
  const tf = useTranslations('forms')
  const { DAYS } = useLocaleNames()
  const router = useRouter();
  const t = useTranslations();
  const [isLoading, setIsLoading] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [danceTypes, setDanceTypes] = useState<DanceType[]>([]);
  const [instructors, setInstructors] = useState<InstructorWithRates[]>([]);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [loadingInstructors, setLoadingInstructors] = useState(false);
  const [coursesOnDay, setCoursesOnDay] = useState<Course[] | null>(null);
  const [showCoursesModal, setShowCoursesModal] = useState(false);
  const [loadingCoursesOnDay, setLoadingCoursesOnDay] = useState(false);
  const [showInstructorModal, setShowInstructorModal] = useState(false);

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(makeCourseSchema(tx)),
    defaultValues: {
      name: course?.name || "",
      branchId: course?.branch_id || "",
      danceTypeId: course?.dance_type_id || "",
      dayOfWeek: course?.day_of_week || 0,
      startTime: formatTime(course?.start_time) || "",
      endTime: formatTime(course?.end_time) || "",
      instructorIds:
        course?.course_instructors?.map((ci) => ci.instructor_id) || [],
    },
  });

  const danceTypeId = useWatch({ control: form.control, name: "danceTypeId" });
  const branchId = useWatch({ control: form.control, name: "branchId" });
  const dayOfWeek = useWatch({ control: form.control, name: "dayOfWeek" });
  const instructorIds =
    useWatch({ control: form.control, name: "instructorIds" }) || [];

  useEffect(() => {
    async function loadData() {
      const [branchesResult, danceTypesResult] = await Promise.all([
        getBranches(),
        getDanceTypes(),
      ]);

      setBranches(branchesResult.data || []);
      setDanceTypes(danceTypesResult.data || []);
      setInstructors([]); // Clear instructors until dance type is selected
    }

    loadData();
  }, []);

  // Watch for danceTypeId changes and fetch instructors accordingly
  useEffect(() => {
    if (!danceTypeId) {
      setInstructors([]);
      setLoadingInstructors(false);
      setGeneralError(null);
      return;
    }

    // Ignore a response that arrives after the dance type changed again
    let cancelled = false;

    async function loadInstructorsForDanceType() {
      setLoadingInstructors(true);
      try {
        const result = await getInstructorsForDanceType(danceTypeId);
        if (cancelled) return;
        if (result.error) {
          console.error("[Instructors] Backend error:", result.error);
          setGeneralError(tx('loadInstructorsError', { error: result.error }));
          setInstructors([]);
        } else {
          setInstructors(result.data || []);
        }
      } catch (error) {
        if (cancelled) return;
        console.error("[Instructors] Exception:", error);
        setGeneralError(tx('loadInstructorsFailed'));
        setInstructors([]);
      } finally {
        if (!cancelled) setLoadingInstructors(false);
      }
    }

    loadInstructorsForDanceType();
    return () => {
      cancelled = true;
    };
  }, [danceTypeId]);

  // Load courses on selected day (only when creating a new course)
  useEffect(() => {
    if (course) return; // Skip check when editing

    let cancelled = false;

    const loadCoursesOnDay = async () => {
      if (!branchId || !danceTypeId) {
        setCoursesOnDay(null);
        return;
      }

      setLoadingCoursesOnDay(true);
      const result = await checkDuplicateCourseTime(
        branchId,
        danceTypeId,
        dayOfWeek
      );
      if (cancelled) return;
      setLoadingCoursesOnDay(false);

      if (result.data && result.data.length > 0) {
        setCoursesOnDay(result.data);
      } else {
        setCoursesOnDay(null);
      }
    };

    // Debounced: only check once the branch/type/day selection settles
    const timer = setTimeout(loadCoursesOnDay, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [branchId, danceTypeId, dayOfWeek, course]);

  async function onSubmit(data: CourseFormValues) {
    setIsLoading(true);
    setGeneralError(null);

    try {
      const result = course
        ? await updateCourse(course.id, {
            name: data.name,
            dayOfWeek: data.dayOfWeek,
            startTime: data.startTime,
            endTime: data.endTime,
            instructorIds: data.instructorIds,
            // Enrolments are managed on the course page (AddStudentDialog), never here:
            // sending studentIds would replace them.
          })
        : await createCourse({
            name: data.name,
            branchId: data.branchId,
            danceTypeId: data.danceTypeId,
            dayOfWeek: data.dayOfWeek,
            startTime: data.startTime,
            endTime: data.endTime,
            instructorIds: data.instructorIds,
          });

      if (result.error) {
        setGeneralError(result.error);
      } else if (result.success) {
        router.push("/dashboard/courses");
      }
    } catch (error) {
      console.error("Form error:", error);
      setGeneralError(tf('unexpectedError'));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="border-border max-w-4xl">
      <div className="p-3 sm:p-4 md:p-6 lg:p-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-2">
          {course ? t("courses.editCourse") : t("courses.createNewCourse")}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mb-4 md:mb-6">
          {course
            ? t("courses.updateCourseDetails")
            : t("courses.setupNewCourse")}
        </p>

        {!course && (
          <div className="mb-6 p-4 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900 text-sm">
            {tx('studentsAfterCreate')}
          </div>
        )}

        {generalError && (
          <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/30">
            {generalError}
          </div>
        )}

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 md:space-y-6"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("courses.name")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={tx('namePlaceholder')}
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <FormField
                control={form.control}
                name="branchId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("courses.branch")}</FormLabel>
                    <FormControl>
                      <NativeSelect
                        disabled={isLoading}
                        className="w-full"
                        {...field}
                      >
                        <NativeSelectOption value="">{t("courses.selectBranch")}</NativeSelectOption>
                        {branches.map((branch) => (
                          <NativeSelectOption key={branch.id} value={branch.id}>
                            {branch.name}
                          </NativeSelectOption>
                        ))}
                      </NativeSelect>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="danceTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("courses.danceType")}</FormLabel>
                    <FormControl>
                      <NativeSelect
                        disabled={isLoading || !!course}
                        className="w-full"
                        {...field}
                      >
                        <NativeSelectOption value="">{t("courses.selectDanceType")}</NativeSelectOption>
                        {danceTypes.map((type) => (
                          <NativeSelectOption key={type.id} value={type.id}>
                            {type.name}
                          </NativeSelectOption>
                        ))}
                      </NativeSelect>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Show Instructors section ONLY after dance type is selected */}
            {danceTypeId && (
              <div>
                <Label className="block mb-2">
                  {tx('instructorsFor', {
                    label: t("courses.instructors"),
                    danceType: danceTypes.find((d) => d.id === danceTypeId)?.name ?? '',
                  })}
                </Label>

                {loadingInstructors ? (
                  <div className="p-4 border border-border rounded-lg bg-muted/50 text-muted-foreground text-sm">
                    {tx('loadingInstructors')}
                  </div>
                ) : instructors.length === 0 ? (
                  <div className="p-4 border border-border rounded-lg bg-amber-50 text-amber-700 text-sm">
                    {tx('noInstructorRates')}
                  </div>
                ) : (
                  <Button
                    type="button"
                    onClick={() => setShowInstructorModal(true)}
                    variant="outline"
                    className="w-full border-border text-left"
                  >
                    <span className="flex-1 text-left">
                      {instructorIds.length > 0
                        ? t("courses.instructorsSelected", {
                            count: instructorIds.length,
                          })
                        : tx('selectInstructors')}
                    </span>
                  </Button>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
              <FormField
                control={form.control}
                name="dayOfWeek"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("courses.dayOfWeek")}</FormLabel>
                    <FormControl>
                      <NativeSelect
                        disabled={isLoading}
                        className="w-full"
                        {...field}
                      >
                        {DAYS.map((day, idx) => (
                          <NativeSelectOption key={idx} value={idx}>
                            {day}
                          </NativeSelectOption>
                        ))}
                      </NativeSelect>
                    </FormControl>
                    <FormMessage />
                    {!loadingCoursesOnDay &&
                      coursesOnDay &&
                      coursesOnDay.length > 0 && (
                        <Button
                          type="button"
                          variant="link"
                          onClick={() => setShowCoursesModal(true)}
                          className="mt-2 text-primary text-xs md:text-sm p-0 h-auto"
                        >
                          {t("courses.viewCoursesOnThisDay")}{" "}
                          {t("courses.coursesOnDay", {
                            count: coursesOnDay.length,
                          })}
                        </Button>
                      )}
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("courses.startTime")}</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        step={60}
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("courses.endTime")}</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        step={60}
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Courses on this day modal */}
            <Dialog open={showCoursesModal} onOpenChange={setShowCoursesModal}>
              <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{t("courses.coursesOnThisDay")}</DialogTitle>
                </DialogHeader>
                {coursesOnDay && coursesOnDay.length > 0 ? (
                  <ItemGroup className="gap-2">
                    {coursesOnDay.map((c) => (
                      <Item key={c.id} variant="muted">
                        <ItemContent>
                          <ItemTitle>{c.name}</ItemTitle>
                          <ItemDescription>
                            {danceTypes.find((d) => d.id === c.dance_type_id)?.name}
                          </ItemDescription>
                        </ItemContent>
                        <ItemActions className="font-semibold text-primary">{formatTime(c.start_time)}</ItemActions>
                      </Item>
                    ))}
                  </ItemGroup>
                ) : (
                  <p className="text-center text-sm text-muted-foreground">{t("common.empty")}</p>
                )}
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowCoursesModal(false)}>
                    {t("common.close")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Instructor Selection Modal */}
            <InstructorSelectionModal
              instructors={instructors}
              selectedIds={instructorIds}
              isOpen={showInstructorModal}
              onOpenChange={setShowInstructorModal}
              onSelect={(instructorIds) =>
                form.setValue("instructorIds", instructorIds)
              }
              danceTypeName={
                danceTypes.find((d) => d.id === danceTypeId)?.name
              }
            />

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 pt-4 md:pt-6">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto text-sm md:text-base h-9 md:h-10"
              >
                {isLoading
                  ? t("common.saving")
                  : course
                    ? t("courses.updateCourse")
                    : t("courses.createCourse")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
                className="border-border w-full sm:w-auto text-sm md:text-base h-9 md:h-10"
              >
                {t("common.cancel")}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </Card>
  );
}

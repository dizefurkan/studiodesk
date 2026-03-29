'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { createCourse, updateCourse, checkDuplicateCourseTime } from '@/lib/actions/courses.actions'
import { getBranches } from '@/lib/actions/branches.actions'
import { getDanceTypes } from '@/lib/actions/dance-types.actions'
import { getInstructorsForDanceType } from '@/lib/actions/instructors.actions'
import { getAvailableStudentsForCourse } from '@/lib/actions/course-students.actions'
import type { Database } from '@/lib/types/database.types'

type Course = Database['public']['Tables']['courses']['Row']
type Branch = Database['public']['Tables']['branches']['Row']
type DanceType = Database['public']['Tables']['dance_types']['Row']
type Instructor = Database['public']['Tables']['instructors']['Row']

interface Student {
  id: string
  first_name: string
  last_name: string
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const courseSchema = z.object({
  name: z.string().min(2, 'Course name must be at least 2 characters'),
  branchId: z.string().min(1, 'Please select a branch'),
  danceTypeId: z.string().min(1, 'Please select a dance type'),
  dayOfWeek: z.coerce.number().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:mm format'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:mm format'),
  instructorIds: z.array(z.string()).optional(),
  studentIds: z.array(z.string()).optional(),
})

type CourseFormValues = z.infer<typeof courseSchema>

interface CourseFormProps {
  course?: Course & { course_instructors?: { instructor_id: string }[] }
}

interface InstructorWithRates {
  id: string
  first_name: string
  last_name: string
  instructor_rates?: Array<{
    id: string
    ratio_per_class: number
    branch_id: string
    dance_type_id: string
  }>
}

export function CourseForm({ course }: CourseFormProps) {
  const router = useRouter()
  const t = useTranslations()
  const [isLoading, setIsLoading] = useState(false)
  const [branches, setBranches] = useState<Branch[]>([])
  const [danceTypes, setDanceTypes] = useState<DanceType[]>([])
  const [instructors, setInstructors] = useState<InstructorWithRates[]>([])
  const [availableStudents, setAvailableStudents] = useState<Student[]>([])
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [loadingInstructors, setLoadingInstructors] = useState(false)
  const [coursesOnDay, setCoursesOnDay] = useState<Course[] | null>(null)
  const [showCoursesModal, setShowCoursesModal] = useState(false)
  const [loadingCoursesOnDay, setLoadingCoursesOnDay] = useState(false)

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      name: course?.name || '',
      branchId: course?.branch_id || '',
      danceTypeId: course?.dance_type_id || '',
      dayOfWeek: course?.day_of_week || 0,
      startTime: course?.start_time || '',
      endTime: course?.end_time || '',
      instructorIds: course?.course_instructors?.map((ci) => ci.instructor_id) || [],
      studentIds: [],
    },
  })

  useEffect(() => {
    async function loadData() {
      const [branchesResult, danceTypesResult] = await Promise.all([
        getBranches(),
        getDanceTypes(),
      ])

      setBranches(branchesResult.data || [])
      setDanceTypes(danceTypesResult.data || [])
      setInstructors([])  // Clear instructors until dance type is selected
    }

    loadData()
  }, [])

  // Watch for danceTypeId changes and fetch instructors accordingly
  useEffect(() => {
    const danceTypeId = form.watch('danceTypeId')
    
    if (!danceTypeId) {
      setInstructors([])
      setLoadingInstructors(false)
      setGeneralError(null)
      return
    }

    async function loadInstructorsForDanceType() {
      setLoadingInstructors(true)
      try {
        const result = await getInstructorsForDanceType(danceTypeId)
        if (result.error) {
          console.error('[Instructors] Backend error:', result.error)
          setGeneralError(`Failed to load instructors: ${result.error}`)
          setInstructors([])
        } else {
          console.log('[Instructors] Loaded:', result.data?.length || 0, 'instructors for dance type', danceTypeId)
          setInstructors(result.data || [])
        }
      } catch (error) {
        console.error('[Instructors] Exception:', error)
        setGeneralError('An error occurred while loading instructors')
        setInstructors([])
      } finally {
        setLoadingInstructors(false)
      }
    }

    loadInstructorsForDanceType()
  }, [form.watch('danceTypeId')])

  // Load available students when dance type changes
  useEffect(() => {
    const danceTypeId = form.getValues('danceTypeId')
    if (!danceTypeId) {
      setAvailableStudents([])
      return
    }

    async function loadStudents() {
      // If editing a course, pass the course ID to exclude already enrolled students
      const result = await getAvailableStudentsForCourse(course?.id || '', danceTypeId)
      if (result.data) {
        setAvailableStudents(result.data)
      }
    }

    loadStudents()
  }, [form.watch('danceTypeId')])

  // Load courses on selected day (only when creating a new course)
  useEffect(() => {
    if (course) return // Skip check when editing

    const loadCoursesOnDay = async () => {
      const branchId = form.getValues('branchId')
      const danceTypeId = form.getValues('danceTypeId')
      const dayOfWeek = form.getValues('dayOfWeek')

      if (!branchId || !danceTypeId) {
        setCoursesOnDay(null)
        return
      }

      setLoadingCoursesOnDay(true)
      const result = await checkDuplicateCourseTime(branchId, danceTypeId, dayOfWeek)
      setLoadingCoursesOnDay(false)
      
      if (result.data && result.data.length > 0) {
        setCoursesOnDay(result.data)
      } else {
        setCoursesOnDay(null)
      }
    }

    const timer = setTimeout(loadCoursesOnDay, 500)
    return () => clearTimeout(timer)
  }, [form.watch('branchId'), form.watch('danceTypeId'), form.watch('dayOfWeek'), course])

  async function onSubmit(data: CourseFormValues) {
    setIsLoading(true)
    setGeneralError(null)

    try {
      const result = course
        ? await updateCourse(course.id, {
            name: data.name,
            dayOfWeek: data.dayOfWeek,
            startTime: data.startTime,
            endTime: data.endTime,
            instructorIds: data.instructorIds,
            studentIds: data.studentIds,
          })
        : await createCourse({
            name: data.name,
            branchId: data.branchId,
            danceTypeId: data.danceTypeId,
            dayOfWeek: data.dayOfWeek,
            startTime: data.startTime,
            endTime: data.endTime,
            instructorIds: data.instructorIds,
            // Don't pass studentIds when creating - students should be added via AddStudentDialog
            studentIds: [],
          })

      if (result.error) {
        setGeneralError(result.error)
      } else if (result.success) {
        console.log('Course form result:', result)
        console.log('Redirecting to /dashboard/courses')
        router.push('/dashboard/courses')
      }
    } catch (error) {
      console.error('Form error:', error)
      setGeneralError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-[#E5E7EB] max-w-4xl">
      <div className="p-3 sm:p-4 md:p-6 lg:p-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#111827] mb-2">
          {course ? t('courses.editCourse') : t('courses.createNewCourse')}
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mb-4 md:mb-6">
          {course ? t('courses.updateCourseDetails') : t('courses.setupNewCourse')}
        </p>

        {!course && (
          <div className="mb-6 p-4 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 text-sm">
            💡 Students will be added after the course is created using the "Add Students" button on the course detail page.
          </div>
        )}

        {generalError && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">{generalError}</div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('courses.name')}</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Advanced Ballet" disabled={isLoading} {...field} />
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
                    <FormLabel>{t('courses.branch')}</FormLabel>
                    <FormControl>
                      <select
                        disabled={isLoading || !!course}
                        className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                        {...field}
                      >
                        <option value="">{t('courses.selectBranch')}</option>
                        {branches.map((branch) => (
                          <option key={branch.id} value={branch.id}>
                            {branch.name}
                          </option>
                        ))}
                      </select>
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
                    <FormLabel>{t('courses.danceType')}</FormLabel>
                    <FormControl>
                      <select
                        disabled={isLoading || !!course}
                        className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                        {...field}
                      >
                        <option value="">{t('courses.selectDanceType')}</option>
                        {danceTypes.map((type) => (
                          <option key={type.id} value={type.id}>
                            {type.name}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Show Instructors section ONLY after dance type is selected */}
            {form.watch('danceTypeId') && (
              <FormField
                control={form.control}
                name="instructorIds"
                render={({ field }) => {
                  const danceTypeId = form.watch('danceTypeId')

                  return (
                    <FormItem>
                      <FormLabel>{t('courses.instructors')} (for {danceTypes.find(d => d.id === danceTypeId)?.name})</FormLabel>

                      {loadingInstructors ? (
                        <div className="p-4 border border-[#E5E7EB] rounded-lg bg-gray-50 text-gray-600 text-sm">
                          Loading instructors...
                        </div>
                      ) : instructors.length === 0 ? (
                        <div className="p-4 border border-[#E5E7EB] rounded-lg bg-amber-50 text-amber-700 text-sm">
                          ⚠️ No instructors with rates for this dance type. Please set up instructor rates first.
                        </div>
                      ) : (
                        <div className="space-y-2 border border-[#E5E7EB] rounded-lg p-4 max-h-50 overflow-y-auto">
                          {instructors.map((instructor) => {
                            const pricePerClass = instructor.instructor_rates?.[0]?.ratio_per_class

                            return (
                              <label
                                key={instructor.id}
                                className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-gray-50 transition-colors"
                              >
                                <input
                                  type="checkbox"
                                  checked={field.value?.includes(instructor.id) || false}
                                  onChange={(e) => {
                                    const value = field.value || []
                                    if (e.target.checked) {
                                      field.onChange([...value, instructor.id])
                                    } else {
                                      field.onChange(value.filter((id) => id !== instructor.id))
                                    }
                                  }}
                                  disabled={isLoading}
                                  className="w-4 h-4 rounded border-[#E5E7EB]"
                                />
                                <span className="text-sm text-[#111827] flex-1">
                                  {instructor.first_name} {instructor.last_name}
                                </span>
                                <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded">
                                  ₺{pricePerClass}/session
                                </span>
                              </label>
                            )
                          })}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )
                }}
              />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
              <FormField
                control={form.control}
                name="dayOfWeek"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('courses.dayOfWeek')}</FormLabel>
                    <FormControl>
                      <select
                        disabled={isLoading}
                        className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                        {...field}
                      >
                        {DAYS.map((day, idx) => (
                          <option key={idx} value={idx}>
                            {day}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                    {!loadingCoursesOnDay && coursesOnDay && coursesOnDay.length > 0 && (
                      <Button
                        type="button"
                        variant="link"
                        onClick={() => setShowCoursesModal(true)}
                        className="mt-2 text-[#4F46E5] text-xs md:text-sm p-0 h-auto"
                      >
                        {t('courses.viewCoursesOnThisDay')} ({coursesOnDay.length})
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
                    <FormLabel>{t('courses.startTime')}</FormLabel>
                    <FormControl>
                      <Input type="time" step={60} disabled={isLoading} {...field} />
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
                    <FormLabel>{t('courses.endTime')}</FormLabel>
                    <FormControl>
                      <Input type="time" step={60} disabled={isLoading} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Courses on this day modal */}
            {showCoursesModal && (
              <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
                  <h2 className="text-lg font-bold mb-4 text-[#111827]">{t('courses.coursesOnThisDay')}</h2>
                  {coursesOnDay && coursesOnDay.length > 0 ? (
                    <div className="space-y-3">
                      {coursesOnDay.map((c) => (
                        <div key={c.id} className="p-3 border border-[#E5E7EB] rounded-lg bg-gray-50">
                          <div className="flex justify-between items-start gap-2 mb-2">
                            <p className="font-semibold text-sm text-[#111827]">{c.name}</p>
                            <p className="text-sm font-bold text-[#4F46E5] whitespace-nowrap">{c.start_time?.substring(0, 5)}</p>
                          </div>
                          <p className="text-xs text-[#374151]">{danceTypes.find(d => d.id === c.dance_type_id)?.name}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-[#6B7280] text-sm">{t('common.empty')}</p>
                  )}
                  <Button
                    type="button"
                    onClick={() => setShowCoursesModal(false)}
                    className="mt-4 w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white text-sm"
                  >
                    {t('common.close')}
                  </Button>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 pt-4 md:pt-6">
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-[#4F46E5] hover:bg-[#4338CA] text-white w-full sm:w-auto text-sm md:text-base h-9 md:h-10"
              >
                {isLoading ? t('common.saving') : course ? t('courses.updateCourse') : t('courses.createCourse')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
                className="border-[#E5E7EB] w-full sm:w-auto text-sm md:text-base h-9 md:h-10"
              >
                {t('common.cancel')}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </Card>
  )
}

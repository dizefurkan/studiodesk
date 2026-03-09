'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { createCourse, updateCourse } from '@/lib/actions/courses.actions'
import { getBranches } from '@/lib/actions/branches.actions'
import { getDanceTypes } from '@/lib/actions/dance-types.actions'
import { getInstructors } from '@/lib/actions/instructors.actions'
import type { Database } from '@/lib/types/database.types'

type Course = Database['public']['Tables']['courses']['Row']
type Branch = Database['public']['Tables']['branches']['Row']
type DanceType = Database['public']['Tables']['dance_types']['Row']
type Instructor = Database['public']['Tables']['instructors']['Row']

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const courseSchema = z.object({
  name: z.string().min(2, 'Course name must be at least 2 characters'),
  branchId: z.string().min(1, 'Please select a branch'),
  danceTypeId: z.string().min(1, 'Please select a dance type'),
  dayOfWeek: z.coerce.number().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:mm format'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:mm format'),
  capacity: z.coerce.number().min(1, 'Capacity must be at least 1'),
  instructorIds: z.array(z.string()).optional(),
})

type CourseFormValues = z.infer<typeof courseSchema>

interface CourseFormProps {
  course?: Course & { course_instructors?: { instructor_id: string }[] }
}

export function CourseForm({ course }: CourseFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [branches, setBranches] = useState<Branch[]>([])
  const [danceTypes, setDanceTypes] = useState<DanceType[]>([])
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [generalError, setGeneralError] = useState<string | null>(null)

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      name: course?.name || '',
      branchId: course?.branch_id || '',
      danceTypeId: course?.dance_type_id || '',
      dayOfWeek: course?.day_of_week || 0,
      startTime: course?.start_time || '',
      endTime: course?.end_time || '',
      capacity: course?.capacity || 20,
      instructorIds: course?.course_instructors?.map((ci) => ci.instructor_id) || [],
    },
  })

  useEffect(() => {
    async function loadData() {
      const [branchesResult, danceTypesResult, instructorsResult] = await Promise.all([
        getBranches(),
        getDanceTypes(),
        getInstructors(),
      ])

      setBranches(branchesResult.data || [])
      setDanceTypes(danceTypesResult.data || [])
      setInstructors(instructorsResult.data || [])
    }

    loadData()
  }, [])

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
            capacity: data.capacity,
            instructorIds: data.instructorIds,
          })
        : await createCourse({
            name: data.name,
            branchId: data.branchId,
            danceTypeId: data.danceTypeId,
            dayOfWeek: data.dayOfWeek,
            startTime: data.startTime,
            endTime: data.endTime,
            capacity: data.capacity,
            instructorIds: data.instructorIds,
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
      <div className="p-8">
        <h1 className="text-2xl font-bold text-[#111827] mb-2">
          {course ? 'Edit Course' : 'Create New Course'}
        </h1>
        <p className="text-gray-600 mb-6">
          {course ? 'Update course details' : 'Set up a new recurring course with schedule and instructors'}
        </p>

        {generalError && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">{generalError}</div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Advanced Ballet" disabled={isLoading} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="branchId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branch</FormLabel>
                    <FormControl>
                      <select
                        disabled={isLoading || !!course}
                        className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                        {...field}
                      >
                        <option value="">Select a branch</option>
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
                    <FormLabel>Dance Type</FormLabel>
                    <FormControl>
                      <select
                        disabled={isLoading || !!course}
                        className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                        {...field}
                      >
                        <option value="">Select a dance type</option>
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

            <div className="grid grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="dayOfWeek"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Day of Week</FormLabel>
                    <FormControl>
                      <select
                        disabled={isLoading}
                        className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
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
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input type="time" disabled={isLoading} {...field} />
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
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <Input type="time" disabled={isLoading} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacity</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="20" disabled={isLoading} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="instructorIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instructors</FormLabel>
                  <div className="space-y-2 border border-[#E5E7EB] rounded-lg p-4 max-h-[200px] overflow-y-auto">
                    {instructors.map((instructor) => (
                      <label key={instructor.id} className="flex items-center gap-3 cursor-pointer">
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
                        <span className="text-sm text-[#111827]">
                          {instructor.first_name} {instructor.last_name}
                        </span>
                      </label>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-[#4F46E5] hover:bg-[#4338CA] text-white"
              >
                {isLoading ? 'Saving...' : course ? 'Update Course' : 'Create Course'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
                className="border-[#E5E7EB]"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </Card>
  )
}

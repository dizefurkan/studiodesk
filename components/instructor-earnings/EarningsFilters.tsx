'use client'

import { DatePicker } from '@/components/common/DatePicker'
import { format, parse } from 'date-fns'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Label } from '@/components/ui/label'

interface InstructorEarningsFiltersProps {
  instructors: Array<{ id: string; first_name: string; last_name: string }>
  instructorId?: string
  fromDate?: string
  toDate?: string
}

export function InstructorEarningsFilters({
  instructors,
  instructorId,
  fromDate,
  toDate,
}: InstructorEarningsFiltersProps) {
  const handleInstructorChange = (value: string) => {
    const params = new URLSearchParams()
    if (value) params.set('instructor', value)
    if (fromDate) params.set('from', fromDate)
    if (toDate) params.set('to', toDate)
    window.location.href = `/dashboard/instructor-earnings?${params.toString()}`
  }

  const handleFromDateChange = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const params = new URLSearchParams()
    if (instructorId) params.set('instructor', instructorId)
    if (dateStr) params.set('from', dateStr)
    if (toDate) params.set('to', toDate)
    window.location.href = `/dashboard/instructor-earnings?${params.toString()}`
  }

  const handleToDateChange = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const params = new URLSearchParams()
    if (instructorId) params.set('instructor', instructorId)
    if (fromDate) params.set('from', fromDate)
    if (dateStr) params.set('to', dateStr)
    window.location.href = `/dashboard/instructor-earnings?${params.toString()}`
  }

  // Parse date strings to Date objects for DatePicker
  const fromDateObj = fromDate ? parse(fromDate, 'yyyy-MM-dd', new Date()) : undefined
  const toDateObj = toDate ? parse(toDate, 'yyyy-MM-dd', new Date()) : undefined

  return (
    <div className="flex gap-4 flex-wrap items-end">
      <div className="flex-1 min-w-50">
        <Label className="block mb-2">Instructor</Label>
        <NativeSelect
          defaultValue={instructorId || ''}
          onChange={(e) => handleInstructorChange(e.target.value)}
          className="w-full"
        >
          <NativeSelectOption value="">All Instructors</NativeSelectOption>
          {instructors.map((instructor) => (
            <NativeSelectOption key={instructor.id} value={instructor.id}>
              {instructor.first_name} {instructor.last_name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>

      <div className="flex-1 min-w-50">
        <Label className="block mb-2">From Date</Label>
        <DatePicker
          value={fromDateObj}
          onDateChange={handleFromDateChange}
          placeholder="Select from date"
          className="w-full"
        />
      </div>

      <div className="flex-1 min-w-50">
        <Label className="block mb-2">To Date</Label>
        <DatePicker
          value={toDateObj}
          onDateChange={handleToDateChange}
          placeholder="Select to date"
          className="w-full"
        />
      </div>
    </div>
  )
}

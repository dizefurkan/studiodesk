'use client'

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

  const handleFromDateChange = (value: string) => {
    const params = new URLSearchParams()
    if (instructorId) params.set('instructor', instructorId)
    if (value) params.set('from', value)
    if (toDate) params.set('to', toDate)
    window.location.href = `/dashboard/instructor-earnings?${params.toString()}`
  }

  const handleToDateChange = (value: string) => {
    const params = new URLSearchParams()
    if (instructorId) params.set('instructor', instructorId)
    if (fromDate) params.set('from', fromDate)
    if (value) params.set('to', value)
    window.location.href = `/dashboard/instructor-earnings?${params.toString()}`
  }

  return (
    <div className="flex gap-4 flex-wrap items-end">
      <div className="flex-1 min-w-50">
        <label className="text-sm font-medium text-[#111827] block mb-2">Instructor</label>
        <select
          defaultValue={instructorId || ''}
          onChange={(e) => handleInstructorChange(e.target.value)}
          className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
        >
          <option value="">All Instructors</option>
          {instructors.map((instructor) => (
            <option key={instructor.id} value={instructor.id}>
              {instructor.first_name} {instructor.last_name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 min-w-50">
        <label className="text-sm font-medium text-[#111827] block mb-2">From Date</label>
        <input
          type="date"
          defaultValue={fromDate || ''}
          onChange={(e) => handleFromDateChange(e.target.value)}
          className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
        />
      </div>

      <div className="flex-1 min-w-50">
        <label className="text-sm font-medium text-[#111827] block mb-2">To Date</label>
        <input
          type="date"
          defaultValue={toDate || ''}
          onChange={(e) => handleToDateChange(e.target.value)}
          className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
        />
      </div>
    </div>
  )
}

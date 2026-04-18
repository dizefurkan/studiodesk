import { getInstructorEarnings } from '@/lib/actions/instructor-earnings.actions'
import { getInstructors } from '@/lib/actions/instructors.actions'
import { getOrganization } from '@/lib/auth/getOrganization'
import { Card } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils/format'
import { TrendingUp, DollarSign } from 'lucide-react'
import { InstructorEarningsTable } from './instructor-earnings-client'

export default async function InstructorEarningsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const instructorId = typeof params.instructor === 'string' ? params.instructor : undefined
  const fromDate = typeof params.from === 'string' ? params.from : undefined
  const toDate = typeof params.to === 'string' ? params.to : undefined

  const organization = await getOrganization()
  const currency = organization?.currency || 'TRY'

  const [earningsResult, instructorsResult] = await Promise.all([
    getInstructorEarnings(instructorId, fromDate, toDate),
    getInstructors(),
  ])

  const earnings = earningsResult.data || []
  const instructors = instructorsResult.data || []

  const totalEarnings = earnings.reduce((sum: number, e: any) => sum + Number(e.amount), 0)
  const sessionCount = earnings.length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#111827]">Instructor Earnings</h1>
        <p className="text-gray-600 mt-1">Track instructor compensation and session payments</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-[#E5E7EB] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Earnings (Selected Period)</p>
              <p className="text-3xl font-bold text-[#4F46E5]">{formatCurrency(totalEarnings, currency)}</p>
            </div>
            <DollarSign className="text-[#4F46E5]" size={32} />
          </div>
        </Card>

        <Card className="border-[#E5E7EB] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Sessions</p>
              <p className="text-3xl font-bold text-[#4F46E5]">{sessionCount}</p>
            </div>
            <TrendingUp className="text-[#4F46E5]" size={32} />
          </div>
        </Card>
      </div>

      {/* Filters and Table */}
      <InstructorEarningsTable
        earnings={earnings}
        instructors={instructors}
        currency={currency}
        instructorId={instructorId}
        fromDate={fromDate}
        toDate={toDate}
      />
    </div>
  )
}

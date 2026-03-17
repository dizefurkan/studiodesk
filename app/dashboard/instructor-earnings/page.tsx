import { getInstructorEarnings } from '@/lib/actions/instructor-earnings.actions'
import { getInstructors } from '@/lib/actions/instructors.actions'
import { Card } from '@/components/ui/card'
import { InstructorEarningsFilters } from '@/components/instructor-earnings/EarningsFilters'
import { EarningsEditButton } from '@/components/instructor-earnings/EarningsEditButton'
import { TrendingUp, DollarSign } from 'lucide-react'

export default async function InstructorEarningsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const instructorId = typeof params.instructor === 'string' ? params.instructor : undefined
  const fromDate = typeof params.from === 'string' ? params.from : undefined
  const toDate = typeof params.to === 'string' ? params.to : undefined

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
              <p className="text-3xl font-bold text-[#4F46E5]">${totalEarnings.toFixed(2)}</p>
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

      {/* Filters */}
      <Card className="border-[#E5E7EB] p-6">
        <InstructorEarningsFilters instructors={instructors} instructorId={instructorId} fromDate={fromDate} toDate={toDate} />
      </Card>

      {/* Earnings List */}
      {earnings.length === 0 ? (
        <Card className="border-[#E5E7EB] p-12 text-center">
          <div className="text-gray-500">
            <TrendingUp size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg">No earnings records found</p>
            <p className="text-sm mt-1">Complete course sessions to generate instructor earnings</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {earnings.map((earning: any) => (
            <Card key={earning.id} className="border-[#E5E7EB] p-4">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <p className="font-medium text-[#111827]">
                    {earning.instructors?.first_name} {earning.instructors?.last_name} - Session Payment
                  </p>
                  <p className="text-sm text-gray-600">{new Date(earning.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-lg font-bold text-green-600">${earning.amount}</p>
                  <EarningsEditButton 
                    earningsId={earning.id}
                    currentAmount={Number(earning.amount)}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

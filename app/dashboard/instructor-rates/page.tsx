import { getInstructorRates, getInstructorsAndBranchesAndDanceTypes } from '@/lib/actions/instructor-rates.actions'
import { InstructorRatesTable } from '@/components/instructor-rates/InstructorRatesTable'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { DollarSign } from 'lucide-react'

export default async function InstructorRatesPage() {
  const [ratesResult, dataResult] = await Promise.all([
    getInstructorRates(),
    getInstructorsAndBranchesAndDanceTypes(),
  ])

  const rates = ratesResult.data || []
  const instructors = dataResult.data?.instructors || []
  const branches = dataResult.data?.branches || []
  const danceTypes = dataResult.data?.danceTypes || []

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard" className="text-[#4F46E5] hover:underline mb-4 inline-block">
          ← Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-[#111827]">Instructor Rates</h1>
        <p className="text-gray-600 mt-1">Configure how much each instructor earns per class</p>
      </div>

      <Card className="border-[#E5E7EB] p-6 bg-linear-to-r from-amber-50 to-orange-50">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-orange-100 rounded-lg">
            <DollarSign className="text-orange-600" size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-[#111827]">About Instructor Rates</h3>
            <p className="text-sm text-gray-600 mt-2">
              Define the rate each instructor earns per class for each dance type and branch combination. These rates are
              used to automatically calculate earnings when attendance is recorded.
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 mt-3 space-y-1">
              <li>Rates are specific to Instructor + Branch + Dance Type combination</li>
              <li>When a student attends a class, the instructor automatically earns this rate</li>
              <li>Multiple rates can be configured for the same instructor across different branches/dance types</li>
            </ul>
          </div>
        </div>
      </Card>

      <InstructorRatesTable
        rates={rates}
        instructors={instructors}
        branches={branches}
        danceTypes={danceTypes}
      />
    </div>
  )
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'

export default function InstructorEarningsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#111827]">Instructor Earnings</h1>
        <p className="text-gray-600 mt-1">View instructor payments and earnings</p>
      </div>

      <Card className="border-[#E5E7EB]">
        <CardHeader>
          <CardTitle>Earnings Report</CardTitle>
          <CardDescription>Feature coming soon</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <TrendingUp className="mx-auto text-[#9CA3AF] mb-4" size={48} />
            <p className="text-gray-600">
              View instructor earnings by date range. Track payment status and commission breakdown.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

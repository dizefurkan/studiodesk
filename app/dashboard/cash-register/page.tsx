import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign } from 'lucide-react'

export default function CashRegisterPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#111827]">Cash Register</h1>
        <p className="text-gray-600 mt-1">Track financial transactions</p>
      </div>

      <Card className="border-[#E5E7EB]">
        <CardHeader>
          <CardTitle>Financial Transactions</CardTitle>
          <CardDescription>Feature coming soon</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <DollarSign className="mx-auto text-[#9CA3AF] mb-4" size={48} />
            <p className="text-gray-600">
              Record sales, refunds, and expenses. Track daily and monthly financial reports.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

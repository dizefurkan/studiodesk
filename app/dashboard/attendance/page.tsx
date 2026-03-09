import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ClipboardCheck } from 'lucide-react'

export default function AttendancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#111827]">Attendance</h1>
        <p className="text-gray-600 mt-1">Mark student attendance</p>
      </div>

      <Card className="border-[#E5E7EB]">
        <CardHeader>
          <CardTitle>Attendance Tracking</CardTitle>
          <CardDescription>Feature coming soon</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <ClipboardCheck className="mx-auto text-[#9CA3AF] mb-4" size={48} />
            <p className="text-gray-600">
              Mark attendance for class sessions. Automatically deduct credits from student packages.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

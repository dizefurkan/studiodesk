import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from 'lucide-react'

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#111827]">Calendar</h1>
        <p className="text-gray-600 mt-1">View your class schedule</p>
      </div>

      <Card className="border-[#E5E7EB]">
        <CardHeader>
          <CardTitle>Calendar View</CardTitle>
          <CardDescription>Feature coming soon</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Calendar className="mx-auto text-[#9CA3AF] mb-4" size={48} />
            <p className="text-gray-600">
              Interactive calendar view for managing your class schedule. Visualize all courses and sessions by date.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

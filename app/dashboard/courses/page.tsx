import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, Plus } from 'lucide-react'
import Link from 'next/link'

export default function CoursesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#111827]">Courses</h1>
          <p className="text-gray-600 mt-1">Manage your dance courses</p>
        </div>
        <Button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white">
          <Plus size={20} className="mr-2" />
          Add Course
        </Button>
      </div>

      <Card className="border-[#E5E7EB]">
        <CardHeader>
          <CardTitle className="text-lg">Course Development</CardTitle>
          <CardDescription>Feature coming soon</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <BookOpen className="mx-auto text-[#9CA3AF] mb-4" size={48} />
            <p className="text-gray-600">
              Course management module is under development. You'll be able to create courses, assign instructors,
              set schedules, and manage class capacity.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <div className="space-y-8 text-center max-w-md">
        {/* 404 Number */}
        <div className="space-y-2">
          <h1 className="text-9xl font-bold text-[#4F46E5]">404</h1>
          <p className="text-2xl font-semibold text-[#111827]">Page Not Found</p>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-lg">
          Sorry, the page you're looking for doesn't exist or has been moved.
        </p>

        {/* Back to Home Button */}
        <Link href="/dashboard">
          <Button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white gap-2 px-8 py-3 h-auto">
            <Home size={20} />
            Back to Dashboard
          </Button>
        </Link>

        {/* Alternative Links */}
        <div className="pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-4">Quick Links:</p>
          <div className="flex flex-col gap-2">
            <Link href="/dashboard/students" className="text-[#4F46E5] hover:underline">
              Students
            </Link>
            <Link href="/dashboard/courses" className="text-[#4F46E5] hover:underline">
              Courses
            </Link>
            <Link href="/dashboard/instructor-rates" className="text-[#4F46E5] hover:underline">
              Instructor Rates
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

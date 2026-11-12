import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-muted/50 to-muted px-4">
      <div className="space-y-8 text-center max-w-md">
        {/* 404 Number */}
        <div className="space-y-2">
          <h1 className="text-9xl font-bold text-primary">404</h1>
          <p className="text-2xl font-semibold text-foreground">Page Not Found</p>
        </div>

        {/* Description */}
        <p className="text-muted-foreground text-lg">
          Sorry, the page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        {/* Back to Home Button */}
        <Link href="/dashboard">
          <Button className="gap-2 px-8 py-3 h-auto">
            <Home size={20} />
            Back to Dashboard
          </Button>
        </Link>

        {/* Alternative Links */}
        <div className="pt-6 border-t border-border">
          <p className="text-sm text-muted-foreground mb-4">Quick Links:</p>
          <div className="flex flex-col gap-2">
            <Link href="/dashboard/students" className="text-primary hover:underline">
              Students
            </Link>
            <Link href="/dashboard/courses" className="text-primary hover:underline">
              Courses
            </Link>
            <Link href="/dashboard/instructor-rates" className="text-primary hover:underline">
              Instructor Rates
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

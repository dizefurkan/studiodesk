import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, BookOpen, Calendar, TrendingUp, ArrowRight, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { getStudents } from '@/lib/actions/students.actions'
import { getCourses } from '@/lib/actions/courses.actions'
import { getOrganization } from '@/lib/auth/getOrganization'
import { DEFAULT_CURRENCY } from '@/config/currencies'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils/format'

export default async function DashboardPage() {
  const organization = await getOrganization()
  
  // Fetch students
  const studentsResult = await getStudents()
  const totalStudents = (studentsResult.data && Array.isArray(studentsResult.data)) ? studentsResult.data.length : 0
  
  // Fetch courses
  const coursesResult = await getCourses()
  const activeCourses = (coursesResult.data && Array.isArray(coursesResult.data)) ? coursesResult.data.length : 0
  
  // Fetch sessions and revenue this month
  let sessionCount = 0
  let revenue = 0
  
  if (organization) {
    try {
      const supabase = await createServerSupabaseClient()
      const now = new Date()
      
      // First day of current month (e.g., 2026-03-01)
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      // Last day of current month (e.g., 2026-03-31)
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      
      // Format dates for date comparison (YYYY-MM-DD)
      const firstDayStr = firstDay.toISOString().split('T')[0]
      const lastDayStr = lastDay.toISOString().split('T')[0]
      
      // Get sessions for this month (by session_date)
      const { data: sessions } = await supabase
        .from('course_sessions')
        .select('id')
        .gte('session_date', firstDayStr)
        .lte('session_date', lastDayStr)
      
      if (sessions && Array.isArray(sessions)) {
        sessionCount = sessions.length
      }
      
      // Get cash transactions for this month (for revenue)
      const firstDayTimestamp = firstDay.toISOString()
      const lastDayTimestamp = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()
      
      const { data: transactions } = await supabase
        .from('cash_transactions')
        .select('amount')
        .eq('type', 'income')
        .gte('created_at', firstDayTimestamp)
        .lte('created_at', lastDayTimestamp)
      
      if (transactions && Array.isArray(transactions)) {
        revenue = transactions.reduce((sum, t) => sum + (t.amount || 0), 0)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    }
  }
  
  const stats = [
    { label: 'Total Students', value: totalStudents.toString(), icon: Users, color: 'text-blue-600' },
    { label: 'Active Courses', value: activeCourses.toString(), icon: BookOpen, color: 'text-purple-600' },
    { label: 'This Month Sessions', value: sessionCount.toString(), icon: Calendar, color: 'text-green-600' },
    { label: 'Revenue', value: formatCurrency(revenue, organization?.currency || DEFAULT_CURRENCY), icon: TrendingUp, color: 'text-orange-600' },
  ]

  const quickActions = [
    { label: 'Add Student', href: '/dashboard/students/new', icon: Users },
    { label: 'Create Course', href: '/dashboard/courses/new', icon: BookOpen },
    { label: 'View Calendar', href: '/dashboard/calendar', icon: Calendar },
    { label: 'Manage Branches', href: '/dashboard/branches', icon: AlertCircle },
  ]

  const gettingStarted = [
    { title: 'Set up instructors', completed: false, href: '/dashboard/instructors' },
    { title: 'Add dance types', completed: false, href: '/dashboard/dance-types' },
    { title: 'Create course packages', completed: false, href: '/dashboard/packages' },
    { title: 'Configure payment methods', completed: false, href: '/dashboard/settings' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#111827]">Welcome to your Studio</h1>
        <p className="text-gray-600 mt-1">Here's what's happening today</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="border-[#E5E7EB]">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-[#111827]">{stat.value}</p>
                  </div>
                  <div className={`p-3 bg-gray-100 rounded-lg ${stat.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <Card className="border-[#E5E7EB]">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <Link key={action.label} href={action.href}>
                    <Button
                      variant="outline"
                      className="w-full justify-between border-[#E5E7EB] text-[#111827] hover:bg-gray-50"
                    >
                      <span className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {action.label}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                )
              })}
            </CardContent>
          </Card>
        </div>

        {/* Getting Started Checklist */}
        <div className="lg:col-span-2">
          <Card className="border-[#E5E7EB]">
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>Complete these steps to set up your studio</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {gettingStarted.map((item) => (
                  <Link key={item.title} href={item.href}>
                    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer border border-transparent hover:border-[#E5E7EB] transition-colors">
                      {item.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                      ) : (
                        <Clock className="w-5 h-5 text-gray-400 shrink-0" />
                      )}
                      <span className={item.completed ? 'text-gray-500 line-through' : 'text-[#111827]'}>
                        {item.title}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

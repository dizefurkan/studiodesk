import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, BookOpen, Calendar, TrendingUp, ArrowRight, CheckCircle2, Clock, AlertCircle, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { getStudents } from '@/lib/actions/students.actions'
import { getCourses } from '@/lib/actions/courses.actions'
import { getOrganization } from '@/lib/auth/getOrganization'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils/format'
import { RevenueChart } from '@/components/dashboard/RevenueChart'
import { UpcomingCoursesCard } from '@/components/dashboard/UpcomingCoursesCard'
import { RecentActivityCard } from '@/components/dashboard/RecentActivityCard'

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations()
  const organization = await getOrganization()
  
  // Fetch students
  const studentsResult = await getStudents()
  const totalStudents = (studentsResult.data && Array.isArray(studentsResult.data)) ? studentsResult.data.length : 0
  
  // Fetch courses
  const coursesResult = await getCourses()
  const activeCourses = (coursesResult.data && Array.isArray(coursesResult.data)) ? coursesResult.data.length : 0
  
  // Initialize data
  let sessionCount = 0
  let revenue = 0
  let lastMonthRevenue = 0
  let growthRate = 0
  let chartData: any[] = []
  let upcomingCourses: any[] = []
  let recentActivities: any[] = []
  
  if (organization) {
    try {
      const supabase = await createServerSupabaseClient()
      const now = new Date()
      
      // Current month date range
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      const firstDayStr = firstDay.toISOString().split('T')[0]
      const lastDayStr = lastDay.toISOString().split('T')[0]
      
      // Get sessions for this month
      const { data: sessions } = await supabase
        .from('course_sessions')
        .select('id')
        .gte('session_date', firstDayStr)
        .lte('session_date', lastDayStr)
      
      if (sessions && Array.isArray(sessions)) {
        sessionCount = sessions.length
      }
      
      // Get current month revenue
      const firstDayTimestamp = firstDay.toISOString()
      const lastDayTimestamp = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()
      
      const { data: transactions } = await supabase
        .from('cash_transactions')
        .select('amount')
        .eq('type', 'income')
        .gte('created_at', firstDayTimestamp)
        .lte('created_at', lastDayTimestamp)
      
      if (transactions && Array.isArray(transactions)) {
        revenue = transactions.reduce((sum, t: any) => sum + (t.amount || 0), 0)
      }
      
      // Get last month revenue for growth calculation
      const prevMonthFirst = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const prevMonthLast = new Date(now.getFullYear(), now.getMonth(), 0)
      const prevMonthFirstTimestamp = prevMonthFirst.toISOString()
      const prevMonthLastTimestamp = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString()
      
      const { data: prevTransactions } = await supabase
        .from('cash_transactions')
        .select('amount')
        .eq('type', 'income')
        .gte('created_at', prevMonthFirstTimestamp)
        .lte('created_at', prevMonthLastTimestamp)
      
      if (prevTransactions && Array.isArray(prevTransactions)) {
        lastMonthRevenue = prevTransactions.reduce((sum, t: any) => sum + (t.amount || 0), 0)
      }
      
      // Calculate growth rate
      if (lastMonthRevenue > 0) {
        growthRate = ((revenue - lastMonthRevenue) / lastMonthRevenue) * 100
      }
      
      // Get revenue for last 12 months for chart
      const months = []
      for (let i = 11; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
        months.push(monthDate)
      }
      
      const monthlyData = await Promise.all(
        months.map(async (month) => {
          const monthFirst = new Date(month.getFullYear(), month.getMonth(), 1)
          const monthLast = new Date(month.getFullYear(), month.getMonth() + 1, 0)
          
          const { data: monthTransactions } = await supabase
            .from('cash_transactions')
            .select('amount')
            .eq('type', 'income')
            .gte('created_at', monthFirst.toISOString())
            .lte('created_at', new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59).toISOString())
          
          const monthRevenue = (monthTransactions || []).reduce((sum, t: any) => sum + (t.amount || 0), 0)
          const monthName = month.toLocaleDateString('en-US', { month: 'short' })
          
          return {
            name: monthName,
            revenue: monthRevenue,
          }
        })
      )
      
      chartData = monthlyData
      
      // Get upcoming courses (next 30 days)
      const today = new Date().toISOString().split('T')[0]
      const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      
      const { data: upcomingSessions } = await supabase
        .from('course_sessions')
        .select(`
          id,
          session_date,
          course_id,
          courses!inner(id, title, instructors(id, name))
        `)
        .gte('session_date', today)
        .lte('session_date', nextMonth)
        .order('session_date', { ascending: true })
        .limit(5)
      
      if (upcomingSessions && Array.isArray(upcomingSessions)) {
        upcomingCourses = upcomingSessions
      }
      
      // Get recent activities (mix of different actions)
      const { data: recentSessions } = await supabase
        .from('course_sessions')
        .select(`
          id,
          created_at,
          session_date,
          courses(id, title)
        `)
        .order('created_at', { ascending: false })
        .limit(5)
      
      if (recentSessions && Array.isArray(recentSessions)) {
        recentActivities = recentSessions.map((session: any) => ({
          type: 'sessionHeld',
          title: `${t('dashboard.sessionHeld')}: ${session.courses?.title || 'Unknown Course'}`,
          date: session.created_at,
          icon: 'calendar',
        }))
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    }
  }
  
  const stats = [
    { label: t('dashboard.activeStudents'), value: totalStudents.toString(), icon: Users, color: 'text-blue-600' },
    { label: t('dashboard.activeCourses'), value: activeCourses.toString(), icon: BookOpen, color: 'text-purple-600' },
    { label: t('dashboard.thisMonthSessions'), value: sessionCount.toString(), icon: Calendar, color: 'text-green-600' },
    { label: t('dashboard.revenue'), value: formatCurrency(revenue, organization?.currency || 'TRY'), icon: TrendingUp, color: 'text-orange-600' },
  ]

  const quickActions = [
    { label: t('common.add') + ' ' + t('dashboard.students'), href: '/dashboard/students/new', icon: Users },
    { label: t('dashboard.createCourse'), href: '/dashboard/courses/new', icon: BookOpen },
    { label: t('dashboard.viewCalendar'), href: '/dashboard/calendar', icon: Calendar },
    { label: t('dashboard.manageBranches'), href: '/dashboard/branches', icon: AlertCircle },
  ]

  const gettingStarted = [
    { title: t('dashboard.setupInstructors'), completed: false, href: '/dashboard/instructors' },
    { title: t('dashboard.setupDanceTypes'), completed: false, href: '/dashboard/dance-types' },
    { title: t('dashboard.setupPackages'), completed: false, href: '/dashboard/packages' },
    { title: t('dashboard.setupPayment'), completed: false, href: '/dashboard/settings' },
  ]

  return (
    <div className="space-y-4 md:space-y-6 lg:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#111827]">{t('dashboard.welcome')}</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">{t('dashboard.todaysOverview')}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="border-[#E5E7EB] hover:shadow-md transition-shadow">
              <CardContent className="pt-4 md:pt-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-gray-600 mb-1 truncate">{stat.label}</p>
                    <p className="text-2xl sm:text-3xl font-bold text-[#111827] break-words">{stat.value}</p>
                  </div>
                  <div className={`p-2 md:p-3 bg-gray-100 rounded-lg ${stat.color} flex-shrink-0`}>
                    <Icon className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Growth Rate & Revenue Chart Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        {/* Growth Rate Card */}
        <Card className="border-[#E5E7EB] lg:col-span-1">
          <CardHeader className="pb-3 md:pb-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg sm:text-xl">{t('dashboard.growthRate')}</CardTitle>
                <CardDescription className="text-xs sm:text-sm">{t('dashboard.monthlyGrowth')}</CardDescription>
              </div>
              <div className={`p-2 md:p-3 rounded-lg ${growthRate >= 0 ? 'bg-green-100' : 'bg-red-100'} flex-shrink-0`}>
                {growthRate >= 0 ? (
                  <ArrowUpRight className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
                ) : (
                  <ArrowDownRight className="w-5 h-5 md:w-6 md:h-6 text-red-600" />
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl md:text-4xl font-bold ${growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {growthRate >= 0 ? '+' : ''}{growthRate.toFixed(1)}%
            </p>
            <p className="text-xs sm:text-sm text-gray-600 mt-2">
              {formatCurrency(lastMonthRevenue, organization?.currency || 'TRY')}
              <span className="text-gray-400 mx-1">→</span>
              {formatCurrency(revenue, organization?.currency || 'TRY')}
            </p>
          </CardContent>
        </Card>

        {/* Revenue Chart */}
        {chartData.length > 0 && (
          <div className="lg:col-span-3">
            <RevenueChart data={chartData} currency={organization?.currency || 'TRY'} />
          </div>
        )}
      </div>

      {/* Quick Actions, Getting Started, Recent Activity Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        {/* Quick Actions */}
        <div>
          <Card className="border-[#E5E7EB]">
            <CardHeader className="pb-3 md:pb-6">
              <CardTitle className="text-lg sm:text-xl">{t('dashboard.quickActions')}</CardTitle>
              <CardDescription className="text-xs sm:text-sm">{t('dashboard.commonTasks')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <Link key={action.label} href={action.href}>
                    <Button
                      variant="outline"
                      className="w-full justify-between border-[#E5E7EB] text-[#111827] hover:bg-gray-50 text-xs md:text-sm h-9 md:h-10"
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{action.label}</span>
                      </span>
                      <ArrowRight className="w-4 h-4 flex-shrink-0" />
                    </Button>
                  </Link>
                )
              })}
            </CardContent>
          </Card>
        </div>

        {/* Getting Started Checklist */}
        <div>
          <Card className="border-[#E5E7EB]">
            <CardHeader className="pb-3 md:pb-6">
              <CardTitle className="text-lg sm:text-xl">{t('dashboard.gettingStarted')}</CardTitle>
              <CardDescription className="text-xs sm:text-sm">{t('dashboard.setupYourStudio')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 md:space-y-3">
                {gettingStarted.map((item) => (
                  <Link key={item.title} href={item.href}>
                    <div className="flex items-center gap-3 p-2 md:p-3 rounded-lg hover:bg-gray-50 cursor-pointer border border-transparent hover:border-[#E5E7EB] transition-colors">
                      {item.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                      ) : (
                        <Clock className="w-5 h-5 text-gray-400 shrink-0" />
                      )}
                      <span className={`text-xs md:text-sm ${item.completed ? 'text-gray-500 line-through' : 'text-[#111827]'}`}>
                        {item.title}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div>
          <RecentActivityCard activities={recentActivities} />
        </div>
      </div>

      {/* Upcoming Courses - Full Width */}
      <UpcomingCoursesCard upcomingCourses={upcomingCourses} />
    </div>
  )
}

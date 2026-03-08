'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, BookOpen, Calendar, TrendingUp, ArrowRight, CheckCircle2, Clock, AlertCircle } from 'lucide-react'

export default function DashboardPage() {
  const stats = [
    { label: 'Total Students', value: '0', icon: Users, color: 'text-blue-600' },
    { label: 'Active Courses', value: '0', icon: BookOpen, color: 'text-purple-600' },
    { label: 'This Month Sessions', value: '0', icon: Calendar, color: 'text-green-600' },
    { label: 'Revenue', value: 'R$ 0', icon: TrendingUp, color: 'text-orange-600' },
  ]

  const quickActions = [
    { label: 'Add Student', href: '/students/new', icon: Users },
    { label: 'Create Course', href: '/courses/new', icon: BookOpen },
    { label: 'View Calendar', href: '/calendar', icon: Calendar },
    { label: 'Manage Branches', href: '/branches', icon: AlertCircle },
  ]

  const gettingStarted = [
    { title: 'Set up instructors', completed: false, href: '/instructors' },
    { title: 'Add dance types', completed: false, href: '/dance-types' },
    { title: 'Create course packages', completed: false, href: '/packages' },
    { title: 'Configure payment methods', completed: false, href: '/settings' },
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
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                      ) : (
                        <Clock className="w-5 h-5 text-gray-400 flex-shrink-0" />
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

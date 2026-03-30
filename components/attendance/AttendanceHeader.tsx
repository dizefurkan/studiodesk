'use client'

import Link from 'next/link'
import { AttendanceDateSelector } from './AttendanceDateSelector'
import { AttendanceStats } from './AttendanceStats'
import { useTranslations } from 'next-intl'

interface AttendanceHeaderProps {
  courseName: string
  selectedDate: string
  onDateChange: (date: string) => void
  attendanceHistory?: any[]
  totalEnrolled?: number
  presentCount?: number
  absentCount?: number
}

export function AttendanceHeader({
  courseName,
  selectedDate,
  onDateChange,
  attendanceHistory = [],
  totalEnrolled = 0,
  presentCount = 0,
  absentCount = 0,
}: AttendanceHeaderProps) {
  const t = useTranslations()
  return (
    <div className="space-y-3">
      <div>
        <Link href="/dashboard/attendance" className="text-[#4F46E5] hover:underline mb-4 inline-block text-sm">
          ← {t('attendance.back')}
        </Link>
      </div>
      
      {/* Mobile: stacked, Desktop: side by side */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-[#111827]">{courseName}</h1>
          <p className="text-sm text-gray-600 mt-1">{t('attendance.recordAndManage')}</p>
          
          {/* Minimalist Stats Row */}
          <div className="mt-3">
            <AttendanceStats
              totalEnrolled={totalEnrolled}
              presentCount={presentCount}
              absentCount={absentCount}
            />
          </div>
        </div>
        
        {/* Date Selector - 100% on mobile, auto on desktop */}
        <div className="flex justify-end w-full md:w-auto md:min-w-80">
          <AttendanceDateSelector 
            selectedDate={selectedDate} 
            onDateChange={onDateChange}
            attendanceHistory={attendanceHistory}
          />
        </div>
      </div>
    </div>
  )
}

'use client'

import { Users, CheckCircle, AlertCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface AttendanceStatsProps {
  totalEnrolled: number
  presentCount: number
  absentCount: number
}

export function AttendanceStats({
  totalEnrolled,
  presentCount,
  absentCount,
}: AttendanceStatsProps) {
  const t = useTranslations()
  return (
    <div className="flex gap-4 flex-wrap text-sm">
      <div className="flex items-center gap-2">
        <Users size={18} className="text-blue-600" />
        <span className="text-gray-700">
          <span className="font-semibold text-[#111827]">{totalEnrolled}</span> {t('attendance.enrolled')}
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <CheckCircle size={18} className="text-green-600" />
        <span className="text-gray-700">
          <span className="font-semibold text-[#111827]">{presentCount}</span> {t('attendance.present')}
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <AlertCircle size={18} className="text-red-600" />
        <span className="text-gray-700">
          <span className="font-semibold text-[#111827]">{absentCount}</span> {t('attendance.absent')}
        </span>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertCircle, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'

const WEEK_DAYS = [
  { value: 0, label: 'Pazar (Sunday)' },
  { value: 1, label: 'Pazartesi (Monday)' },
  { value: 2, label: 'Salı (Tuesday)' },
  { value: 3, label: 'Çarşamba (Wednesday)' },
  { value: 4, label: 'Perşembe (Thursday)' },
  { value: 5, label: 'Cuma (Friday)' },
  { value: 6, label: 'Cumartesi (Saturday)' },
]

const TIMEZONES = [
  { value: 'Europe/Istanbul', label: 'Türkiye (UTC+3)' },
  { value: 'Europe/London', label: 'London (UTC+0)' },
  { value: 'Europe/Paris', label: 'Paris (UTC+1)' },
  { value: 'America/New_York', label: 'New York (UTC-5)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (UTC-8)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (UTC+9)' },
]

interface AttendanceConfig {
  week_start_day: number
  timezone: string
  virtual_sessions_weeks: number
  attendance_per_week_limit: number
  allow_makeup_sessions: boolean
}

export default function AttendanceSettingsPage() {
  const router = useRouter()
  const [config, setConfig] = useState<AttendanceConfig>({
    week_start_day: 1,
    timezone: 'Europe/Istanbul',
    virtual_sessions_weeks: 12,
    attendance_per_week_limit: 1,
    allow_makeup_sessions: true,
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/organization/settings')
      if (res.ok) {
        const data = await res.json()
        setConfig(data)
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/organization/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })

      if (res.ok) {
        setMessage({ type: 'success', text: '✅ Settings saved successfully!' })
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({ type: 'error', text: '❌ Failed to save settings' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: '❌ Error saving settings' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#111827]">Attendance Settings</h1>
        <p className="text-gray-600 mt-1">Configure how sessions and attendance tracking work</p>
      </div>

      {/* Message */}
      {message && (
        <Card className={`border-2 p-4 ${message.type === 'success' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
          <p className={message.type === 'success' ? 'text-green-900' : 'text-red-900'}>
            {message.text}
          </p>
        </Card>
      )}

      {/* Settings Form */}
      <Card className="border-[#E5E7EB] p-6 space-y-6">
        {/* Week Start */}
        <div>
          <label className="block text-sm font-medium text-[#374151] mb-2">
            Week Start Day
          </label>
          <select
            value={config.week_start_day}
            onChange={(e) => setConfig({ ...config, week_start_day: parseInt(e.target.value) })}
            className="w-full border border-[#D1D5DB] rounded px-3 py-2 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
          >
            {WEEK_DAYS.map((day) => (
              <option key={day.value} value={day.value}>
                {day.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            The first day of the week (for attendance tracking)
          </p>
        </div>

        {/* Timezone */}
        <div>
          <label className="block text-sm font-medium text-[#374151] mb-2">
            Timezone
          </label>
          <select
            value={config.timezone}
            onChange={(e) => setConfig({ ...config, timezone: e.target.value })}
            className="w-full border border-[#D1D5DB] rounded px-3 py-2 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Used for date calculations and session generation
          </p>
        </div>

        {/* Virtual Sessions Look-ahead */}
        <div>
          <label className="block text-sm font-medium text-[#374151] mb-2">
            Virtual Sessions Look-ahead (weeks)
          </label>
          <Input
            type="number"
            min="1"
            max="52"
            value={config.virtual_sessions_weeks}
            onChange={(e) => setConfig({ ...config, virtual_sessions_weeks: parseInt(e.target.value) })}
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            How many weeks ahead to show planned sessions in calendar (calculated, not stored in DB)
          </p>
        </div>

        {/* Attendance Per Week Limit */}
        <div>
          <label className="block text-sm font-medium text-[#374151] mb-2">
            Attendance Per Course Per Week
          </label>
          <Input
            type="number"
            min="1"
            max="7"
            value={config.attendance_per_week_limit}
            onChange={(e) =>
              setConfig({ ...config, attendance_per_week_limit: parseInt(e.target.value) })
            }
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            Maximum times a course can have attendance recorded per week (usually 1)
          </p>
        </div>

        {/* Allow Makeup Sessions */}
        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config.allow_makeup_sessions}
              onChange={(e) => setConfig({ ...config, allow_makeup_sessions: e.target.checked })}
              className="w-4 h-4 rounded border-[#D1D5DB]"
            />
            <span className="text-sm font-medium text-[#374151]">Allow Make-up Sessions</span>
          </label>
          <p className="text-xs text-gray-500 mt-1 ml-7">
            Allow instructors to record attendance for different days (e.g., Monday class on Tuesday)
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded p-4 flex gap-3">
          <AlertCircle className="text-blue-600 shrink-0 mt-0.5" size={20} />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">How it works:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Virtual sessions are calculated from day_of_week (no DB storage)</li>
              <li>Calendar shows plan sessions for look-ahead weeks</li>
              <li>Actual sessions are created on-demand when attendance is recorded</li>
              <li>Only recorded attendance sessions consume database storage</li>
            </ul>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t border-[#E5E7EB] flex gap-2">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#4F46E5] hover:bg-[#4338CA] text-white gap-2"
          >
            <Check size={18} />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </Card>
    </div>
  )
}

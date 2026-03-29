'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, Mail } from 'lucide-react'

export default function RegisterPage() {
  const t = useTranslations()
  const router = useRouter()

  useEffect(() => {
    // Redirect to login after 5 seconds
    const timer = setTimeout(() => {
      router.push('/login')
    }, 5000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="space-y-6">
      <Card className="border-[#E5E7EB] p-8 bg-linear-to-br from-blue-50 to-white">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-blue-100 rounded-lg">
            <AlertCircle className="text-blue-600" size={32} />
          </div>
        </div>

        {/* Heading */}
        <h2 className="text-2xl font-bold text-[#111827] text-center mb-3">
          {t('auth.register')}
        </h2>

        {/* Message */}
        <div className="text-center space-y-4 mb-8">
          <p className="text-gray-600">
            Direct signups are currently disabled to maintain security and control.
          </p>
          <p className="text-gray-600">
            <strong>To create an account:</strong> Ask your administrator to invite you via email.
          </p>
          <p className="text-sm text-gray-500">
            You'll receive an invitation link to set up your account and join your organization.
          </p>
        </div>

        {/* CTA */}
        <div className="space-y-3">
          <p className="text-sm text-gray-600 text-center">
            Already have an invitation? You can accept it directly.
          </p>
          <Button
            onClick={() => router.push('/login')}
            className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white"
          >
            {t('auth.login')}
          </Button>
        </div>

        {/* Auto-redirect notice */}
        <div className="mt-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
          <div className="flex items-center justify-center gap-2 text-blue-700 text-sm">
            <Mail size={16} />
            <span>Redirecting to login in 5 seconds...</span>
          </div>
        </div>
      </Card>
    </div>
  )
}

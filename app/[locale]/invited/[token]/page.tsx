'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle, Loader2, Mail } from 'lucide-react'
import { getInvitationByToken, acceptInvitation } from '@/lib/actions/invitations.actions'

export default function InvitationPage() {
  const router = useRouter()
  const params = useParams()
  const token = params.token as string

  const [loading, setLoading] = useState(true)
  const [invitation, setInvitation] = useState<any>(null)
  const [error, setError] = useState<string>('')
  const [step, setStep] = useState<'load' | 'signup' | 'success'>('load')

  // Form states
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadInvitation()
  }, [token])

  const loadInvitation = async () => {
    setLoading(true)
    try {
      const result = await getInvitationByToken(token)

      if (result.error) {
        setError(result.error)
        setStep('load')
      } else {
        setInvitation(result.data)
        setStep('signup')
      }
    } catch (err) {
      setError('Failed to load invitation')
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!fullName.trim()) {
      setError('Please enter your full name')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const result = await acceptInvitation(token, fullName, password)

      if (result.error) {
        setError(result.error)
      } else {
        setStep('success')
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      }
    } catch (err) {
      setError('Failed to create account')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-[#F3F4F6] to-[#E5E7EB] p-4">
        <Card className="w-full max-w-md border-[#E5E7EB] p-8 text-center">
          <Loader2 className="mx-auto animate-spin text-[#4F46E5] mb-4" size={32} />
          <p className="text-gray-600">Loading invitation...</p>
        </Card>
      </div>
    )
  }

  if (error && step === 'load') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-[#F3F4F6] to-[#E5E7EB] p-4">
        <Card className="w-full max-w-md border-[#E5E7EB] p-8">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-red-50 p-3 rounded-lg">
              <AlertCircle className="text-red-600" size={24} />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-[#111827] text-center mb-3">Invalid Invitation</h1>
          <p className="text-gray-600 text-center mb-6">{error}</p>

          <Button
            onClick={() => router.push('/login')}
            className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white"
          >
            Back to Login
          </Button>
        </Card>
      </div>
    )
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-[#F3F4F6] to-[#E5E7EB] p-4">
        <Card className="w-full max-w-md border-[#E5E7EB] p-8">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-green-50 p-3 rounded-lg">
              <CheckCircle className="text-green-600" size={32} />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-[#111827] text-center mb-3">Account Created!</h1>
          <p className="text-gray-600 text-center mb-2">
            Welcome to {invitation?.organizations?.name}
          </p>
          <p className="text-sm text-gray-500 text-center mb-6">
            Redirecting you to login page...
          </p>

          <Button
            onClick={() => router.push('/login')}
            className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white"
          >
            Go to Login
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-[#F3F4F6] to-[#E5E7EB] p-4">
      <Card className="w-full max-w-md border-[#E5E7EB]">
        {/* Header */}
        <div className="bg-linear-to-r from-[#4F46E5] to-[#4338CA] p-8 text-white">
          <div className="flex items-center justify-center mb-3">
            <Mail size={32} />
          </div>
          <h1 className="text-2xl font-bold text-center mb-1">You're Invited!</h1>
          <p className="text-center text-blue-100">
            to {invitation?.organizations?.name}
          </p>
        </div>

        {/* Form */}
        <div className="p-8">
          <div className="mb-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
            <p className="text-sm text-blue-900">
              <strong>Email:</strong> {invitation?.email}
            </p>
            <p className="text-sm text-blue-900 mt-1">
              <strong>Role:</strong>{' '}
              {invitation?.role.charAt(0).toUpperCase() + invitation?.role.slice(1)}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                At least 8 characters, containing uppercase, lowercase, and numbers
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin" size={18} />
                  Creating Account...
                </div>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          <p className="text-xs text-gray-500 text-center mt-6">
            By signing up, you agree to the Terms of Service
          </p>
        </div>
      </Card>
    </div>
  )
}

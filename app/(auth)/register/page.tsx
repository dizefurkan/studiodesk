'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signUp } from '@/lib/actions/auth.actions'
import { Loader2, Check } from 'lucide-react'

const PASSWORD_REQUIREMENTS = [
  { min: 8, label: 'At least 8 characters' },
  { regex: /[A-Z]/, label: 'One uppercase letter' },
  { regex: /[a-z]/, label: 'One lowercase letter' },
  { regex: /[0-9]/, label: 'At least one number' },
]

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const passwordStrength = {
    hasMinLength: formData.password.length >= 8,
    hasUppercase: /[A-Z]/.test(formData.password),
    hasLowercase: /[a-z]/.test(formData.password),
    hasNumber: /[0-9]/.test(formData.password),
  }

  const isPasswordValid = Object.values(passwordStrength).every(Boolean)
  const passwordsMatch = formData.password === formData.confirmPassword && formData.password.length > 0

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    if (!isPasswordValid) {
      setError('Password does not meet all requirements')
      return
    }

    if (!passwordsMatch) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const result = await signUp({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
      })
      
      if (result.error) {
        setError(result.error)
        setLoading(false)
        return
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/onboarding')
      }, 2000)
    } catch (err) {
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-[#111827]">Account Created!</h2>
        <p className="text-gray-600">Redirecting to onboarding...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#111827] mb-2">Create Your Account</h2>
        <p className="text-gray-600">Join thousands of dance studios using StudioDesk</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="fullName" className="text-[#111827]">Full Name</Label>
          <Input
            id="fullName"
            type="text"
            name="fullName"
            placeholder="Your name"
            value={formData.fullName}
            onChange={handleChange}
            required
            disabled={loading}
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="email" className="text-[#111827]">Email Address</Label>
          <Input
            id="email"
            type="email"
            name="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={loading}
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="password" className="text-[#111827]">Password</Label>
          <Input
            id="password"
            type="password"
            name="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            required
            disabled={loading}
            className="mt-2"
          />
          
          {/* Password Requirements */}
          <div className="mt-3 space-y-2">
            {[
              { key: 'hasMinLength', label: PASSWORD_REQUIREMENTS[0].label, check: passwordStrength.hasMinLength },
              { key: 'hasUppercase', label: PASSWORD_REQUIREMENTS[1].label, check: passwordStrength.hasUppercase },
              { key: 'hasLowercase', label: PASSWORD_REQUIREMENTS[2].label, check: passwordStrength.hasLowercase },
              { key: 'hasNumber', label: PASSWORD_REQUIREMENTS[3].label, check: passwordStrength.hasNumber },
            ].map(({ key, label, check }) => (
              <div key={key} className="flex items-center gap-2 text-sm">
                <div className={`w-4 h-4 rounded-full ${check ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className={check ? 'text-green-600' : 'text-gray-600'}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="confirmPassword" className="text-[#111827]">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            name="confirmPassword"
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            disabled={loading}
            className="mt-2"
          />
          {formData.confirmPassword && !passwordsMatch && (
            <p className="text-red-600 text-sm mt-2">Passwords do not match</p>
          )}
          {formData.confirmPassword && passwordsMatch && (
            <p className="text-green-600 text-sm mt-2">Passwords match ✓</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={loading || !isPasswordValid || !passwordsMatch}
          className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating account...
            </>
          ) : (
            'Create Account'
          )}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-600">Already have an account?</span>
        </div>
      </div>

      <Link href="/login">
        <Button variant="outline" className="w-full border-[#4F46E5] text-[#4F46E5] hover:bg-[#4F46E5]/5">
          Sign In
        </Button>
      </Link>
    </div>
  )
}

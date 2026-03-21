'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { createOrganizationWithBranch, checkShouldShowOnboarding } from '@/lib/actions/auth.actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

const onboardingSchema = z.object({
  organizationName: z
    .string()
    .min(3, 'Organization name must be at least 3 characters')
    .max(255, 'Organization name must be at most 255 characters'),
  branchName: z
    .string()
    .min(2, 'Branch name must be at least 2 characters')
    .max(255, 'Branch name must be at most 255 characters'),
})

type OnboardingFormValues = z.infer<typeof onboardingSchema>

export default function OnboardingPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [step, setStep] = useState<'info' | 'success'>('info')
  const [isChecking, setIsChecking] = useState(true)

  // Check if user should see onboarding (owner with no branches)
  useEffect(() => {
    async function checkOnboarding() {
      try {
        const result = await checkShouldShowOnboarding()
        if (!result.shouldShow) {
          // Not an owner or already has branches - skip to dashboard
          router.push('/dashboard')
          return
        }
      } catch (error) {
        console.error('Error checking onboarding:', error)
      } finally {
        setIsChecking(false)
      }
    }

    checkOnboarding()
  }, [router])

  // Auto-redirect if still checking
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      organizationName: '',
      branchName: '',
    },
  })

  async function onSubmit(data: OnboardingFormValues) {
    setIsLoading(true)
    setGeneralError(null)

    try {
      const result = await createOrganizationWithBranch({
        organizationName: data.organizationName,
        branchName: data.branchName,
      })

      if (result.error) {
        setGeneralError(result.error)
        setIsLoading(false)
        return
      }

      setStep('success')
      setTimeout(() => {
        router.push('/dashboard')
      }, 2500)
    } catch (error) {
      console.error('Onboarding error:', error)
      setGeneralError('An unexpected error occurred')
      setIsLoading(false)
    }
  }

  // Show loading screen while checking if branches exist
  if (isChecking) {
    return (
      <div className="min-h-screen bg-linear-to-br from-[#111827] via-[#1F2937] to-[#4F46E5] flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="pt-8">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#4F46E5] animate-pulse"></div>
                <p className="text-sm text-[#6B7280]">Loading...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-linear-to-br from-[#111827] via-[#1F2937] to-[#4F46E5] flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="pt-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-6">
                <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-[#111827] mb-2">All Set!</h2>
              <p className="text-[#6B7280] mb-6">
                Your organization and first branch have been created successfully.
              </p>
              <div className="flex items-center justify-center gap-2 text-[#4F46E5]">
                <div className="w-2 h-2 rounded-full bg-[#4F46E5] animate-pulse"></div>
                <p className="text-sm">Redirecting to dashboard...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-[#111827] via-[#1F2937] to-[#4F46E5] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>Welcome to StudioDesk!</CardTitle>
            <CardDescription>
              Let's set up your dance studio
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                {/* Step Indicator */}
                <div className="flex gap-2 mb-6">
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-[#4F46E5] mb-1">Step 1 of 2</div>
                    <h3 className="text-sm font-semibold text-[#111827]">Organization Details</h3>
                  </div>
                </div>

                {/* Organization Name Field */}
                <FormField
                  control={form.control}
                  name="organizationName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., DanceFusion Studio"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Branch Name Field */}
                <FormField
                  control={form.control}
                  name="branchName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Branch Location</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Downtown Studio"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* General Error */}
                {generalError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{generalError}</p>
                  </div>
                )}

                {/* Helpful Text */}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-600">
                    💡 You can add more locations and details later from the dashboard.
                  </p>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Setting up...' : 'Get Started'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-[#9CA3AF] text-sm mt-6">
          This will create your organization as an owner with full access.
        </p>
      </div>
    </div>
  )
}

'use client'

import { useRouter } from '@/i18n/navigation'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { createInstructor, updateInstructor } from '@/lib/actions/instructors.actions'
import type { Database } from '@/lib/types/database.types'

type Instructor = Database['public']['Tables']['instructors']['Row']

// Fallback schema for type inference
type InstructorFormValues = z.infer<ReturnType<typeof createInstructorSchema>>

// Schema factory that uses translations
function createInstructorSchema(t: ReturnType<typeof useTranslations>) {
  return z.object({
    firstName: z.string().min(2, t('validation.firstNameMinLength')),
    lastName: z.string().min(2, t('validation.lastNameMinLength')),
    email: z.string().email(t('validation.invalidEmail')),
    phone: z.string().optional(),
  })
}

interface InstructorFormProps {
  instructor?: Instructor
}

export function InstructorForm({ instructor }: InstructorFormProps) {
  const tx = useTranslations('instructorForm')
  const tf = useTranslations('forms')
  const t = useTranslations()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [generalError, setGeneralError] = useState<string | null>(null)

  const instructorSchema = createInstructorSchema(t)

  const form = useForm<InstructorFormValues>({
    resolver: zodResolver(instructorSchema),
    defaultValues: {
      firstName: instructor?.first_name || '',
      lastName: instructor?.last_name || '',
      email: instructor?.email || '',
      phone: instructor?.phone || '',
    },
  })

  async function onSubmit(data: InstructorFormValues) {
    setIsLoading(true)
    setGeneralError(null)

    try {
      const result = instructor
        ? await updateInstructor(instructor.id, {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone ? data.phone : null,
          })
        : await createInstructor({
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone ? data.phone : undefined,
          })

      console.log('Instructor form result:', result)

      if (result.error) {
        setGeneralError(result.error)
      } else if (result.success) {
        console.log('Redirecting to /dashboard/instructors')
        router.push('/dashboard/instructors')
      }
    } catch (error) {
      console.error('Form error:', error)
      setGeneralError(tf('unexpectedError'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-border">
      <div className="p-4 sm:p-6 md:p-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-2">
          {instructor ? tx('editTitle') : tx('addTitle')}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mb-4 md:mb-6">
          {instructor ? tx('editDescription') : tx('addDescription')}
        </p>

        {generalError && (
          <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/30">{generalError}</div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tf('firstName')}</FormLabel>
                    <FormControl>
                      <Input placeholder={tf('firstNamePlaceholder')} disabled={isLoading} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tf('lastName')}</FormLabel>
                    <FormControl>
                      <Input placeholder={tf('lastNamePlaceholder')} disabled={isLoading} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tf('email')}</FormLabel>
                  <FormControl>
                    <Input placeholder={tf('emailPlaceholder')} type="email" disabled={isLoading} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tf('phoneOptional')}</FormLabel>
                  <FormControl>
                    <Input placeholder={tf('phonePlaceholder')} disabled={isLoading} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 pt-4 md:pt-6">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto text-sm md:text-base h-9 md:h-10"
              >
                {isLoading ? tf('saving') : instructor ? tx('update') : tx('create')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
                className="border-border w-full sm:w-auto text-sm md:text-base h-9 md:h-10"
              >
                {tf('cancel')}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </Card>
  )
}

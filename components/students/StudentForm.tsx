'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { createStudent, updateStudent } from '@/lib/actions/students.actions'
import { Textarea } from '@/components/ui/textarea'
import type { Database } from '@/lib/types/database.types'

type Student = Database['public']['Tables']['students']['Row']

// Fallback schema for type inference
const studentSchemaFallback = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  notes: z.string().optional(),
})

type StudentFormValues = z.infer<typeof studentSchemaFallback>

// Schema factory that uses translations
function createStudentSchema(t: ReturnType<typeof useTranslations>) {
  return z.object({
    firstName: z.string().min(2, t('validation.firstNameMinLength')),
    lastName: z.string().min(2, t('validation.lastNameMinLength')),
    email: z.string().email(t('validation.invalidEmail')),
    phone: z.string().optional(),
    notes: z.string().optional(),
  })
}

interface StudentFormProps {
  student?: Student
}

export function StudentForm({ student }: StudentFormProps) {
  const t = useTranslations()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [generalError, setGeneralError] = useState<string | null>(null)

  const studentSchema = createStudentSchema(t)

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      firstName: student?.first_name || '',
      lastName: student?.last_name || '',
      email: student?.email || '',
      phone: student?.phone || '',
      notes: student?.notes || '',
    },
  })

  async function onSubmit(data: StudentFormValues) {
    setIsLoading(true)
    setGeneralError(null)

    try {
      const result = student
        ? await updateStudent(student.id, {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone || null,
            notes: data.notes || null,
          })
        : await createStudent({
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone,
            notes: data.notes,
          })

      if (result.error) {
        setGeneralError(result.error)
      } else if (result.success) {
        console.log('Student form result:', result)
        console.log('Redirecting to /dashboard/students')
        router.push('/dashboard/students')
      }
    } catch (error) {
      console.error('Form error:', error)
      setGeneralError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-border w-full max-w-2xl">
      <div className="p-3 sm:p-4 md:p-6 lg:p-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-2">
          {student ? t('students.editStudent') : t('students.addNew')}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mb-4 md:mb-6">
          {student ? t('students.updateInformationMessage') : t('students.addNewStudentMessage')}
        </p>

        {generalError && (
          <div className="mb-4 md:mb-6 p-3 md:p-4 bg-red-50 text-red-600 rounded-lg border border-red-200 text-sm">{generalError}</div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-6">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('auth.firstName')}</FormLabel>
                    <FormControl>
                      <Input placeholder="John" disabled={isLoading} {...field} />
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
                    <FormLabel>{t('auth.lastName')}</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" disabled={isLoading} {...field} />
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
                  <FormLabel>{t('auth.email')}</FormLabel>
                  <FormControl>
                    <Input placeholder="john@example.com" type="email" disabled={isLoading} {...field} />
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
                  <FormLabel>{t('students.phone')}</FormLabel>
                  <FormControl>
                    <Input placeholder="+55 11 99999-9999" disabled={isLoading} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any notes about the student..."
                      disabled={isLoading}
                      rows={4}
                      {...field}
                    />
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
                {isLoading ? t('common.saving') : student ? t('students.updateStudent') : t('students.createStudent')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
                className="border-border w-full sm:w-auto text-sm md:text-base h-9 md:h-10"
              >
                {t('common.cancel')}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </Card>
  )
}

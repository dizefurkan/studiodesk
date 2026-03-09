'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { createDanceType, updateDanceType } from '@/lib/actions/dance-types.actions'
import type { Database } from '@/lib/types/database.types'

type DanceType = Database['public']['Tables']['dance_types']['Row']

const danceTypeSchema = z.object({
  name: z.string().min(2, 'Dance type name must be at least 2 characters'),
  description: z.string().optional(),
})

type DanceTypeFormValues = z.infer<typeof danceTypeSchema>

interface DanceTypeFormProps {
  danceType?: DanceType
}

export function DanceTypeForm({ danceType }: DanceTypeFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [generalError, setGeneralError] = useState<string | null>(null)

  const form = useForm<DanceTypeFormValues>({
    resolver: zodResolver(danceTypeSchema),
    defaultValues: {
      name: danceType?.name || '',
      description: danceType?.description || '',
    },
  })

  async function onSubmit(data: DanceTypeFormValues) {
    setIsLoading(true)
    setGeneralError(null)

    try {
      const result = danceType
        ? await updateDanceType(danceType.id, {
            name: data.name,
            description: data.description || null,
          })
        : await createDanceType({
            name: data.name,
            description: data.description,
          })

      if (result.error) {
        setGeneralError(result.error)
      } else if (result.success) {
        console.log('Dance type form result:', result)
        console.log('Redirecting to /dashboard/dance-types')
        router.push('/dashboard/dance-types')
      }
    } catch (error) {
      console.error('Form error:', error)
      setGeneralError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-[#E5E7EB] max-w-2xl">
      <div className="p-8">
        <h1 className="text-2xl font-bold text-[#111827] mb-2">
          {danceType ? 'Edit Dance Type' : 'Add New Dance Type'}
        </h1>
        <p className="text-gray-600 mb-6">
          {danceType ? 'Update dance type information' : 'Add a new dance style to your catalog'}
        </p>

        {generalError && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">{generalError}</div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dance Type Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Ballet, Hip Hop, Contemporary" disabled={isLoading} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <textarea
                      placeholder="Describe this dance style..."
                      disabled={isLoading}
                      className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-[#4F46E5] hover:bg-[#4338CA] text-white"
              >
                {isLoading ? 'Saving...' : danceType ? 'Update Dance Type' : 'Create Dance Type'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
                className="border-[#E5E7EB]"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </Card>
  )
}

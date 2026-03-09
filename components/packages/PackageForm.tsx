'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { createPackage, updatePackage } from '@/lib/actions/packages.actions'
import { getDanceTypes } from '@/lib/actions/dance-types.actions'
import type { Database } from '@/lib/types/database.types'

type Package = Database['public']['Tables']['packages']['Row']
type DanceType = Database['public']['Tables']['dance_types']['Row']

const packageSchema = z.object({
  name: z.string().min(2, 'Package name must be at least 2 characters'),
  danceTypeId: z.string().min(1, 'Please select a dance type'),
  totalCredits: z.coerce.number().min(1, 'Total credits must be at least 1'),
  price: z.coerce.number().min(0, 'Price must be a valid number'),
})

type PackageFormValues = z.infer<typeof packageSchema>

interface PackageFormProps {
  package?: Package
}

export function PackageForm({ package: pkgProp }: PackageFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [danceTypes, setDanceTypes] = useState<DanceType[]>([])
  const [generalError, setGeneralError] = useState<string | null>(null)

  const form = useForm<PackageFormValues>({
    resolver: zodResolver(packageSchema),
    defaultValues: {
      name: pkgProp?.name || '',
      danceTypeId: pkgProp?.dance_type_id || '',
      totalCredits: pkgProp?.total_credits || 0,
      price: pkgProp?.price || 0,
    },
  })

  useEffect(() => {
    async function loadDanceTypes() {
      const result = await getDanceTypes()
      if (result.data) {
        setDanceTypes(result.data)
      }
    }
    loadDanceTypes()
  }, [])

  async function onSubmit(data: PackageFormValues) {
    setIsLoading(true)
    setGeneralError(null)

    try {
      const result = pkgProp
        ? await updatePackage(pkgProp.id, {
            name: data.name,
            danceTypeId: data.danceTypeId,
            totalCredits: data.totalCredits,
            price: data.price,
          })
        : await createPackage({
            name: data.name,
            danceTypeId: data.danceTypeId,
            totalCredits: data.totalCredits,
            price: data.price,
          })

      if (result.error) {
        setGeneralError(result.error)
      } else if (result.success) {
        router.push('/dashboard/packages')
        router.refresh()
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
          {pkgProp ? 'Edit Package' : 'Add New Package'}
        </h1>
        <p className="text-gray-600 mb-6">
          {pkgProp ? 'Update package information' : 'Create a new credit package for students'}
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
                  <FormLabel>Package Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., 10 Classes Package, Monthly Unlimited"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="danceTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dance Type</FormLabel>
                  <FormControl>
                    <select
                      disabled={isLoading}
                      className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                      {...field}
                    >
                      <option value="">Select a dance type</option>
                      {danceTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="totalCredits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Credits</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g., 10"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="e.g., 99.99"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-[#4F46E5] hover:bg-[#4338CA] text-white"
              >
                {isLoading ? 'Saving...' : pkgProp ? 'Update Package' : 'Create Package'}
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

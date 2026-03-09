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
import { createBranch, updateBranch } from '@/lib/actions/branches.actions'
import type { Database } from '@/lib/types/database.types'

type Branch = Database['public']['Tables']['branches']['Row']

const branchSchema = z.object({
  name: z.string().min(2, 'Branch name must be at least 2 characters'),
  address: z.string().optional(),
  phone: z.string().optional(),
})

type BranchFormValues = z.infer<typeof branchSchema>

interface BranchFormProps {
  branch?: Branch
}

export function BranchForm({ branch }: BranchFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [generalError, setGeneralError] = useState<string | null>(null)

  const form = useForm<BranchFormValues>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      name: branch?.name || '',
      address: branch?.address || '',
      phone: branch?.phone || '',
    },
  })

  async function onSubmit(data: BranchFormValues) {
    setIsLoading(true)
    setGeneralError(null)

    try {
      const result = branch
        ? await updateBranch(branch.id, {
            name: data.name,
            address: data.address || null,
            phone: data.phone || null,
          })
        : await createBranch({
            name: data.name,
            address: data.address,
            phone: data.phone,
          })

      if (result.error) {
        setGeneralError(result.error)
      } else if (result.success) {
        router.push('/dashboard/branches')
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
          {branch ? 'Edit Branch' : 'Add New Branch'}
        </h1>
        <p className="text-gray-600 mb-6">
          {branch ? 'Update branch information' : 'Add a new studio location'}
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
                  <FormLabel>Branch Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Downtown Studio" disabled={isLoading} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address (Optional)</FormLabel>
                  <FormControl>
                    <textarea
                      placeholder="Street address"
                      disabled={isLoading}
                      className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                      rows={3}
                      {...field}
                    />
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
                  <FormLabel>Phone (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="+55 11 3000-0000" disabled={isLoading} {...field} />
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
                {isLoading ? 'Saving...' : branch ? 'Update Branch' : 'Create Branch'}
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

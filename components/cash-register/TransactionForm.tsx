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
import { createTransaction } from '@/lib/actions/cash-register.actions'
import { getBranches } from '@/lib/actions/branches.actions'
import { useEffect } from 'react'
import type { Database } from '@/lib/types/database.types'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Textarea } from '@/components/ui/textarea'

type Branch = Database['public']['Tables']['branches']['Row']

const transactionSchema = z.object({
  branchId: z.string().min(1, 'Please select a branch'),
  type: z.enum(['income', 'expense']),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  description: z.string().min(3, 'Description must be at least 3 characters'),
})

type TransactionFormValues = z.infer<typeof transactionSchema>

export function TransactionForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [branches, setBranches] = useState<Branch[]>([])
  const [generalError, setGeneralError] = useState<string | null>(null)

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'income',
    },
  })

  useEffect(() => {
    async function loadBranches() {
      const result = await getBranches()
      setBranches(result.data || [])
    }
    loadBranches()
  }, [])

  async function onSubmit(data: TransactionFormValues) {
    setIsLoading(true)
    setGeneralError(null)

    try {
      const result = await createTransaction(data)

      if (result.error) {
        setGeneralError(result.error)
      } else if (result.success) {
        console.log('Transaction form result:', result)
        console.log('Redirecting to /dashboard/cash-register')
        router.push('/dashboard/cash-register')
      }
    } catch (error) {
      console.error('Form error:', error)
      setGeneralError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-border max-w-2xl">
      <div className="p-3 sm:p-4 md:p-6 lg:p-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-2">Record Transaction</h1>
        <p className="text-sm sm:text-base text-muted-foreground mb-4 md:mb-6">Add a new income or expense record</p>

        {generalError && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">{generalError}</div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
            <FormField
              control={form.control}
              name="branchId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Branch</FormLabel>
                  <FormControl>
                    <NativeSelect
                      disabled={isLoading}
                      className="w-full"
                      {...field}
                    >
                      <NativeSelectOption value="">Select a branch</NativeSelectOption>
                      {branches.map((branch) => (
                        <NativeSelectOption key={branch.id} value={branch.id}>
                          {branch.name}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transaction Type</FormLabel>
                  <FormControl>
                    <NativeSelect
                      disabled={isLoading}
                      className="w-full"
                      {...field}
                    >
                      <NativeSelectOption value="income">Income</NativeSelectOption>
                      <NativeSelectOption value="expense">Expense</NativeSelectOption>
                    </NativeSelect>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., Package sale, equipment purchase..."
                      disabled={isLoading}
                      className="w-full"
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
                {isLoading ? 'Recording...' : 'Record Transaction'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
                className="border-border w-full sm:w-auto text-sm md:text-base h-9 md:h-10"
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

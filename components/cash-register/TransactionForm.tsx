'use client'

import { useRouter } from '@/i18n/navigation'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { manualCategoriesFor, type CashCategory } from '@/lib/cash/categories'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { createTransaction } from '@/lib/actions/cash-register.actions'
import { getBranches } from '@/lib/actions/branches.actions'
import { useEffect } from 'react'
import type { Database } from '@/lib/types/database.types'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Textarea } from '@/components/ui/textarea'
import { useTranslations } from 'next-intl'

type Branch = Database['public']['Tables']['branches']['Row']

const makeTransactionSchema = (tx: (key: string) => string) =>
  z
    .object({
      branchId: z.string().min(1, tx('branchRequired')),
      type: z.enum(['income', 'expense']),
      category: z.string().min(1, tx('categoryRequired')),
      amount: z.coerce.number().min(0.01, tx('amountPositive')),
      description: z.string().optional(),
    })
    // "Other" says nothing by itself, so it needs a description
    .refine((v) => v.category !== 'other' || (v.description?.trim().length ?? 0) >= 3, {
      path: ['description'],
      message: tx('descriptionMin'),
    })

type TransactionFormValues = z.infer<ReturnType<typeof makeTransactionSchema>>

export function TransactionForm() {
  const tx = useTranslations('transactionForm')
  const tc = useTranslations('cashCategories')
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [branches, setBranches] = useState<Branch[]>([])
  const [generalError, setGeneralError] = useState<string | null>(null)

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(makeTransactionSchema(tx)),
    defaultValues: {
      type: 'income',
      category: manualCategoriesFor('income')[0],
      description: '',
    },
  })

  const type = useWatch({ control: form.control, name: 'type' })
  const category = useWatch({ control: form.control, name: 'category' })
  const isOther = category === 'other'

  useEffect(() => {
    async function loadBranches() {
      const result = await getBranches(undefined, 1, 500)
      const list = result.data || []
      setBranches(list)
      // A single branch needs no choice: use it
      if (list.length === 1) form.setValue('branchId', list[0].id, { shouldValidate: true })
    }
    loadBranches()
  }, [form])

  async function onSubmit(data: TransactionFormValues) {
    setIsLoading(true)
    setGeneralError(null)

    try {
      const result = await createTransaction({
        ...data,
        category: data.category as CashCategory,
        description: data.description?.trim() || null,
      })

      if (result.error) {
        setGeneralError(result.error)
      } else if (result.success) {
        router.push('/dashboard/cash-register')
      }
    } catch (error) {
      console.error('Form error:', error)
      setGeneralError(tx('unexpectedError'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-border max-w-2xl">
      <div className="p-3 sm:p-4 md:p-6 lg:p-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-2">{tx('title')}</h1>
        <p className="text-sm sm:text-base text-muted-foreground mb-4 md:mb-6">{tx('description')}</p>

        {generalError && (
          <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/30">{generalError}</div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
            {branches.length !== 1 && (
            <FormField
              control={form.control}
              name="branchId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tx('branch')}</FormLabel>
                  <FormControl>
                    <NativeSelect
                      disabled={isLoading}
                      className="w-full"
                      {...field}
                    >
                      <NativeSelectOption value="">{tx('selectBranch')}</NativeSelectOption>
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
            )}

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tx('type')}</FormLabel>
                  <FormControl>
                    <NativeSelect
                      disabled={isLoading}
                      className="w-full"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e)
                        // A category of the other type doesn't apply
                        form.setValue('category', manualCategoriesFor(e.target.value as 'income' | 'expense')[0])
                      }}
                    >
                      <NativeSelectOption value="income">{tx('income')}</NativeSelectOption>
                      <NativeSelectOption value="expense">{tx('expense')}</NativeSelectOption>
                    </NativeSelect>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tx('category')}</FormLabel>
                  <FormControl>
                    <NativeSelect disabled={isLoading} className="w-full" {...field}>
                      {manualCategoriesFor(type).map((c) => (
                        <NativeSelectOption key={c} value={c}>
                          {tc(c)}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  </FormControl>
                  <FormDescription>{tx('automaticHint')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tx('amount')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      disabled={isLoading}
                      {...field}
                      value={field.value ?? ''}
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
                  <FormLabel>{isOther ? tx('descriptionLabel') : tx('noteLabel')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={isOther ? tx('descriptionPlaceholder') : tx('notePlaceholder')}
                      disabled={isLoading}
                      className="w-full"
                      rows={isOther ? 4 : 2}
                      {...field}
                    />
                  </FormControl>
                  {isOther && <FormDescription>{tx('otherHint')}</FormDescription>}
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
                {isLoading ? tx('recording') : tx('title')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
                className="border-border w-full sm:w-auto text-sm md:text-base h-9 md:h-10"
              >
                {tx('cancel')}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </Card>
  )
}

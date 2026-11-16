'use client'

import { useRouter } from '@/i18n/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { createBranch, updateBranch } from '@/lib/actions/branches.actions'
import type { Database } from '@/lib/types/database.types'
import { Textarea } from '@/components/ui/textarea'
import { useTranslations } from 'next-intl'

type Branch = Database['public']['Tables']['branches']['Row']

const makeBranchSchema = (tx: (key: string) => string) => z.object({
  name: z.string().min(2, tx('nameMin')),
  address: z.string().optional(),
  phone: z.string().optional(),
})

type BranchFormValues = z.infer<ReturnType<typeof makeBranchSchema>>

interface BranchFormProps {
  branch?: Branch
}

export function BranchForm({ branch }: BranchFormProps) {
  const tx = useTranslations('branchForm')
  const tf = useTranslations('forms')
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [generalError, setGeneralError] = useState<string | null>(null)

  const form = useForm<BranchFormValues>({
    resolver: zodResolver(makeBranchSchema(tx)),
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
        console.log('Branch form result:', result)
        console.log('Redirecting to /dashboard/branches')
        router.push('/dashboard/branches')
      }
    } catch (error) {
      console.error('Form error:', error)
      setGeneralError(tf('unexpectedError'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-border max-w-2xl">
      <div className="p-3 sm:p-4 md:p-6 lg:p-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-2">
          {branch ? tx('editTitle') : tx('addTitle')}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mb-4 md:mb-6">
          {branch ? tx('editDescription') : tx('addDescription')}
        </p>

        {generalError && (
          <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/30">{generalError}</div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tx('name')}</FormLabel>
                  <FormControl>
                    <Input placeholder={tx('namePlaceholder')} disabled={isLoading} {...field} />
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
                  <FormLabel>{tf('addressOptional')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={tx('addressPlaceholder')}
                      disabled={isLoading}
                      className="w-full"
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
                  <FormLabel>{tf('phoneOptional')}</FormLabel>
                  <FormControl>
                    <Input placeholder="+55 11 3000-0000" disabled={isLoading} {...field} />
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
                {isLoading ? tf('saving') : branch ? tx('update') : tx('create')}
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

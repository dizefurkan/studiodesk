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
import { createDanceType, updateDanceType } from '@/lib/actions/dance-types.actions'
import type { Database } from '@/lib/types/database.types'
import { Textarea } from '@/components/ui/textarea'
import { useTranslations } from 'next-intl'

type DanceType = Database['public']['Tables']['dance_types']['Row']

const makeDanceTypeSchema = (tx: (key: string) => string) => z.object({
  name: z.string().min(2, tx('nameMin')),
  description: z.string().optional(),
})

type DanceTypeFormValues = z.infer<ReturnType<typeof makeDanceTypeSchema>>

interface DanceTypeFormProps {
  danceType?: DanceType
}

export function DanceTypeForm({ danceType }: DanceTypeFormProps) {
  const tx = useTranslations('danceTypeForm')
  const tf = useTranslations('forms')
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [generalError, setGeneralError] = useState<string | null>(null)

  const form = useForm<DanceTypeFormValues>({
    resolver: zodResolver(makeDanceTypeSchema(tx)),
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
      setGeneralError(tf('unexpectedError'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-border max-w-2xl">
      <div className="p-3 sm:p-4 md:p-6 lg:p-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-2">
          {danceType ? tx('editTitle') : tx('addTitle')}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mb-4 md:mb-6">
          {danceType ? tx('editDescription') : tx('addDescription')}
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tf('descriptionOptional')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={tx('descriptionPlaceholder')}
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
                {isLoading ? tf('saving') : danceType ? tx('update') : tx('create')}
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

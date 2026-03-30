'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
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

interface PackageFormProps {
  package?: Package
}

export function PackageForm({ package: pkgProp }: PackageFormProps) {
  const t = useTranslations()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [danceTypes, setDanceTypes] = useState<DanceType[]>([])
  const [generalError, setGeneralError] = useState<string | null>(null)

  const packageSchema = z.object({
    name: z.string().min(2, t('packages.validationPackageNameMin')),
    danceTypeId: z.string().min(1, t('packages.validationSelectDanceType')),
    totalCredits: z.coerce.number().min(1, t('packages.validationTotalCreditsMin')),
    price: z.coerce.number().min(0, t('packages.validationPriceInvalid')),
  })

  type PackageFormValues = z.infer<typeof packageSchema>

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
        console.log('Package form result:', result)
        console.log('Redirecting to /dashboard/packages')
        router.push('/dashboard/packages')
      }
    } catch (error) {
      console.error('Form error:', error)
      setGeneralError(t('common.error'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-[#E5E7EB] max-w-2xl">
      <div className="p-3 sm:p-4 md:p-6 lg:p-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#111827] mb-2">
          {pkgProp ? t('packages.editPackage') : t('packages.addNew')}
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mb-4 md:mb-6">
          {pkgProp ? t('packages.updateInformationMessage') : t('packages.addNewPackageMessage')}
        </p>

        {generalError && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">{generalError}</div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('packages.name')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('packages.placeholderPackageName')}
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
                  <FormLabel>{t('packages.danceType')}</FormLabel>
                  <FormControl>
                    <select
                      disabled={isLoading}
                      className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                      {...field}
                    >
                      <option value="">{t('packages.placeholderSelectDanceType')}</option>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <FormField
                control={form.control}
                name="totalCredits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('packages.credits')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder={t('packages.placeholderTotalCredits')}
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
                    <FormLabel>{t('packages.price')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder={t('packages.placeholderPrice')}
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 pt-4 md:pt-6">
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-[#4F46E5] hover:bg-[#4338CA] text-white w-full sm:w-auto text-sm md:text-base h-9 md:h-10"
              >
                {isLoading ? t('packages.saving') : pkgProp ? t('packages.updatePackage') : t('packages.createPackage')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
                className="border-[#E5E7EB] w-full sm:w-auto text-sm md:text-base h-9 md:h-10"
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

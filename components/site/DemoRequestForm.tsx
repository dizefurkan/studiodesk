'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AnimatePresence, motion } from 'motion/react'
import { CheckCircle2 } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { submitDemoRequest } from '@/lib/actions/demo-requests.actions'
import { STUDENT_COUNT_OPTIONS } from '@/lib/demoRequests'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Textarea } from '@/components/ui/textarea'

function makeSchema(t: (key: string) => string) {
  return z.object({
    name: z.string().trim().min(2, t('errors.name')),
    studioName: z.string().trim().min(2, t('errors.studioName')),
    phone: z
      .string()
      .trim()
      .min(7, t('errors.phone'))
      .regex(/^[+()\d\s-]+$/, t('errors.phone')),
    email: z.string().trim().email(t('errors.email')).optional().or(z.literal('')),
    city: z.string().trim().max(80).optional(),
    studentCount: z.enum(STUDENT_COUNT_OPTIONS).optional().or(z.literal('')),
    message: z.string().trim().max(2000).optional(),
    website: z.string().optional(),
    consent: z.boolean().refine((v) => v, t('errors.consent')),
  })
}
type FormValues = z.infer<ReturnType<typeof makeSchema>>

export function DemoRequestForm() {
  const t = useTranslations('site.demo.form')
  const [sent, setSent] = useState(false)
  const [serverError, setServerError] = useState('')

  const form = useForm<FormValues>({
    resolver: zodResolver(makeSchema(t)),
    defaultValues: { name: '', studioName: '', phone: '', email: '', city: '', studentCount: '', message: '', website: '', consent: false },
  })
  const { register, handleSubmit, formState, setValue, control } = form
  const errors = formState.errors
  const consent = useWatch({ control, name: 'consent' })

  const onSubmit = async (v: FormValues) => {
    setServerError('')
    const res = await submitDemoRequest({
      ...v,
      studentCount: v.studentCount || undefined,
      consent: true,
    })
    if (res.error) setServerError(res.error)
    else setSent(true)
  }

  return (
    <div className="rounded-3xl bg-background p-6 text-left text-foreground sm:p-8">
      <AnimatePresence mode="wait" initial={false}>
        {sent ? (
          <motion.div
            key="sent"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="flex min-h-[420px] flex-col items-center justify-center text-center"
            role="status"
          >
            <CheckCircle2 className="size-12 text-green-600" />
            <p className="mt-4 font-display text-2xl font-semibold">{t('sentTitle')}</p>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">{t('sentText')}</p>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            exit={{ opacity: 0, y: -8 }}
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="name" label={t('name')} error={errors.name?.message}>
                <Input id="name" autoComplete="name" {...register('name')} aria-invalid={!!errors.name} />
              </Field>
              <Field id="studioName" label={t('studioName')} error={errors.studioName?.message}>
                <Input id="studioName" autoComplete="organization" {...register('studioName')} aria-invalid={!!errors.studioName} />
              </Field>
              <Field id="phone" label={t('phone')} error={errors.phone?.message}>
                <Input id="phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="05xx xxx xx xx" {...register('phone')} aria-invalid={!!errors.phone} />
              </Field>
              <Field id="email" label={t('email')} optional={t('optional')} error={errors.email?.message}>
                <Input id="email" type="email" autoComplete="email" {...register('email')} aria-invalid={!!errors.email} />
              </Field>
              <Field id="city" label={t('city')} optional={t('optional')}>
                <Input id="city" autoComplete="address-level2" {...register('city')} />
              </Field>
              <Field id="studentCount" label={t('studentCount')} optional={t('optional')}>
                <NativeSelect id="studentCount" {...register('studentCount')} className="w-full">
                  <NativeSelectOption value="">{t('choose')}</NativeSelectOption>
                  {STUDENT_COUNT_OPTIONS.map((o) => (
                    <NativeSelectOption key={o} value={o}>
                      {t(`studentCountOptions.${o}`)}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
            </div>
            <Field id="message" label={t('message')} optional={t('optional')}>
              <Textarea id="message" rows={3} placeholder={t('messagePlaceholder')} {...register('message')} />
            </Field>

            {/* Honeypot, hidden from people and screen readers */}
            <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
              <label htmlFor="website">Website</label>
              <input id="website" tabIndex={-1} autoComplete="off" {...register('website')} />
            </div>

            <div className="space-y-1">
              <div className="flex items-start gap-2.5">
                <Checkbox
                  id="consent"
                  checked={consent}
                  onCheckedChange={(v) => setValue('consent', v === true, { shouldValidate: formState.isSubmitted })}
                  aria-invalid={!!errors.consent}
                  className="mt-0.5"
                />
                <Label htmlFor="consent" className="block text-sm font-normal leading-snug text-muted-foreground">
                  {t.rich('consent', {
                    link: (chunks) => (
                      <Link href="/legal/kvkk" className="text-foreground underline underline-offset-2" target="_blank">
                        {chunks}
                      </Link>
                    ),
                  })}
                </Label>
              </div>
              {errors.consent && <p className="text-sm text-destructive">{errors.consent.message}</p>}
            </div>

            {serverError && <p className="text-sm text-destructive" role="alert">{serverError}</p>}

            <Button type="submit" size="lg" className="h-12 w-full rounded-full bg-highlight text-base text-highlight-foreground hover:bg-highlight/90" disabled={formState.isSubmitting}>
              {formState.isSubmitting ? t('sending') : t('submit')}
            </Button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  )
}

function Field({
  id,
  label,
  optional,
  error,
  children,
}: {
  id: string
  label: string
  optional?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {optional && <span className="font-normal text-muted-foreground"> ({optional})</span>}
      </Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}

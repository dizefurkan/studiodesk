'use client'

import { useTranslations } from 'next-intl'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BUSINESS_TYPES, type BusinessType } from '@/lib/business/types'

/** Kind of studio (dance, Pilates/yoga, …). */
export function BusinessTypeSelect({
  id,
  value,
  onValueChange,
  disabled,
}: {
  id?: string
  value: BusinessType
  onValueChange: (value: BusinessType) => void
  disabled?: boolean
}) {
  const t = useTranslations('businessTypes.options')
  return (
    <Select value={value} onValueChange={(v) => onValueChange(v as BusinessType)} disabled={disabled}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {BUSINESS_TYPES.map((type) => (
          <SelectItem key={type} value={type}>
            {t(type)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

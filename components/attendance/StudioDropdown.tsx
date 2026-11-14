'use client'

import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useTranslations } from 'next-intl'

export interface Studio {
  id: string
  name: string
  capacity?: number | null
}

interface StudioDropdownProps {
  studios: Studio[]
  selectedStudioId: string | null
  onSelect: (studioId: string | null) => void
}

const NONE = '__none__'

export function StudioDropdown({ studios, selectedStudioId, onSelect }: StudioDropdownProps) {
  const tx = useTranslations('studioDropdown')
  return (
    <Select value={selectedStudioId ?? NONE} onValueChange={(v) => onSelect(v === NONE ? null : v)}>
      <SelectTrigger className="w-full" aria-label={tx('label')}>
        <SelectValue placeholder={tx('placeholder')} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>{tx('none')}</SelectItem>
        {studios.length > 0 && <SelectSeparator />}
        {studios.map((studio) => (
          <SelectItem key={studio.id} value={studio.id}>
            {studio.name}
            {studio.capacity ? ` (${studio.capacity})` : ''}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

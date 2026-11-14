'use client'

import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select'

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
  return (
    <Select value={selectedStudioId ?? NONE} onValueChange={(v) => onSelect(v === NONE ? null : v)}>
      <SelectTrigger className="w-full" aria-label="Studio">
        <SelectValue placeholder="Select Studio" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>No specific studio</SelectItem>
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

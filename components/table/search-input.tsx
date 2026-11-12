'use client'

import { useTranslations } from 'next-intl'
import { Search, X } from 'lucide-react'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onClear?: () => void
}

/** DataTable search box (shadcn InputGroup). */
export function SearchInput({ value, onChange, placeholder, onClear }: SearchInputProps) {
  const t = useTranslations()
  return (
    <InputGroup className="max-w-sm flex-1">
      <InputGroupAddon>
        <Search />
      </InputGroupAddon>
      <InputGroupInput
        type="search"
        placeholder={placeholder || t('common.search')}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            size="icon-xs"
            aria-label={t('confirmDialog.clearSearch')}
            onClick={() => {
              onChange('')
              onClear?.()
            }}
          >
            <X />
          </InputGroupButton>
        </InputGroupAddon>
      )}
    </InputGroup>
  )
}

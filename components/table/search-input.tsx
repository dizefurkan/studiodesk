'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onClear?: () => void
}

export function SearchInput({
  value,
  onChange,
  placeholder,
  onClear,
}: SearchInputProps) {
  const t = useTranslations()

  return (
    <div className="relative flex-1 max-w-sm">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <Input
        placeholder={placeholder || t('common.search')}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9 pr-8 h-9 bg-white"
      />
      {value && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onChange('')
            onClear?.()
          }}
          className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

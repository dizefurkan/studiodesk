'use client'

import { useState, useCallback, useEffect } from 'react'
import { Search, X } from 'lucide-react'

interface SearchInputProps {
  placeholder?: string
  value: string
  onChange: (value: string) => void
  onSearch?: (value: string) => void
  debounceMs?: number
  clearable?: boolean
  ariaLabel?: string
}

export function SearchInput({
  placeholder = 'Search...',
  value,
  onChange,
  onSearch,
  debounceMs = 300,
  clearable = true,
  ariaLabel = 'Search',
}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(localValue)
      onSearch?.(localValue)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [localValue, onChange, onSearch, debounceMs])

  // Sync external value changes
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleClear = useCallback(() => {
    setLocalValue('')
  }, [])

  return (
    <div className="relative flex-1 h-10 flex items-center">
      <Search 
        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" 
        size={18}
        aria-hidden="true"
      />
      <input
        type="text"
        placeholder={placeholder}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            handleClear()
          }
        }}
        aria-label={ariaLabel}
        className="w-full h-10 pl-10 pr-10 border border-[#E5E7EB] rounded-lg text-sm text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:ring-offset-0 transition-all"
      />
      {clearable && localValue && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
          aria-label="Clear search"
        >
          <X size={16} />
        </button>
      )}
    </div>
  )
}

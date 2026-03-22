'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { X, ChevronDown } from 'lucide-react'

interface SelectOption {
  value: string
  label: string
}

interface SelectDropdownProps {
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  className?: string
  ariaLabel?: string
}

export function SelectDropdown({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  label,
  className = '',
  ariaLabel,
}: SelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const selectedLabel = options.find(opt => opt.value === value)?.label || placeholder

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={containerRef}>
      <Button
        variant="outline"
        size="sm"
        className={`border-[#E5E7EB] whitespace-nowrap justify-between h-10 ${className}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown 
          size={14} 
          className={`ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </Button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 z-50">
          <Card className="border-[#E5E7EB] p-2 w-52 shadow-lg">
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onChange(option.value)
                    setIsOpen(false)
                  }}
                  className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                    value === option.value
                      ? 'bg-[#4F46E5] text-white font-medium'
                      : 'text-[#111827] hover:bg-gray-50'
                  }`}
                  role="option"
                  aria-selected={value === option.value}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {value && (
              <button
                onClick={() => {
                  onChange('')
                  setIsOpen(false)
                }}
                className="w-full mt-2 pt-2 border-t border-[#E5E7EB] text-xs text-gray-600 hover:text-gray-900 py-2 px-3 rounded hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
                aria-label={`Clear ${placeholder}`}
              >
                <X size={14} />
                Clear
              </button>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

interface Studio {
  id: string
  name: string
  capacity?: number
}

interface StudioDropdownProps {
  studios: Studio[]
  selectedStudioId: string | null
  onSelect: (studioId: string | null) => void
}

export function StudioDropdown({
  studios,
  selectedStudioId,
  onSelect,
}: StudioDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedStudio = selectedStudioId
    ? studios.find((s) => s.id === selectedStudioId)
    : null

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#D1D5DB] bg-white text-[#111827] text-sm font-medium hover:bg-gray-50 transition-colors w-full"
      >
        <span className="flex-1 text-left">
          {selectedStudio ? `${selectedStudio.name}${selectedStudio.capacity ? ` (${selectedStudio.capacity})` : ''}` : 'Select Studio'}
        </span>
        <ChevronDown size={16} className={`text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#D1D5DB] rounded-lg shadow-lg z-40">
          <button
            onClick={() => {
              onSelect(null)
              setIsOpen(false)
            }}
            className={`w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-gray-100 transition-colors text-left ${
              !selectedStudioId ? 'bg-gray-100 text-[#111827] font-medium' : 'text-[#111827]'
            }`}
          >
            <span>No specific studio</span>
            {!selectedStudioId && <div className="w-2 h-2 bg-gray-600 rounded-full" />}
          </button>
          {studios.map((studio) => (
            <button
              key={studio.id}
              onClick={() => {
                onSelect(studio.id)
                setIsOpen(false)
              }}
              className={`w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-gray-100 transition-colors text-left border-t border-[#E5E7EB] ${
                selectedStudioId === studio.id ? 'bg-gray-100 text-[#111827] font-medium' : 'text-[#111827]'
              }`}
            >
              <span>{studio.name}{studio.capacity ? ` (${studio.capacity})` : ''}</span>
              {selectedStudioId === studio.id && <div className="w-2 h-2 bg-gray-600 rounded-full" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

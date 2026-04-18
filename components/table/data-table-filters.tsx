'use client'

import React, { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar, Settings2, X } from 'lucide-react'
import { format } from 'date-fns'

export type FilterType = 'text' | 'select' | 'dateRange' | 'checkbox' | 'number'

export interface FilterConfig {
  id: string
  label: string
  type: FilterType
  options?: Array<{ label: string; value: string }>
  placeholder?: string
  defaultValue?: any
}

interface DataTableFiltersProps {
  filters: FilterConfig[]
  values: Record<string, any>
  onFilterChange: (filterId: string, value: any) => void
  onClearAll: () => void
}

export function DataTableFilters({
  filters,
  values,
  onFilterChange,
  onClearAll,
}: DataTableFiltersProps) {
  const t = useTranslations()
  const [open, setOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Calculate active filter count
  const activeFilters = Object.entries(values).filter(
    ([_, value]) => value !== undefined && value !== null && value !== ''
  ).length

  // Mobile Filter UI
  const MobileFilterContent = () => (
    <div className="space-y-4">
      {filters.map((filter) => (
        <FilterField
          key={filter.id}
          filter={filter}
          value={values[filter.id]}
          onChange={(value) => {
            onFilterChange(filter.id, value)
          }}
        />
      ))}
      <div className="flex gap-2 pt-4">
        <Button
          onClick={() => {
            onClearAll()
            setMobileOpen(false)
          }}
          variant="outline"
          size="sm"
          className="flex-1"
        >
          {t('common.reset')}
        </Button>
        <Button
          onClick={() => setMobileOpen(false)}
          size="sm"
          className="flex-1"
        >
          {t('common.apply')}
        </Button>
      </div>
    </div>
  )

  // Desktop Filter UI
  const DesktopFilterContent = () => (
    <div className="w-80 space-y-4 p-4">
      {filters.map((filter) => (
        <FilterField
          key={filter.id}
          filter={filter}
          value={values[filter.id]}
          onChange={(value) => {
            onFilterChange(filter.id, value)
          }}
        />
      ))}
      {activeFilters > 0 && (
        <Button
          onClick={onClearAll}
          variant="ghost"
          size="sm"
          className="w-full"
        >
          {t('common.filter')} ({activeFilters})
        </Button>
      )}
    </div>
  )

  return (
    <div className="flex gap-2">
      {/* Desktop Popover */}
      <div className="hidden sm:block">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Settings2 className="h-4 w-4" />
              {t('common.filter')}
              {activeFilters > 0 && (
                <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
                  {activeFilters}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-80">
            <DesktopFilterContent />
          </PopoverContent>
        </Popover>
      </div>

      {/* Mobile Drawer */}
      <div className="sm:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Settings2 className="h-4 w-4" />
              {activeFilters > 0 && (
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
                  {activeFilters}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-auto rounded-t-lg">
            <SheetHeader>
              <SheetTitle>{t('common.filter')}</SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              <MobileFilterContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}

// Individual Filter Field Component
interface FilterFieldProps {
  filter: FilterConfig
  value: any
  onChange: (value: any) => void
}

function FilterField({ filter, value, onChange }: FilterFieldProps) {
  const t = useTranslations()

  switch (filter.type) {
    case 'text':
      return (
        <div className="space-y-2">
          <Label className="text-xs font-medium">{filter.label}</Label>
          <Input
            placeholder={filter.placeholder || t('common.search')}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="h-8"
          />
        </div>
      )

    case 'select':
      return (
        <div className="space-y-2">
          <Label className="text-xs font-medium">{filter.label}</Label>
          <Select value={value || ''} onValueChange={onChange}>
            <SelectTrigger className="h-8">
              <SelectValue placeholder={filter.placeholder || t('common.selectOption')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{t('common.selectOption')}</SelectItem>
              {filter.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )

    case 'number':
      return (
        <div className="space-y-2">
          <Label className="text-xs font-medium">{filter.label}</Label>
          <Input
            type="number"
            placeholder={filter.placeholder || t('common.selectOption')}
            value={value || ''}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '')}
            className="h-8"
          />
        </div>
      )

    case 'dateRange':
      return (
        <div className="space-y-2">
          <Label className="text-xs font-medium">{filter.label}</Label>
          <div className="space-y-2">
            <Input
              type="date"
              value={value?.from ? format(value.from, 'yyyy-MM-dd') : ''}
              onChange={(e) =>
                onChange({
                  ...value,
                  from: e.target.value
                    ? new Date(e.target.value)
                    : undefined,
                })
              }
              className="h-8"
              placeholder="From"
            />
            <Input
              type="date"
              value={value?.to ? format(value.to, 'yyyy-MM-dd') : ''}
              onChange={(e) =>
                onChange({
                  ...value,
                  to: e.target.value
                    ? new Date(e.target.value)
                    : undefined,
                })
              }
              className="h-8"
              placeholder="To"
            />
          </div>
        </div>
      )

    default:
      return null
  }
}

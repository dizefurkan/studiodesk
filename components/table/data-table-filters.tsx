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
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Settings2, X } from 'lucide-react'
import { format } from 'date-fns'

export type FilterType = 'select' | 'dateRange' | 'checkbox' | 'number'

export type DateRange = { from?: Date; to?: Date }
/** select → string, number → number | '', dateRange → DateRange */
export type FilterValue = string | number | DateRange | undefined
export type FilterValues = Record<string, FilterValue>

export interface FilterConfig {
  id: string
  label: string
  type: FilterType
  options?: Array<{ label: string; value: string }>
  placeholder?: string
  defaultValue?: FilterValue
}

interface DataTableFiltersProps {
  filters: FilterConfig[]
  values: FilterValues
  onFilterChange: (filterId: string, value: FilterValue) => void
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
  const mobileFilterContent = (
    <div className="space-y-6">
      <div className="space-y-5">
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
      </div>
      <div className="flex gap-3 pt-4 border-t">
        <Button
          onClick={() => {
            onClearAll()
            setMobileOpen(false)
          }}
          variant="outline"
          size="sm"
          className="flex-1 h-9"
        >
          {t('common.reset')}
        </Button>
        <Button
          onClick={() => setMobileOpen(false)}
          size="sm"
          className="flex-1 h-9"
        >
          {t('common.apply')}
        </Button>
      </div>
    </div>
  )

  // Desktop Filter UI
  const desktopFilterContent = (
    <div className="space-y-5">
      <div className="space-y-5">
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
      </div>
      {activeFilters > 0 && (
        <div className="flex gap-2 pt-3 border-t">
          <Button
            onClick={onClearAll}
            variant="ghost"
            size="sm"
            className="w-full"
          >
            {t('common.filter')} ({activeFilters})
          </Button>
        </div>
      )}
    </div>
  )

  return (
    <div className="flex gap-2">
      {/* Desktop Popover */}
      <div className="hidden sm:block">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 h-9">
              <Settings2 className="h-4 w-4" />
              {t('filters.title')}
              {activeFilters > 0 && (
                <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {activeFilters}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-72 p-4">
            {desktopFilterContent}
          </PopoverContent>
        </Popover>
      </div>

      {/* Mobile Drawer */}
      <div className="sm:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 h-9">
              <Settings2 className="h-4 w-4" />
              {activeFilters > 0 && (
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {activeFilters}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-auto rounded-t-lg">
            <SheetHeader className="mb-6">
              <SheetTitle className="text-lg">{t('filters.title')}</SheetTitle>
            </SheetHeader>
            <div className="px-4 pb-6">
              {mobileFilterContent}
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
  value: FilterValue
  onChange: (value: FilterValue) => void
}

function FilterField({ filter, value, onChange }: FilterFieldProps) {
  const t = useTranslations()
  const text = typeof value === 'string' || typeof value === 'number' ? value : ''
  const range: DateRange = value && typeof value === 'object' ? value : {}

  switch (filter.type) {
    case 'select':
      return (
        <div className="space-y-2.5">
          <Label className="text-sm font-semibold text-foreground/80">{filter.label}</Label>
          <div className="relative">
            <Select value={String(text)} onValueChange={(val) => onChange(val || undefined)}>
              <SelectTrigger className={`h-9 w-full bg-background ${value ? 'pr-8' : ''}`}>
                <SelectValue placeholder={filter.placeholder || t('common.selectOption')} />
              </SelectTrigger>
              <SelectContent>
                {filter.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {value && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onChange(undefined)}
                className="absolute right-0 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )

    case 'number':
      return (
        <div className="space-y-2.5">
          <Label className="text-sm font-semibold text-foreground/80">{filter.label}</Label>
          <Input
            type="number"
            placeholder={filter.placeholder || t('common.selectOption')}
            value={text}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '')}
            className="h-9 w-full bg-background"
          />
        </div>
      )

    case 'dateRange':
      return (
        <div className="space-y-2.5">
          <Label className="text-sm font-semibold text-foreground/80">{filter.label}</Label>
          <div className="space-y-2.5">
            <Input
              type="date"
              value={range.from ? format(range.from, 'yyyy-MM-dd') : ''}
              onChange={(e) =>
                onChange({
                  ...range,
                  from: e.target.value
                    ? new Date(e.target.value)
                    : undefined,
                })
              }
              className="h-9 w-full bg-background"
              placeholder="From"
            />
            <Input
              type="date"
              value={range.to ? format(range.to, 'yyyy-MM-dd') : ''}
              onChange={(e) =>
                onChange({
                  ...range,
                  to: e.target.value
                    ? new Date(e.target.value)
                    : undefined,
                })
              }
              className="h-9 w-full bg-background"
              placeholder="To"
            />
          </div>
        </div>
      )

    default:
      return null
  }
}

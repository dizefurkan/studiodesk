'use client'

import React, { useState } from 'react'
import {
  ColumnDef,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useTranslations } from 'next-intl'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { DataTableFilters, FilterConfig } from './data-table-filters'
import { SearchInput } from './search-input'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  // Pagination props for backend pagination
  totalItems?: number
  currentPage?: number
  pageSize?: number
  onPageChange?: (page: number) => void
  // Filter props
  filters?: FilterConfig[]
  filterValues?: Record<string, any>
  onFilterChange?: (filterId: string, value: any) => void
  // Search props
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  // Feature flags
  enablePagination?: boolean
  enableSearch?: boolean
  enableFilters?: boolean
  // Other
  emptyMessage?: string
  loading?: boolean
}

export function DataTable<TData, TValue>({
  columns,
  data,
  // Pagination
  totalItems = 0,
  currentPage = 1,
  pageSize = 10,
  onPageChange,
  // Filters
  filters = [],
  filterValues = {},
  onFilterChange,
  // Search
  searchValue = '',
  onSearchChange,
  searchPlaceholder,
  // Features
  enablePagination = true,
  enableSearch = true,
  enableFilters = true,
  // Other
  emptyMessage,
  loading = false,
}: DataTableProps<TData, TValue>) {
  const t = useTranslations()
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnVisibility,
    },
  })


  const handleClearFilters = () => {
    Object.keys(filterValues).forEach((key) => {
      onFilterChange?.(key, '')
    })
  }

  const totalPages = Math.ceil(totalItems / pageSize)
  const hasNextPage = currentPage < totalPages
  const hasPrevPage = currentPage > 1

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      {(enableSearch || (enableFilters && filters.length > 0)) && (
        <div className="flex gap-2 items-center flex-wrap">
          {enableSearch && onSearchChange && (
            <SearchInput
              value={searchValue}
              onChange={onSearchChange}
              placeholder={searchPlaceholder}
            />
          )}
          {enableFilters && filters.length > 0 && onFilterChange && (
            <DataTableFilters
              filters={filters}
              values={filterValues}
              onFilterChange={onFilterChange}
              onClearAll={handleClearFilters}
            />
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-[#E5E7EB]">
        <Table>
          <TableHeader className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="px-4 py-3 text-left text-sm font-semibold">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-gray-500"
                >
                  {t('common.loading')}
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="border-b hover:bg-gray-50 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-4 py-3 text-sm">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-gray-500"
                >
                  {emptyMessage || t('common.empty')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination - Backend Pagination */}
      {enablePagination && totalItems > 0 && (
        <div className="flex items-center justify-between text-sm">
          <div className="text-gray-600">
            {data.length} {t('table.results')} / {totalItems} {t('table.total')}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(currentPage - 1)}
              disabled={!hasPrevPage}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1">
              <span className="text-xs">
                {currentPage} / {totalPages}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(currentPage + 1)}
              disabled={!hasNextPage}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}


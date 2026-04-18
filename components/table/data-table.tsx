'use client'

import React, { useState, useMemo } from 'react'
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
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
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  filters?: FilterConfig[]
  filterValues?: Record<string, any>
  onFilterChange?: (filterId: string, value: any) => void
  pageSize?: number
  enablePagination?: boolean
  enableSearch?: boolean
  enableFilters?: boolean
  searchableColumns?: string[]
  emptyMessage?: string
  loading?: boolean
}

export function DataTable<TData, TValue>({
  columns,
  data,
  filters = [],
  filterValues = {},
  onFilterChange,
  pageSize = 10,
  enablePagination = true,
  enableSearch = true,
  enableFilters = true,
  searchableColumns = [],
  emptyMessage,
  loading = false,
}: DataTableProps<TData, TValue>) {
  const t = useTranslations()
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  // Apply external filters
  const filteredData = useMemo(() => {
    if (!enableFilters || Object.keys(filterValues).length === 0) {
      return data
    }

    return data.filter((row: any) => {
      return Object.entries(filterValues).every(([key, value]) => {
        if (!value) return true

        const fieldValue = row[key]

        if (typeof value === 'string') {
          return String(fieldValue)
            .toLowerCase()
            .includes(String(value).toLowerCase())
        }

        if (value?.from && value?.to) {
          const date = new Date(fieldValue)
          return date >= value.from && date <= value.to
        }

        return fieldValue === value
      })
    })
  }, [data, filterValues, enableFilters])

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    initialState: {
      pagination: {
        pageSize,
      },
    },
  })

  const handleClearFilters = () => {
    setColumnFilters([])
    Object.keys(filterValues).forEach((key) => {
      onFilterChange?.(key, '')
    })
  }

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      {enableFilters && filters.length > 0 && onFilterChange && (
        <div className="flex gap-2">
          <DataTableFilters
            filters={filters}
            values={filterValues}
            onFilterChange={onFilterChange}
            onClearAll={handleClearFilters}
          />
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

      {/* Pagination */}
      {enablePagination && (
        <div className="flex items-center justify-between text-sm">
          <div className="text-gray-600">
            {table.getFilteredRowModel().rows.length} {t('table.total')}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1">
              <span className="text-xs">
                {table.getState().pagination.pageIndex + 1} /{' '}
                {table.getPageCount()}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

/* eslint-disable @typescript-eslint/no-explicit-any -- filter values are heterogeneous */
import { Fragment, useState } from 'react'
import {
  type ColumnDef,
  type ExpandedState,
  type Row,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useTranslations } from 'next-intl'
import { SearchX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Spinner } from '@/components/ui/spinner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DataTableFilters, type FilterConfig } from './data-table-filters'
import { DataTablePagination } from './data-table-pagination'
import { SearchInput } from './search-input'

/** Optional per-column classes: `{ meta: { className: 'w-10' } }` in a ColumnDef. */
const colClass = (meta: unknown) => (meta as { className?: string } | undefined)?.className

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  // Pagination (server-side)
  totalItems?: number
  currentPage?: number
  pageSize?: number
  onPageChange?: (page: number) => void
  // Filters
  filters?: FilterConfig[]
  filterValues?: Record<string, any>
  onFilterChange?: (filterId: string, value: any) => void
  onClearFilters?: () => void
  // Search
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  // Feature flags
  enablePagination?: boolean
  enableSearch?: boolean
  enableFilters?: boolean
  // Expandable rows (shadcn/TanStack sub-component pattern)
  getRowCanExpand?: (row: Row<TData>) => boolean
  renderSubComponent?: (props: { row: Row<TData> }) => React.ReactNode
  // Other
  emptyMessage?: string
  loading?: boolean
}

/**
 * shadcn data-table (TanStack Table + shadcn Table) used by every list page.
 * Toolbar (search + filters) → table → pagination. Empty results render inside the table so the
 * toolbar stays usable; the first-run empty state (no records at all) is the page's <EmptyState/>.
 */
export function DataTable<TData, TValue>({
  columns,
  data,
  totalItems = 0,
  currentPage = 1,
  pageSize = 10,
  onPageChange,
  filters = [],
  filterValues = {},
  onFilterChange,
  onClearFilters,
  searchValue = '',
  onSearchChange,
  searchPlaceholder,
  enablePagination = true,
  enableSearch = true,
  enableFilters = true,
  getRowCanExpand,
  renderSubComponent,
  emptyMessage,
  loading = false,
}: DataTableProps<TData, TValue>) {
  const t = useTranslations()
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [expanded, setExpanded] = useState<ExpandedState>({})

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table is the shadcn data-table engine
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onExpandedChange: setExpanded,
    state: { sorting, columnVisibility, expanded },
  })

  const hasActiveFilters =
    !!searchValue || Object.values(filterValues).some((v) => v !== undefined && v !== null && v !== '' && v !== false)
  const showToolbar = (enableSearch && onSearchChange) || (enableFilters && filters.length > 0 && onFilterChange)
  const colSpan = table.getVisibleLeafColumns().length || columns.length

  return (
    <div className="space-y-4">
      {showToolbar && (
        <div className="flex flex-wrap items-center gap-2">
          {enableSearch && onSearchChange && (
            <SearchInput value={searchValue} onChange={onSearchChange} placeholder={searchPlaceholder} />
          )}
          {enableFilters && filters.length > 0 && onFilterChange && (
            <DataTableFilters
              filters={filters}
              values={filterValues}
              onFilterChange={onFilterChange}
              onClearAll={onClearFilters || (() => {})}
            />
          )}
        </div>
      )}

      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className={colClass(header.column.columnDef.meta)}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={colSpan} className="h-24">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Spinner /> {t('common.loading')}
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <Fragment key={row.id}>
                  <TableRow data-state={row.getIsExpanded() ? 'selected' : undefined}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className={colClass(cell.column.columnDef.meta)}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                  {row.getIsExpanded() && renderSubComponent && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={colSpan} className="bg-muted/30 p-0">
                        {renderSubComponent({ row })}
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={colSpan} className="p-0">
                  <Empty className="py-10">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <SearchX />
                      </EmptyMedia>
                      <EmptyTitle>{emptyMessage || t('table.noResults')}</EmptyTitle>
                      {hasActiveFilters && <EmptyDescription>{t('table.noResultsHint')}</EmptyDescription>}
                    </EmptyHeader>
                    {hasActiveFilters && (onClearFilters || onSearchChange) && (
                      <EmptyContent>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => (onClearFilters ? onClearFilters() : onSearchChange?.(''))}
                        >
                          {t('table.clearFilters')}
                        </Button>
                      </EmptyContent>
                    )}
                  </Empty>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {enablePagination && totalItems > 0 && (
        <DataTablePagination
          shown={data.length}
          totalItems={totalItems}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={onPageChange}
        />
      )}
    </div>
  )
}

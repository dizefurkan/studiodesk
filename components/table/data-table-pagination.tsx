'use client'

import { useTranslations } from 'next-intl'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DataTablePaginationProps {
  /** rows on the current page */
  shown: number
  totalItems: number
  currentPage: number
  pageSize: number
  onPageChange?: (page: number) => void
}

/** shadcn data-table pagination, driven by server-side page/total. */
export function DataTablePagination({ shown, totalItems, currentPage, pageSize, onPageChange }: DataTablePaginationProps) {
  const t = useTranslations('table')
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const go = (p: number) => onPageChange?.(Math.min(totalPages, Math.max(1, p)))

  return (
    <div className="flex flex-col-reverse items-center justify-between gap-3 px-2 sm:flex-row">
      <p className="text-sm text-muted-foreground">{t('rowsOf', { shown, total: totalItems })}</p>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{t('pageOf', { page: currentPage, total: totalPages })}</span>
        <Button
          variant="outline"
          size="icon-sm"
          className="hidden lg:inline-flex"
          onClick={() => go(1)}
          disabled={currentPage <= 1}
          aria-label={t('firstPage')}
        >
          <ChevronsLeft />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => go(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label={t('previousPage')}
        >
          <ChevronLeft />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => go(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label={t('nextPage')}
        >
          <ChevronRight />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          className="hidden lg:inline-flex"
          onClick={() => go(totalPages)}
          disabled={currentPage >= totalPages}
          aria-label={t('lastPage')}
        >
          <ChevronsRight />
        </Button>
      </div>
    </div>
  )
}

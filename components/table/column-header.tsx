'use client'

import { useTranslations } from 'next-intl'

/** Translated column header for TanStack column defs: `header: () => <ColumnHeader k="name" />` (keys under `table.*`). */
export function ColumnHeader({ k }: { k: string }) {
  const t = useTranslations('table')
  return <>{t(k)}</>
}

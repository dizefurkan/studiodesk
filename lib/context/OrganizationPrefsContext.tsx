'use client'

import { createContext, useContext, type ReactNode } from 'react'

/** Organization settings that client components need for display (week start, currency). */
export interface OrganizationPrefs {
  /** 0 = Sunday … 6 = Saturday */
  weekStartDay: number
  currency: string
}

const DEFAULT_PREFS: OrganizationPrefs = { weekStartDay: 1, currency: 'TRY' }

const OrganizationPrefsContext = createContext<OrganizationPrefs>(DEFAULT_PREFS)

export function OrganizationPrefsProvider({
  value,
  children,
}: {
  value: OrganizationPrefs
  children: ReactNode
}) {
  return <OrganizationPrefsContext.Provider value={value}>{children}</OrganizationPrefsContext.Provider>
}

export function useOrganizationPrefs() {
  return useContext(OrganizationPrefsContext)
}

/** Weekday indexes (0 = Sunday) in display order, starting at the organization's week start. */
export function orderedWeekdays(weekStartDay: number): number[] {
  return Array.from({ length: 7 }, (_, i) => (weekStartDay + i) % 7)
}

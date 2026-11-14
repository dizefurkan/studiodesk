/**
 * Plans shown on the landing page. Example figures: edit prices and limits here.
 * These are marketing limits; the app does not enforce them yet.
 */
export type PlanId = 'starter' | 'studio' | 'multi'

export interface Plan {
  id: PlanId
  /** Price per month in TRY, billed monthly */
  monthly: number
  /** Price per month in TRY when billed yearly */
  yearly: number
  featured?: boolean
}

export const PLANS: Plan[] = [
  { id: 'starter', monthly: 990, yearly: 790 },
  { id: 'studio', monthly: 1990, yearly: 1590, featured: true },
  { id: 'multi', monthly: 3990, yearly: 3190 },
]

/** Shown on the toggle: how much yearly billing saves. */
export const YEARLY_SAVING_PERCENT = 20

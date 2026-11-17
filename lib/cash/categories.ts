/** Cash register categories. "other" needs a description; for the rest it's an optional note. */
export const INCOME_CATEGORIES = ['package_sale', 'private_lesson', 'event', 'product_sale', 'rental', 'other'] as const
export const EXPENSE_CATEGORIES = [
  'rent',
  'utilities',
  'instructor_payment',
  'salary',
  'equipment',
  'cleaning',
  'marketing',
  'tax',
  'maintenance',
  'other',
] as const

export type IncomeCategory = (typeof INCOME_CATEGORIES)[number]
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]
export type CashCategory = IncomeCategory | ExpenseCategory

export function categoriesFor(type: 'income' | 'expense'): readonly CashCategory[] {
  return type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
}

export function isCategoryFor(type: 'income' | 'expense', category: string): category is CashCategory {
  return (categoriesFor(type) as readonly string[]).includes(category)
}

/** Recorded automatically (package sales, instructor payouts); not offered in the manual entry form */
export const AUTOMATIC_CATEGORIES: readonly CashCategory[] = ['package_sale', 'instructor_payment']

/** Categories for a manual entry of the given type */
export function manualCategoriesFor(type: 'income' | 'expense'): CashCategory[] {
  return categoriesFor(type).filter((c) => !AUTOMATIC_CATEGORIES.includes(c))
}

/** Periods the cash register can show: one day, one month, or everything */
export const CASH_PERIODS = ['day', 'month', 'all'] as const
export type CashPeriod = (typeof CASH_PERIODS)[number]

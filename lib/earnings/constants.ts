/** Extra pay item kinds a user can add ('correction' is written only by recalculation). */
export const ADJUSTMENT_KINDS = ['bonus', 'deduction', 'private_lesson', 'travel', 'other'] as const
export type AdjustmentKind = (typeof ADJUSTMENT_KINDS)[number] | 'correction'

export const PAYOUT_METHODS = ['cash', 'bank_transfer', 'other'] as const
export type PayoutMethod = (typeof PAYOUT_METHODS)[number]

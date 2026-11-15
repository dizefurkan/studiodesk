/** Pay models of an instructor rate (client-safe). */
export const PAY_MODELS = ['percentage', 'per_lesson', 'per_hour', 'per_student'] as const
export type PayModel = (typeof PAY_MODELS)[number]

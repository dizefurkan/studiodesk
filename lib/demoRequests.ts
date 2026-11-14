/** Shared between the public form and the server action (a "use server" file can only export async functions). */
export const STUDENT_COUNT_OPTIONS = ['lt50', '50to150', '150to400', 'gt400'] as const
export type StudentCountOption = (typeof STUDENT_COUNT_OPTIONS)[number]

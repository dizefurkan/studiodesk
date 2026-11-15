import type { getInstructorRates } from '@/lib/actions/instructor-rates.actions'
import type { ActionData } from '@/lib/types/actions'

export type InstructorRate = ActionData<typeof getInstructorRates>[number]
export type RateVersion = InstructorRate['instructor_rate_versions'][number]

/** Start date that means "has always applied" */
export const ALWAYS = '2000-01-01'

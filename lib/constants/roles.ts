// User roles
export const ROLES = {
  OWNER: 'owner',
  MANAGER: 'manager',
  INSTRUCTOR: 'instructor',
  STAFF: 'staff',
} as const

export const ROLE_LABELS: Record<string, string> = {
  [ROLES.OWNER]: 'Owner',
  [ROLES.MANAGER]: 'Manager',
  [ROLES.INSTRUCTOR]: 'Instructor',
  [ROLES.STAFF]: 'Staff',
}

// Role hierarchy for permissions
export const ROLE_HIERARCHY: Record<string, number> = {
  [ROLES.OWNER]: 4,
  [ROLES.MANAGER]: 3,
  [ROLES.INSTRUCTOR]: 2,
  [ROLES.STAFF]: 1,
}

export type UserRole = typeof ROLES[keyof typeof ROLES]

// Transaction types
export const TRANSACTION_TYPES = {
  INCOME: 'income',
  EXPENSE: 'expense',
} as const

export type TransactionType = typeof TRANSACTION_TYPES[keyof typeof TRANSACTION_TYPES]

// Days of week
export const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
]

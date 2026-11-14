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

export type Role = (typeof ROLES)[keyof typeof ROLES]
const ROLE_VALUES: readonly string[] = Object.values(ROLES)

/** Narrows a role read from the database (text + CHECK constraint) to the Role union. */
export function toRole(value: string): Role {
  return (ROLE_VALUES.includes(value) ? value : ROLES.STAFF) as Role
}

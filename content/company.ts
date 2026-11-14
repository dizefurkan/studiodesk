/**
 * Legal identity shown on the legal pages. Fill in the empty fields before going live;
 * empty values render as "—".
 */
export const COMPANY = {
  name: 'SFDYAZILIM',
  product: 'StudioDesk',
  website: 'studiodesk.app',
  address: '',
  email: '',
  kep: '',
  mersis: '',
  taxOffice: '',
} as const

export const dash = (v: string) => v || '—'

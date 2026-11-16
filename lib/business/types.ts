/** Kinds of studio StudioDesk serves. Only wording and examples change between them. */
export const BUSINESS_TYPES = ['dance', 'pilates_yoga', 'martial_arts', 'music_art', 'fitness', 'other'] as const
export type BusinessType = (typeof BUSINESS_TYPES)[number]

export function toBusinessType(value: string | null | undefined): BusinessType {
  return (BUSINESS_TYPES as readonly string[]).includes(value ?? '') ? (value as BusinessType) : 'other'
}

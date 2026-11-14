/**
 * Makes user input safe to interpolate into a PostgREST `.or()` / `ilike` filter:
 * drops the filter syntax characters (`,` `(` `)`), wildcards and backslashes.
 */
export function sanitizeSearch(value: string): string {
  return value.replace(/[,()%*\\]/g, ' ').replace(/\s+/g, ' ').trim()
}

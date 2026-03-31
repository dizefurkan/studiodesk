/**
 * Utility functions for history logging
 * Note: No 'use server' directive - these are helper functions only
 */

/**
 * Extract only changed fields from update
 */
export function getChanges(before: Record<string, any>, after: Record<string, any>) {
  const changes: Record<string, { before: any; after: any }> = {}

  for (const key in after) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      changes[key] = {
        before: before[key],
        after: after[key],
      }
    }
  }

  return changes
}

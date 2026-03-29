/**
 * Format time string to HH:MM format (removes seconds)
 * @param time - Time string in format HH:MM:SS or HH:MM
 * @returns Formatted time string HH:MM
 */
export function formatTime(time: string | undefined | null): string {
  if (!time) return ''
  return time.substring(0, 5)
}

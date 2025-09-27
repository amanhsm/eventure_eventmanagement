/**
 * Utility functions for time formatting
 */

/**
 * Format time string to remove seconds (HH:MM:SS -> HH:MM)
 * @param timeString - Time string in HH:MM:SS or HH:MM format
 * @returns Formatted time string without seconds
 */
export function formatTimeWithoutSeconds(timeString: string | null | undefined): string {
  if (!timeString) return ''
  
  // If time already in HH:MM format, return as is
  if (timeString.length === 5 && timeString.includes(':')) {
    return timeString
  }
  
  // If time in HH:MM:SS format, remove seconds
  if (timeString.length === 8 && timeString.split(':').length === 3) {
    return timeString.substring(0, 5)
  }
  
  // Handle other formats or return as is
  return timeString
}

/**
 * Format time range without seconds
 * @param startTime - Start time string
 * @param endTime - End time string
 * @returns Formatted time range string
 */
export function formatTimeRange(startTime: string | null | undefined, endTime: string | null | undefined): string {
  const start = formatTimeWithoutSeconds(startTime)
  const end = formatTimeWithoutSeconds(endTime)
  
  if (!start || !end) return ''
  
  return `${start} - ${end}`
}

import { formatDateString, addDays, parseDateString } from './dateUtils';

/**
 * Parses a reset time string "HH:MM" into hours and minutes
 */
export function parseResetTime(resetTimeStr: string): { hours: number; minutes: number } {
  const [h, m] = (resetTimeStr || '00:00').split(':').map(Number);
  return {
    hours: isNaN(h) ? 0 : h,
    minutes: isNaN(m) ? 0 : m,
  };
}

/**
 * Returns the logical reset date ("YYYY-MM-DD") for a given absolute timestamp.
 * If the reset time is 05:00 AM, then:
 * - 2026-07-08 04:30 AM maps to logical date "2026-07-07"
 * - 2026-07-08 05:01 AM maps to logical date "2026-07-08"
 */
export function getLogicalResetDate(time: Date, resetTimeStr: string): string {
  const { hours, minutes } = parseResetTime(resetTimeStr);
  const calendarDateStr = formatDateString(time);
  
  // Construct the reset boundary Date object for the current calendar day
  const boundary = new Date(time);
  boundary.setHours(hours, minutes, 0, 0);

  if (time.getTime() < boundary.getTime()) {
    // If before the daily reset time, it belongs to the previous logical day
    return addDays(calendarDateStr, -1);
  }
  
  return calendarDateStr;
}

/**
 * Returns the exact Date object when the next daily reset will occur relative to the current time.
 */
export function getNextResetDateTime(time: Date, resetTimeStr: string): Date {
  const currentLogicalDate = getLogicalResetDate(time, resetTimeStr);
  
  // The next reset occurs at (currentLogicalDate + 1 day) at resetTimeStr
  const nextLogicalDayStr = addDays(currentLogicalDate, 1);
  const nextResetDate = parseDateString(nextLogicalDayStr); // represents midnight of that next logical day
  
  const { hours, minutes } = parseResetTime(resetTimeStr);
  nextResetDate.setHours(hours, minutes, 0, 0);
  
  return nextResetDate;
}

/**
 * Checks if the current time is within the warning window before the next daily reset.
 * Default warning window is 1 hour.
 */
export function isWithinWarningWindow(
  time: Date,
  resetTimeStr: string,
  warningWindowMs: number = 60 * 60 * 1000 // default 1 hour in ms
): boolean {
  const nextReset = getNextResetDateTime(time, resetTimeStr);
  const diffMs = nextReset.getTime() - time.getTime();
  
  // It's within the window if the reset is in the future, and occurring within warningWindowMs
  return diffMs > 0 && diffMs <= warningWindowMs;
}

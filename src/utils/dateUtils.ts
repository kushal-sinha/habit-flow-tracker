// Helpers for dates, timezone boundaries, Leap years and DST safety

export const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
export type Weekday = typeof WEEKDAYS[number];

/**
 * Returns today's date in local time as "YYYY-MM-DD"
 */
export function getTodayString(): string {
  return formatDateString(new Date());
}

/**
 * Formats a Date object to "YYYY-MM-DD" in local timezone
 */
export function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses a "YYYY-MM-DD" string into a local Date object set at midnight
 */
export function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  // Using local constructor ensures the Date is created at midnight in the local timezone
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

/**
 * Gets the 3-letter lowercase day of the week for a given date (e.g. 'mon', 'tue')
 */
export function getWeekdayAbbreviation(dateStr: string): Weekday {
  const date = parseDateString(dateStr);
  return WEEKDAYS[date.getDay()];
}

/**
 * Safely adds or subtracts days from a YYYY-MM-DD string, remaining DST-safe
 */
export function addDays(dateStr: string, days: number): string {
  const date = parseDateString(dateStr);
  date.setDate(date.getDate() + days);
  return formatDateString(date);
}

/**
 * Returns the difference in calendar days between two YYYY-MM-DD strings
 */
export function differenceInCalendarDays(dateStrA: string, dateStrB: string): number {
  const dateA = parseDateString(dateStrA);
  const dateB = parseDateString(dateStrB);
  
  // Calculate midnight timestamps to avoid hours/minutes causing off-by-one errors
  const utc1 = Date.UTC(dateA.getFullYear(), dateA.getMonth(), dateA.getDate());
  const utc2 = Date.UTC(dateB.getFullYear(), dateB.getMonth(), dateB.getDate());
  
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((utc1 - utc2) / msPerDay);
}

/**
 * Generates an array of YYYY-MM-DD date strings for the last N calendar days
 */
export function getLastNDays(n: number): string[] {
  const result: string[] = [];
  const today = getTodayString();
  for (let i = n - 1; i >= 0; i--) {
    result.push(addDays(today, -i));
  }
  return result;
}

/**
 * Returns greeting and emoji based on the local time hour
 * Greeting Bins:
 * 5AM - 11:59AM -> Good Morning ☀️
 * 12PM - 4:59PM -> Good Afternoon 🌤️
 * 5PM - 8:59PM -> Good Evening 🌇
 * 9PM - 4:59AM -> Good Night 🌙
 */
export function getGreeting(): { text: string; emoji: string } {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) {
    return { text: 'Good Morning', emoji: '☀️' };
  } else if (hour >= 12 && hour < 17) {
    return { text: 'Good Afternoon', emoji: '🌤️' };
  } else if (hour >= 17 && hour < 21) {
    return { text: 'Good Evening', emoji: '🌇' };
  } else {
    return { text: 'Good Night', emoji: '🌙' };
  }
}

/**
 * Determines how many days are in a given month of a year (handles leap years)
 */
export function getDaysInMonth(year: number, month: number): number {
  // month is 0-indexed (0 = Jan, 11 = Dec)
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Returns a list of dates for a given month calendar display (includes preceding and succeeding padding)
 */
export interface CalendarCell {
  dateString: string | null;
  dayNumber: number | null;
  isCurrentMonth: boolean;
}

export function getCalendarGrid(year: number, month: number): CalendarCell[] {
  const grid: CalendarCell[] = [];
  
  // Day of week of the first day of the month (0 = Sun, 6 = Sat)
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const totalDays = getDaysInMonth(year, month);
  
  // Previous month padding
  const prevYear = month === 0 ? year - 1 : year;
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevMonthTotalDays = getDaysInMonth(prevYear, prevMonth);
  
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const day = prevMonthTotalDays - i;
    const dateString = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    grid.push({ dateString, dayNumber: day, isCurrentMonth: false });
  }
  
  // Current month days
  for (let day = 1; day <= totalDays; day++) {
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    grid.push({ dateString, dayNumber: day, isCurrentMonth: true });
  }
  
  // Next month padding to fill a complete calendar row set (multiple of 7, max 6 weeks = 42 cells)
  const remainingCells = 42 - grid.length;
  const nextYear = month === 11 ? year + 1 : year;
  const nextMonth = month === 11 ? 0 : month + 1;
  
  for (let day = 1; day <= remainingCells; day++) {
    const dateString = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    grid.push({ dateString, dayNumber: day, isCurrentMonth: false });
  }
  
  return grid;
}

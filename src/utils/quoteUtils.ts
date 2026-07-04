import quotesData from '../constants/quotes.json';
import { Quote } from '../types';
import { getTodayString, parseDateString } from './dateUtils';

/**
 * Deterministically selects the quote of the day based on the calendar date.
 * Ensures the quote changes at midnight local time and remains constant for the entire day.
 */
export function getQuoteForToday(todayStr: string = getTodayString()): Quote {
  const date = parseDateString(todayStr);
  
  // Calculate days since epoch in local timezone
  // date is created at local midnight, so getTime() returns local midnight timestamp
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysSinceEpoch = Math.floor(date.getTime() / msPerDay);
  
  // Hashing logic: absolute value to prevent negative index for dates before epoch
  const totalQuotes = quotesData.length;
  const index = Math.abs(daysSinceEpoch) % totalQuotes;
  
  return quotesData[index];
}

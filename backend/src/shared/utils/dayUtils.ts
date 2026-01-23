// utils/dayUtils.ts

import { dayOfTheWeek } from "../enums/DayOfTheWeek";
import { addDays, addMonths, isAfter } from 'date-fns';

export const dayMap: Record<(typeof dayOfTheWeek)[number], number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};


export const getDayOfWeekNumber = (dayName: string): number => {
  const normalized = dayName.trim().toUpperCase();
  if (!(normalized in dayMap)) {
    throw new Error(`Invalid day: ${dayName}`);
  }
  return dayMap[normalized as keyof typeof dayMap];
}


export const getNextOrSameDay = (date: Date, targetDow: number): Date => {
  const currentDow = date.getDay();
  const daysToAdd = (targetDow + 7 - currentDow) % 7;
  return addDays(date, daysToAdd);
};

export function getFirstDateForDayOfWeek(startDate: Date, targetDow: number): Date {
  const date = new Date(startDate);
  const currentDow = date.getDay();
  const diff = (targetDow + 7 - currentDow) % 7;
  if (diff !== 0) {
    date.setDate(date.getDate() + diff);
  }
  return date;
}



export function addOneMonth(fecha: Date): Date {

  return addMonths(fecha, 1);
}

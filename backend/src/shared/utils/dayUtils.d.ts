import { dayOfTheWeek } from "../enums/DayOfTheWeek";
export declare const dayMap: Record<(typeof dayOfTheWeek)[number], number>;
export declare const getDayOfWeekNumber: (dayName: string) => number;
export declare const getNextOrSameDay: (date: Date, targetDow: number) => Date;
export declare function getFirstDateForDayOfWeek(startDate: Date, targetDow: number): Date;

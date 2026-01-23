import {
    mysqlTable,
    int,
    mysqlEnum,
    datetime,
    serial,
    varchar,
    bigint
  } from 'drizzle-orm/mysql-core';
  import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
  import { z } from 'zod';
import { dayOfTheWeek } from '../../shared/enums/DayOfTheWeek';
import { space } from './Space';
import { academyCourse } from './AcademyCourse';
import { reservation } from './Reservation';

export const courseTimeSlot = mysqlTable('course_time_slot', {
    id: serial('id').primaryKey(),
    day: mysqlEnum('day', dayOfTheWeek).notNull(),
    startHour: datetime('start_hour').notNull(),
    endHour: datetime('end_hour').notNull(),
    spaceUsed: varchar('name', { length: 255 }),
    academyCourseId: bigint('academy_course_id',{ mode: 'number', unsigned: true }).notNull().references(() => academyCourse.id, { onDelete: 'cascade' }),
    reservationId: bigint('reservation_id',{ mode: 'number', unsigned: true }).notNull().references(() => reservation.id, { onDelete: 'cascade' }),
  });
  

  export const courseTimeSlotInsertSchema = createInsertSchema(courseTimeSlot, {
    day: z.enum(dayOfTheWeek),
    startHour: z.string(),
    endHour: z.string(),
    spaceUsed: z.string().min(1).max(255).optional(),
    academyCourseId: z.number().int().optional(),
    reservationId: z.number().int().optional(),
  });

  export const courseTimeSlotSelectSchema = createSelectSchema(courseTimeSlot);
  export const courseTimeSlotUpdateSchema = courseTimeSlotInsertSchema.partial();
  
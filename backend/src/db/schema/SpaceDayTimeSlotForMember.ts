import {
  mysqlTable,
  int,
  date,
  datetime,
  boolean,
  serial,
  bigint,
  unique,
} from 'drizzle-orm/mysql-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { space } from './Space'; // Importa la tabla de espacio


export const spaceDayTimeSlotForMember = mysqlTable(
  'space_day_time_slot_for_member',
  {
    id: serial('id').primaryKey(),
    day: date('day').notNull(),
    startHour: datetime('start_hour').notNull(),
    endHour: datetime('end_hour').notNull(),
    isUsed: boolean('is_used').notNull().default(false),
    pricePerBlock: int('price_per_block').notNull().default(0),
    spaceUsed: bigint('space_used', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => space.id, { onDelete: 'cascade' }),
  },
  (table) => [
    unique('unique_slot_combination').on(
      table.isUsed,
      table.endHour,
      table.startHour,
      table.spaceUsed,
      table.day
    )
  ]
);


export const spaceDayTimeSlotForMemberInsertSchema = createInsertSchema(spaceDayTimeSlotForMember, {
  day: z.string(),
  startHour: z.string(),
  endHour: z.string(),
  spaceUsed: z.number().int().min(1),
});

export const academySelectSchema = createSelectSchema(spaceDayTimeSlotForMember);
export const academyUpdateSchema = spaceDayTimeSlotForMemberInsertSchema.partial();

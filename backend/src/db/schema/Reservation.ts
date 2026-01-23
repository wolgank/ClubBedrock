import {
  mysqlTable,
  serial,
  varchar,
  int,
  datetime,
  boolean,
  date,
  bigint,
} from 'drizzle-orm/mysql-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { space } from './Space';

export const reservation = mysqlTable('reservation', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  date: date('date').notNull(),
  startHour: datetime('start_hour').notNull(),
  endHour: datetime('end_hour').notNull(),
  capacity: int('capacity').notNull(),
  allowOutsiders: boolean('allow_outsiders').notNull(),
  description: varchar('description', { length: 255 }),
  isSpecial: boolean('is_special').default(false),
  spaceId: bigint('space_id', { mode: 'number', unsigned: true }).notNull().references(() => space.id, { onDelete: 'cascade' }),
});


export const reservationInsertSchema = createInsertSchema(reservation, {
  name: z.string().min(1),
  date: z.string(),
  startHour: z.string(),
  endHour: z.string(),
  capacity: z.number().int().min(1),
  allowOutsiders: z.boolean(),
  description: z.string().optional(),
  isSpecial: z.boolean().optional(),
  spaceId: z.number().int(),
});

export const reservationSelectSchema = createSelectSchema(reservation);
export const reservationUpdateSchema = reservationInsertSchema.partial();

import { relations } from 'drizzle-orm';

export const reservationRelation = relations(reservation, ({ one }) => ({
  space: one(space, {
    fields: [reservation.spaceId],
    references: [space.id],
  }),
}));
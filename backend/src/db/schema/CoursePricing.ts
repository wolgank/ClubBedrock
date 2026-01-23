import {
  mysqlTable,
  serial,
  varchar,
  int,
  bigint,
  boolean,
  decimal,
} from 'drizzle-orm/mysql-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { academyCourse } from './AcademyCourse';
export const coursepricicing = mysqlTable('course_pricicing', {
  id: serial('id').primaryKey(),
  numberDays: varchar('number_days', { length: 255 }).notNull(),
  inscriptionPriceMember: decimal('inscription_price_member', { precision: 10, scale: 2 }).notNull(),
  inscriptionPriceGuest: decimal('inscription_price_guest', { precision: 10, scale: 2 }).notNull(),
  isActive: boolean('is_active').default(true),
  academyCourseId: bigint('academy_course_id', { mode: 'number', unsigned: true }).notNull().references(() => academyCourse.id, { onDelete: 'cascade' }),
});

export const coursePricicingInsertSchema = createInsertSchema(coursepricicing, {
  numberDays: z.number().int().nonnegative(), // 0 = ilimitado
  inscriptionPriceMember: z.string(),
  inscriptionPriceGuest: z.string(),
  academyCourseId: z.number().optional(),
  isActive: z.boolean().optional(),
});

export const userSelectSchema = createSelectSchema(coursepricicing);
export const userUpdateSchema = coursePricicingInsertSchema.partial();


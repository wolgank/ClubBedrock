// src/db/schema/PasswordResetToken.ts
import {
  mysqlTable,
  text,
  timestamp,
  boolean,
  primaryKey,
  varchar,
  serial,
  bigint,
  datetime,
} from 'drizzle-orm/mysql-core';
import { auth } from './Auth';
import { z } from 'zod';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const passwordResetToken = mysqlTable('psw_reset', {
  id: serial('id').primaryKey(),
  userId: bigint('user_id', { mode: 'number', unsigned: true }).notNull().references(() => auth.id),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: datetime('expires_at', { mode: 'date' }).notNull(),
  used: boolean('used').default(false).notNull(),
  createdAt: datetime('created_at', { mode: 'date' }).notNull().$defaultFn(() => new Date()),
});
export const passwordResetTokenInsertSchema = createInsertSchema(passwordResetToken, {
  userId: z.number().int(), // bigint con mode 'number'
  token: z.string(),
  expiresAt: z.coerce.date(),
  used: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
});

export const passwordResetTokenSelectSchema = createSelectSchema(passwordResetToken);

export const passwordResetTokenUpdateSchema = passwordResetTokenInsertSchema.partial();
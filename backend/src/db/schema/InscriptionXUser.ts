import {
  mysqlTable,
  int,
  boolean,
  bigint,
} from 'drizzle-orm/mysql-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod'; // Asegúrate de importar correctamente tu tabla events si está en otro archivo
import { billDetail } from './BillDetail';
import { user } from './User';

export const inscriptionXUser = mysqlTable('inscription_x_user', {
  id: bigint('id', { mode: 'number', unsigned: true }).notNull().primaryKey().references(() => billDetail.id),
  isCancelled: boolean('is_cancelled').notNull(),
  userId: bigint('user_id', { mode: 'number', unsigned: true }).notNull().references(() => user.id, { onDelete: 'cascade' }),
});

export const inscriptionXUserInsertSchema = createInsertSchema(inscriptionXUser, {
  isCancelled: z.boolean(),
  userId: z.number().int(),
}).omit({ id: true });;

export const inscriptionXUserSelectSchema = createSelectSchema(inscriptionXUser);
export const inscriptionXUserUpdateSchema = inscriptionXUserInsertSchema.partial();

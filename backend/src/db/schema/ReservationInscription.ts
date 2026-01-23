import {
  mysqlTable,
  int,
  boolean,
  serial,
  bigint,
  foreignKey,
} from 'drizzle-orm/mysql-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { inscriptionXUser } from './InscriptionXUser';

export const reservationInscription = mysqlTable('reservation_inscription', {
  id: serial('id').primaryKey(),
  isCancelled: boolean('is_cancelled').notNull(),
  reservationId: bigint('reservation_id', { mode: 'number', unsigned: true })
    .notNull(),
  inscriptionXUser: bigint('inscription_x_user', { mode: 'number', unsigned: true })
    .notNull(),


}, (table) => [
  foreignKey({
    columns: [table.inscriptionXUser],
    foreignColumns: [inscriptionXUser.id],
    name: 'custom_fk_inscription_x_user_id',
  }),
]);


export const reservationInscriptionInsertSchema = createInsertSchema(reservationInscription, {
  isCancelled: z.boolean(),
}).omit({
  reservationId: true,
  inscriptionXUser: true,
});

export const reservationInscriptionSelectSchema = createSelectSchema(reservationInscription);
export const reservationInscriptionUpdateSchema = reservationInscriptionInsertSchema.partial();//

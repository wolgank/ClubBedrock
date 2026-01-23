import {
  mysqlTable,
  serial,
  bigint,
  tinyint,
} from 'drizzle-orm/mysql-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { academyInscription } from './AcademyInscription';

export const selectDayAcademyInscription = mysqlTable('select_day_a_i', {
  id: serial('id').primaryKey(),
  academyInscriptionId: bigint('ac_ins_id', { mode: 'number', unsigned: true })
    .notNull()
    .references(() => academyInscription.id, { onDelete: 'cascade' }),
  daySelection: tinyint('day_selection').notNull(), // 1 = lunes, ..., 7 = domingo
});


export const selectDayAcademyInscriptionInsertSchema = createInsertSchema(selectDayAcademyInscription, {
  academyInscriptionId: z.number().int().positive(),
  daySelection: z
    .number()
    .int()
    .min(1, 'Debe ser un día entre 1 (lunes) y 7 (domingo)')
    .max(7, 'Debe ser un día entre 1 (lunes) y 7 (domingo)'),
});

export const selectDayAcademyInscriptionSelectSchema = createSelectSchema(selectDayAcademyInscription);
export const selectDayAcademyInscriptionUpdateSchema = selectDayAcademyInscriptionInsertSchema.partial();

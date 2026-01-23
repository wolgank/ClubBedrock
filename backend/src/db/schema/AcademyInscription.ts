import {
    mysqlTable,
    serial,
    int,
    boolean,
    bigint,
  } from 'drizzle-orm/mysql-core';
  import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
  import { z } from 'zod';
import { user } from './User';
import { academyCourse } from './AcademyCourse';
import { inscriptionXUser } from './InscriptionXUser';

export const academyInscription = mysqlTable('academy_inscription', {
    id: serial('id').primaryKey(),
    isCancelled: boolean('is_cancelled').notNull(),
    academyCourseId: bigint('academyCourse_id',{ mode: 'number', unsigned: true }).notNull().references (() => academyCourse.id, {onDelete: 'cascade'}),
    inscriptionXUserId: bigint('inscription_x_user',{ mode: 'number', unsigned: true }).notNull().references (() => inscriptionXUser.id, {onDelete: 'cascade'}),
});

  export const academyInscriptionInsertSchema = createInsertSchema(academyInscription, {
    isCancelled: z.boolean(),
    academyCourseId: z.number().int().positive().min(1),
    inscriptionXUserId: z.number().int().positive().min(1),
  });
  
  export const academyInscriptionSelectSchema = createSelectSchema(academyInscription);
  export const academyInscriptionUpdateSchema = academyInscriptionInsertSchema.partial();
  
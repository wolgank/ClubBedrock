import {
    mysqlTable,
    int,
    boolean,
    serial,
    bigint,
  } from 'drizzle-orm/mysql-core';
  import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
  import { z } from 'zod';
import { event } from './Event'; // Asegúrate de importar correctamente tu tabla events si está en otro archivo
import { inscriptionXUser } from './InscriptionXUser';

export const eventInscription = mysqlTable('event_inscription', {
    id: serial('id').primaryKey(),
    assisted: boolean('assisted').notNull(),
    isCancelled: boolean('is_cancelled').notNull(),
    eventId: bigint('events_id',{ mode: 'number', unsigned: true }).notNull().references(() => event.id, { onDelete: 'cascade' }), // Corrected foreign key
    inscriptionXUser: bigint('inscription_x_user',{ mode: 'number', unsigned: true }).notNull().references (() => inscriptionXUser.id, {onDelete: 'cascade'}),
  });
  
  export const eventInscriptionInsertSchema = createInsertSchema(eventInscription, {
    assisted: z.boolean(),
    isCancelled: z.boolean().default(false),
    eventId: z.number().int(),
    inscriptionXUser: z.number().int(),
  });
  
  export const eventInscriptionSelectSchema = createSelectSchema(eventInscription);
  export const eventInscriptionUpdateSchema = eventInscriptionInsertSchema.partial();
  
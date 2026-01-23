import {
    mysqlTable,
    varchar,
    int,
    boolean,
    decimal,
    mysqlEnum,
    serial,
    bigint,
  } from 'drizzle-orm/mysql-core';
  import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
  import { z } from 'zod';
import { spaceType } from '../../shared/enums/SpaceType'; // Importa el enum SpaceType
import { reservation } from './Reservation';

export const space = mysqlTable('space', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: varchar('description', { length: 255 }),
  reference: varchar('reference', { length: 255 }),
  capacity: int('capacity').notNull(),
  urlImage: varchar('url_image', { length: 255 }),
  costPerHour: decimal('cost_per_hour', { precision: 10, scale: 2 }).notNull(),
  canBeReserved: boolean('can_be_reserved'),
  isAvailable: boolean('is_available').notNull(),
  type: mysqlEnum('type', spaceType).notNull(), // Using mysqlEnum if SpaceType is a predefined set of values
});

export const spaceInsertSchema = createInsertSchema(space, {
    name: z.string().min(1),
    description: z.string().optional(),
    reference: z.string().optional(),
    capacity: z.number().int().min(1),
    urlImage: z.string().nullable(),
    costPerHour: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Debe ser un decimal con hasta 2 decimales'),
    canBeReserved: z.boolean().optional(),
    isAvailable: z.boolean(),
    type: z.enum(spaceType),
  });
  
  export const spaceSelectSchema = createSelectSchema(space);
  export const spaceUpdateSchema = spaceInsertSchema.partial();
  
import { relations } from 'drizzle-orm';

export const spaceRelation = relations(space, ({ one }) => ({
  reservations: one(reservation, {
    fields: [space.id],
    references: [reservation.spaceId],
  }),
}));

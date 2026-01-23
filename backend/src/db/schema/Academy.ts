import {
    mysqlTable,
    serial,
    varchar,
    int,
    boolean,
    decimal,
  } from 'drizzle-orm/mysql-core';
  import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
  import { z } from 'zod';

export const academy = mysqlTable('academy', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    sport: varchar('sport', { length: 100 }),
    urlImage: varchar('url_image', { length: 255 }),
    description: varchar('description', { length: 255 }),
    isActive: boolean('is_active').default(true),
  });

export const academyInsertSchema = createInsertSchema(academy, {
  name: z.string().min(1),
  description: z.string().optional(),
  sport: z.string().min(1),
  urlImage: z.string().nullable(),
  isActive: z.boolean()
});

export const userSelectSchema = createSelectSchema(academy);
export const userUpdateSchema = academyInsertSchema.partial();

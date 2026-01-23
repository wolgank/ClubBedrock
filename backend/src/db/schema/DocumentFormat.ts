import {
    mysqlTable,
    int,
    bigint,
    varchar,
    boolean,
    mysqlEnum,
    serial,
  } from 'drizzle-orm/mysql-core';
  import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
  import { z } from 'zod';

  import { memberType } from './MemberType';
  
  export const documentFormat = mysqlTable('document_format', {
    id: serial('id').primaryKey(),
    isForInclusion: boolean('isForInclusion').notNull(),
    name: varchar('name', { length: 50 }).notNull(),
    description: varchar('description', { length: 50 }).notNull(),
    memberTypeForDocument: bigint('memberTypeForDocument',{ mode: 'number', unsigned: true }).notNull().references(() => memberType.id),
    active: boolean('active'), // no le pongo notnull AÚN pa no cagarlo tan feo
  });
  
  export const documentFormatInsertSchema = createInsertSchema(documentFormat, {
    isForInclusion: z.boolean(),
    name: z.string().min(1).max(50),
    description: z.string().min(1).max(50),
    //documentType: z.enum(documentType), //safa
    memberTypeForDocument: z.number(),
  });
  
  export const documentFormatSelectSchema = createSelectSchema(documentFormat);
  export const documentFormatUpdateSchema = documentFormatInsertSchema.partial();
  
import {
    mysqlTable,
    varchar,
    double,
    boolean,
    serial,
  } from 'drizzle-orm/mysql-core';
  import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
  import { z } from 'zod';

  export const memberType = mysqlTable('member_type', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 50 }).notNull(),
    description: varchar('description', { length: 250 }).notNull(),
    inclusionCost: double('inclusionCost').notNull(),
    exclusionCost: double('exclusionCost').notNull(),
    canPayAndRegister: boolean('isCanPayAndRegister').notNull(),
    costInMembershipFee: double('costInMembershipFee').notNull(),
    active: boolean('active'),  // no le pongo notnull AÚN pa no cagarlo tan feo
  });
  
  export const memberTypeInsertSchema = createInsertSchema(memberType, {
    name: z.string().min(1).max(50),
    description: z.string().min(1).max(250),
    inclusionCost: z.number(),
    exclusionCost: z.number(),
    canPayAndRegister: z.boolean(),
    costInMembershipFee: z.number(),
    active:z.boolean(),  // no le pongo notnull AÚN pa no cagarlo tan feo

  });
  
  export const memberTypeSelectSchema = createSelectSchema(memberType);
  export const memberTypeUpdateSchema = memberTypeInsertSchema.partial();
  
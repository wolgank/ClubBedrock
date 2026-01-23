import {
    mysqlTable,
    int,
    varchar,
    boolean,
    bigint,
    foreignKey,
  } from 'drizzle-orm/mysql-core';
  import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
  import { z } from 'zod';
  import { memberType } from './MemberType';
  import { user } from './User';

  
  export const member = mysqlTable('member', {
    id: bigint('id',{ mode: 'number', unsigned: true }).notNull().primaryKey().references(() => user.id),
    subCode: varchar('subCode', { length: 50 }).notNull().unique(),
    isActive: boolean('isActive').notNull(),
    memberTypeId: bigint('member_type_id',{ mode: 'number', unsigned: true }).notNull(),
  }, (table) => [
    foreignKey({
      columns: [table.memberTypeId],
      foreignColumns: [memberType.id],
      name: 'custom_fk_member_type_id',
    }),
  ]);
  
  export const memberInsertSchema = createInsertSchema(member, {
    id : z.number().int(),
    subCode: z.string().min(1).max(50),
    isActive:  z.boolean(),
    memberTypeId: z.number(),
  });
  
  export const memberSelectSchema = createSelectSchema(member);
  export const memberUpdateSchema = memberInsertSchema.partial();
  
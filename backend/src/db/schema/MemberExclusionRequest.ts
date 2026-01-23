import {
    mysqlTable,
    int,
    varchar,
    serial,
    bigint,
  } from 'drizzle-orm/mysql-core';
  import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
  import { z } from 'zod';
  import { member } from './Member';
import { memberRequest } from './MemberRequest';
  export const memberExclusionRequest = mysqlTable('member_exclusion_request', {
    id: bigint('id',{ mode: 'number', unsigned: true }).notNull().primaryKey().references(() => memberRequest.id),
    memberToExclude: bigint('id_Member',{ mode: 'number', unsigned: true }).notNull().references(() => member.id, { onDelete: 'cascade' }),
    reasonToExclude: varchar('reasonToExclude', { length: 250 }).notNull(),
  });

  export const memberExclusionRequestInsertSchema = createInsertSchema(memberExclusionRequest, {
    id: z.number().int(),
    memberToExclude: z.number().int(),
    reasonToExclude: z.string().min(1).max(250),
  });
  
  export const memberExclusionRequestSelectSchema = createSelectSchema(memberExclusionRequest);
  export const memberExclusionRequestUpdateSchema = memberExclusionRequestInsertSchema.partial();
  
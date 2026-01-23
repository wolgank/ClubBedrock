import {
    mysqlTable,
    int,
    date,
    varchar,
    mysqlEnum,
    bigint,
  } from 'drizzle-orm/mysql-core';
  import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
  import { z } from 'zod';
  import { memberType } from './MemberType';
  import { documentType } from '../../shared/enums/DocumentType';
import { memberRequest } from './MemberRequest';
import { user } from './User';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  export const memberInclusionRequest = mysqlTable('member_inclusion_request', {
    id: bigint('id',{ mode: 'number', unsigned: true }).notNull().primaryKey().references(() => memberRequest.id),

    newMemberType: bigint('newMemberType',{ mode: 'number', unsigned: true }).notNull().references(() => memberType.id),

    idUserReferenced: bigint('id_user_referenced', { mode: 'number', unsigned: true }).references(() => user.id),
  });
  
  export const memberInclusionRequestInsertSchema = createInsertSchema(memberInclusionRequest, {
    id: z.number().int(),

    newMemberType: z.number(),

  });
  
  export const memberInclusionRequestSelectSchema = createSelectSchema(memberInclusionRequest);
  export const memberInclusionRequestUpdateSchema = memberInclusionRequestInsertSchema.partial();
  
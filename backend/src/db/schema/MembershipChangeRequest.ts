import {
    mysqlTable,
    varchar,
    date,
    mysqlEnum,
    serial,
    datetime,
    boolean,
    bigint,
  } from 'drizzle-orm/mysql-core';
  import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
  import { z } from 'zod';
  import { requestState } from '../../shared/enums/RequestState';
import { membershipChangeType } from '../../shared/enums/MembershipChangeType';
import { membership } from './Membership';
  export const membershipChangeRequest = mysqlTable('membership_change_request', {
    id: serial('id').primaryKey(),
    membership: bigint('id_membership',{ mode: 'number', unsigned: true }).notNull().references(() => membership.id),
    requestState: mysqlEnum('requestState', requestState),
    type: mysqlEnum('type', membershipChangeType),
    madeByAMember: boolean("madeByAMember").notNull(),
    memberReason: varchar('memberReason', { length: 255 }),
    submissionDate: datetime('submissionDate').notNull(),
    resolutionDate: datetime('resolutionDate'),
    managerNotes: varchar('managerNotes', { length: 255 }),
    changeStartDate: date('changeStartDate').notNull(),
    changeEndDate: date('changeEndDate'),
  });
  export const membershipChangeRequestInsertSchema = createInsertSchema(membershipChangeRequest, {
    membership: z.number().int(),
    requestState:     z.enum(requestState),
    type:             z.enum(membershipChangeType),
    madeByAMember:    z.boolean(),
    memberReason:     z.string().optional(),
    submissionDate:   z.coerce.date(),
    resolutionDate:   z.coerce.date().optional(),
    managerNotes:     z.string().optional(),
    changeStartDate:  z.coerce.date(),
    changeEndDate:    z.coerce.date().optional(),
  });
  
  export const membershipChangeRequestSelectSchema = createSelectSchema(membershipChangeRequest);
  export const membershipChangeRequestUpdateSchema = membershipChangeRequestInsertSchema.partial();
  
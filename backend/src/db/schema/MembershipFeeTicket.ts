import {
    mysqlTable,
    int,
    boolean,
    foreignKey,
    datetime,
    bigint,
} from 'drizzle-orm/mysql-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
//import { Membership } from './membership'; // Import the membership table
import { billDetail } from './BillDetail'; // Import the billDetail table
import { membership } from './Membership';

export const membershipFeeTicket = mysqlTable('membership_fee_ticket', {
    id: bigint('id',{ mode: 'number', unsigned: true }).notNull().primaryKey().references(() => billDetail.id),
    membershipId: bigint('membership_id',{ mode: 'number', unsigned: true }).notNull().references(() => membership.id),
    startDate: datetime('start_date').notNull(),
    endDate: datetime('end_date').notNull(),
    moratoriumApplied: boolean('moratorium_applied').notNull(),
});

export const membershipFeeTicketInsertSchema = createInsertSchema(membershipFeeTicket, {

    id: z.number().int(),   //es FK, debe enviarse
    membershipId: z.number().int(),
    startDate: z.date(),
    endDate: z.date(),
    moratoriumApplied: z.boolean(),

   // idBillDetail: z.number().optional(),
});
export const membershipFeeTicketSelectSchema = createSelectSchema(membershipFeeTicket);
export const membershipFeeTicketUpdateSchema = membershipFeeTicketInsertSchema.partial();

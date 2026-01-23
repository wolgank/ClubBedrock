import {
    mysqlTable,
    serial,
    int,
    bigint,
    varchar,
} from 'drizzle-orm/mysql-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { member } from './Member';
import { membershipApplication } from './MembershipApplication';

export const recomendationMember = mysqlTable('rec_member', {
    id: serial('id').primaryKey(),
    //podría ser nula:
    memberId: bigint('member_id',{ mode: 'number', unsigned: true }).references(() => member.id, { onDelete: 'cascade' }), //no se envía de parte del usuario, por ahora nada
   // membershipApplicationID: bigint('membership_application_id',{ mode: 'number', unsigned: true }).notNull().references(() => membershipApplication.id, { onDelete: 'cascade' }),
    subCodeInserted: varchar('subCodeInserted', { length: 50 }).notNull(),
    namesAndLastNamesInserted: varchar('names_and_lastNames_inserted', { length: 255 }).notNull(),

});

export const recomendationMemberInsertSchema = createInsertSchema(recomendationMember, {
    memberId: z.number().int(),
    subCodeInserted: z.string().max(50),
    namesAndLastNamesInserted: z.string().max(255),
   // membershipApplicationID: z.number().int(),
});

export const recomendationMemberSelectSchema = createSelectSchema(recomendationMember);
export const recomendationMemberUpdateSchema = recomendationMemberInsertSchema.partial();

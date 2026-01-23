import {
    mysqlTable,
    serial,
    int,
    mysqlEnum,
    datetime,
    bigint,
} from 'drizzle-orm/mysql-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { reasonToEndMembership } from '../../shared/enums/ReasonToEndMembership';
import { membership } from './Membership';
import { member } from './Member';
import { foreignKey } from 'drizzle-orm/gel-core';

export const membershipXMember = mysqlTable('membership_x_member', {
    id: serial('id').primaryKey(),
    memberId: bigint('member_id',{ mode: 'number', unsigned: true })
        .notNull()
        .references(() => member.id), // Foreign key to Member -  Necesitarías la tabla Member
    membershipId: bigint('membership_id',{ mode: 'number', unsigned: true })
        .notNull().references(() => membership.id, { onDelete: 'cascade' }),
    startDate: datetime('start_date').notNull(),
    endDate: datetime('end_date'),
    reasonToEnd: mysqlEnum('reason_to_end', reasonToEndMembership),
});

export const membershipXMemberInsertSchema = createInsertSchema(membershipXMember, {
    memberId: z.number().int(),
    membershipId: z.number().int(),
    startDate: z.date(),
    endDate: z.date().optional(),
    reasonToEnd: z.enum(reasonToEndMembership).optional(),
});
export const membershipXMemberSelectSchema = createSelectSchema(membershipXMember);
export const membershipXMemberUpdateSchema = membershipXMemberInsertSchema.partial();

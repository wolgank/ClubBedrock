import {
    mysqlTable,
    serial,
    varchar,
    mysqlEnum,
} from 'drizzle-orm/mysql-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { membershipState } from '../../shared/enums/MembershipState';

export const membership = mysqlTable('membership', {
    id: serial('id').primaryKey(),
    code: varchar('code', { length: 255 }).notNull(),
    state: mysqlEnum('state', membershipState).notNull(),
});

export const membershipInsertSchema = createInsertSchema(membership, {
    id:          z.number().optional(), //no sé por qué si no ponía esto se bugeaba
  code:        z.string().min(1).max(255),
  state:       z.enum(membershipState),
});
export const membershipSelectSchema = createSelectSchema(membership);
export const membershipUpdateSchema = membershipInsertSchema.partial();
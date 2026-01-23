import {
    mysqlTable,
    serial,
    decimal,
    text,
    datetime,
    mysqlEnum,
    bigint,
} from 'drizzle-orm/mysql-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { debtStatus } from '../../shared/enums/DebtStatus';
import { user } from './User';

export const bill = mysqlTable('bill', {
    id: serial('id').primaryKey(),
    finalAmount: decimal('final_amount', { precision: 10, scale: 2 }).notNull(),
    status: mysqlEnum('status', debtStatus).notNull(),
    description: text('description'),
    createdAt: datetime('created_at').notNull(),
    dueDate: datetime('due_date'),
    userId: bigint('user_id',{ mode: 'number', unsigned: true }).notNull().references(() => user.id, { onDelete: 'cascade' }),
});

export const billInsertSchema = createInsertSchema(bill, {
    finalAmount: z.number(),
    status: z.enum(debtStatus),
    description: z.string().optional(),
    createdAt: z.string(),
    dueDate: z.string(),
    userId: z.number().int(),
});

export const billSelectSchema = createSelectSchema(bill);
export const billUpdateSchema = billInsertSchema.partial();
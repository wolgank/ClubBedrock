import {
    mysqlTable,
    int,
    decimal,
    mysqlEnum,
    datetime,
    varchar,
    bigint,
} from 'drizzle-orm/mysql-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { paymentMethod } from '../../shared/enums/PaymentMethod';
import { debtStatus } from '../../shared/enums/DebtStatus';
import { bill } from './Bill';


export const payment = mysqlTable('payment', {
    id: bigint('id',{ mode: 'number', unsigned: true }).notNull().primaryKey().references(() => bill.id),
    debtId: varchar('debt_id', { length: 255 }).notNull(),  //  No FK, changed to debtId
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    status: mysqlEnum('status', debtStatus).notNull(),
    paymentDate: datetime('payment_date').notNull(),
    paymentMethod: mysqlEnum('payment_method', paymentMethod).notNull(),
    referenceCode: varchar('reference_code', { length: 255 }).notNull(),
});

export const paymentInsertSchema = createInsertSchema(payment, {
    id: z.number().int(),
    debtId: z.string().min(1).max(250),
    amount: z.string().min(1),  
    status: z.enum(debtStatus),
    paymentDate: z.date(),
    paymentMethod: z.enum(paymentMethod),
    referenceCode: z.string().max(255),
});
export const paymentSelectSchema = createSelectSchema(payment);
export const paymentUpdateSchema = paymentInsertSchema.partial();

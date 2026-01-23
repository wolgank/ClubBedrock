import {
    mysqlTable,
    serial,
    int,
    decimal,
    text,
    bigint,
    varchar
} from 'drizzle-orm/mysql-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { bill } from './Bill';


export const billDetail = mysqlTable('bill_detail', {
    id: serial('id').primaryKey(),
    billId: bigint('bill_id', { mode: 'number', unsigned: true }).notNull().references(() => bill.id, { onDelete: 'cascade' }),
    price: decimal('price', { precision: 10, scale: 2 }).notNull(),
    discount: decimal('discount', { precision: 10, scale: 2 }),
    finalPrice: decimal('final_price', { precision: 10, scale: 2 }).notNull(),
    description: varchar('description', { length: 255 }),
});

export const billDetailInsertSchema = createInsertSchema(billDetail, {
    price: z.number(),
    discount: z.number().optional(),
    finalPrice: z.number(),
    description: z.string().optional(),
});

export const billDetailStringInsertSchema = createInsertSchema(billDetail, {
    price: z.string(),
    discount: z.string().optional(),
    finalPrice: z.string(),
    description: z.string().optional(),
});

export const billDetailSelectSchema = createSelectSchema(billDetail);
export const billDetailUpdateSchema = billDetailInsertSchema.partial();
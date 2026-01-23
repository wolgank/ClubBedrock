import {
    mysqlTable,
    serial,
    varchar,
    int,
    datetime,
    text,
    mysqlEnum,
    bigint,
} from 'drizzle-orm/mysql-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
// Import the Action enum we defined earlier
import { action } from '../../shared/enums/Action'; // Make sure the path to action.ts is correct.
import { auth } from './Auth'; // Import auth table

export const auditory = mysqlTable('auditory', {
    id: serial('id').primaryKey(),
    tableChanged: varchar('table_changed', { length: 255 }).notNull(),
    fieldChanged: varchar('field_changed', { length: 255 }).notNull(),
    previousValue: text('previous_value'),
    postValue: text('post_value'),
    idRowModifiedOrCreated: int('id_row_modified_or_created').notNull(),
    dateHour: datetime('date_hour').notNull(),
    action: mysqlEnum('action', action).notNull(),
    accountId: bigint('account_id',{ mode: 'number', unsigned: true }).notNull().references(() => auth.id, { onDelete: 'cascade' }), // Corrected foreign key
});

export const auditoryInsertSchema = createInsertSchema(auditory, {
    tableChanged: z.string().min(1).max(255),
    fieldChanged: z.string().min(1).max(255),
    previousValue: z.string().optional(),
    postValue: z.string().optional(),
    idRowModifiedOrCreated: z.number().int().positive(),
    dateHour: z.date(),
    action: z.enum(action),
    accountId: z.number(), // Added accountId to the schema
});
export const auditorySelectSchema = createSelectSchema(auditory);
export const auditoryUpdateSchema = auditoryInsertSchema.partial();

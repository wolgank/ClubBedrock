import {
    mysqlTable,
    mysqlEnum,
    float,
    boolean,
    int,
    bigint,
} from 'drizzle-orm/mysql-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { user } from './User'; // Import the user table
import { role } from '../../shared/enums/Role';

// Define the EmployeePosition enum

export const employee = mysqlTable('employee', {
    id: bigint('id',{ mode: 'number', unsigned: true }).notNull().primaryKey().references(() => user.id),
    position: mysqlEnum('position', role).notNull(),
    salary: float('salary').notNull(),
    active: boolean('active').notNull(),
});

export const employeeInsertSchema = createInsertSchema(employee, {
    id : z.number().int(),
    position: z.enum(role),
    salary: z.number(),
    active: z.boolean(),
});
export const employeeSelectSchema = createSelectSchema(employee);
export const employeeUpdateSchema = employeeInsertSchema.partial();

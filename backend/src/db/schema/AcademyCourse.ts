import {
    mysqlTable,
    serial,
    varchar,
    int,
    date,
    bigint,
    boolean,mysqlEnum,
  } from 'drizzle-orm/mysql-core';
  import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
  import { z } from 'zod';
import { academy } from './Academy';
import {academyCourseType} from '../../shared/enums/AcademyCourseType';
import { courseTimeSlot as courseTimeSlotTable } from "../schema/CourseTimeSlot";
import { sql } from 'drizzle-orm';
export const academyCourse = mysqlTable('academy_course', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),
    capacity: int('capacity').notNull().default(0), // 0 for unlimited
    registerCount: int('register_count').notNull().default(0),
    courseType: mysqlEnum('course_type', academyCourseType), // Using mysqlEnum if SpaceType is a predefined set of values
    urlImage: varchar('url_image', { length: 255 }),
    description: varchar('description', {length: 255}), //    accountId: int('account_id').notNull().references(() => auth.id, { onDelete: 'cascade' }), // Corrected foreign key
    allowOutsiders: boolean('allow_outsiders').notNull(),
    academyId: bigint('academy_id',{ mode: 'number', unsigned: true }).notNull().references (() => academy.id, {onDelete: 'cascade'}),
    isActive: int('is_active').default(1), // 1 for true, 0 for false
  });   

  export const academyCourseInsertSchema = createInsertSchema(academyCourse, {
    name: z.string().min(1),
    startDate: z.string(),
    endDate: z.string(),
    capacity: z.number().int().nonnegative(), // 0 for unlimited
    urlImage: z.string().nullable(),
    description: z.string().optional(),
    allowOutsiders: z.boolean(),
    isActive: z.number().default(1),
    courseType: z.enum(academyCourseType),
  });
  

export const academyCourseSelectSchema = createSelectSchema(academyCourse, {
  startDate: z.preprocess((val) => new Date(val as string | number | Date), z.date()),
  endDate: z.preprocess((val) => new Date(val as string | number | Date), z.date())
});


export const academyCourseGrupSelectSchema = z.object({
  id: z.number(),
  name: z.string(),
  startDate: z.preprocess((val) => new Date(val as string | number | Date), z.date()),
  endDate: z.preprocess((val) => new Date(val as string | number | Date), z.date()),
  capacity: z.number().int().nonnegative(),
  allowOutsiders: z.boolean(),
  isActive: z.boolean(),
  courseType: z.string().nullable(),
  description: z.string().optional(),
  urlImage: z.string().nullable(),
  day: z.string().optional(),          // Si lo usas (día de la semana)
  startTime: z.string().optional(),    // Hora en formato 'HH:mm:ss'
  endTime: z.string().optional(),
});


  export const academyCourseUpdateSchema = academyCourseInsertSchema.partial();
  



        
        
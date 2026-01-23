import {
    mysqlTable,
    serial,
    varchar,
    int,
    date,
    text,
    mysqlEnum,
    bigint,
} from 'drizzle-orm/mysql-core';
  import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
  import { z } from 'zod';
  import { auth } from './Auth'; // Asegúrate de importar correctamente tu tabla auth si está en otro archivo
import { documentType } from '../../shared/enums/DocumentType';
import { gender } from '../../shared/enums/Gender';
  
  export const user = mysqlTable('user', {
    id: serial('id').primaryKey(),
    lastname: varchar('lastname', { length: 100 }).notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    documentType: mysqlEnum('document_type', documentType),
    documentID: varchar('document_id', { length: 20 }),
    phoneNumber: varchar('phone_number', { length: 20 }),
    birthDate: date('birth_date'),
    gender: mysqlEnum('gender', gender),
    address: text('address'),
    profilePictureURL: text('profile_picture_url'),
    accountID: bigint('account_id',{ mode: 'number', unsigned: true }).notNull().references(() => auth.id, { onDelete: 'cascade' }),
  });
  
  export const userInsertSchema = createInsertSchema(user, {
    lastname: z.string().min(1).max(100),
    name: z.string().min(1).max(100),
    documentType: z.enum(documentType).optional(),
    documentID: z.string().min(1).max(20).optional(),
    phoneNumber: z.string().max(20).optional(),
    birthDate: z.coerce.date().optional(),
    gender: z.enum(gender).optional(),
    address: z.string().optional(),
    profilePictureURL: z.string().url().optional(),
    accountID: z.number().int(),
  });
  export const userSelectSchema = createSelectSchema(user);
  export const userUpdateSchema = userInsertSchema.partial();
  
import { mysqlTable, serial, varchar, boolean, mysqlEnum, index } from 'drizzle-orm/mysql-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { role } from '../../shared/enums/Role';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const auth = mysqlTable('auth', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  username: varchar('username', { length: 255 }).notNull(),
  password: varchar('password', { length: 255 }),  // puede ser null si OAuth
  role: mysqlEnum('role', role).notNull(),
  isActive: boolean('is_active').notNull(),
  googleId: varchar('google_id', { length: 255 }).unique(), // ID Google OAuth, nullable y único
  oauthProvider: varchar('oauth_provider', { length: 50 }), // Ejemplo: 'google'
}, (t) => [
  index('email_idx').on(t.email),
  index('google_id_idx').on(t.googleId),
]);

// Insert schema para crear usuario, validación adaptada
export const authInsertSchema = createInsertSchema(auth, {
  email: z.string()
    .min(5, { message: 'El email debe tener al menos 5 caracteres' })
    .max(255, { message: 'El email no puede tener más de 255 caracteres' })
    .email({ message: 'Debe ser un correo válido (ejemplo@dominio.com)' })
    .regex(emailRegex, { message: 'Formato de correo inválido' }),
  username: z.string()
    .min(3, { message: 'El username debe tener al menos 3 caracteres' })
    .max(255, { message: 'El username no puede tener más de 255 caracteres' })
    .optional(),
  password: z.string()
    .min(6, { message: "La contraseña debe tener al menos 6 caracteres" })
    .max(255)
    .optional()
    .nullable(), // opcional y nullable para usuarios OAuth
  role: z.enum(role),
  isActive: z.boolean().optional(),
  googleId: z.string().optional().nullable(),
  oauthProvider: z.string().optional().nullable(),
});

// Select schema con campos opcionales para password, googleId y oauthProvider
export const authSelectSchema = createSelectSchema(auth).extend({
  password: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  googleId: z.string().optional().nullable(),
  oauthProvider: z.string().optional().nullable(),
});

// Update schema puede ser parcial
export const authUpdateSchema = authInsertSchema.partial();

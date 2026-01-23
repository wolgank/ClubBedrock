import {
    mysqlTable,
    serial,
    varchar,
    decimal,
    int,
    text,
} from 'drizzle-orm/mysql-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

export const club = mysqlTable('club', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    slogan: varchar('slogan', { length: 255 }).notNull(),
    logoUrl: text('logo_url'),
    moratoriumRate: decimal('moratorium_rate', { precision: 10, scale: 2 }).notNull(),
    maxMemberReservationHoursPerDayAndSpace: int('max_member_reservation_hours_per_day_and_space').notNull(),
    maxMemberReservationHoursPerDay: int('max_member_reservation_hours_per_day').notNull(),
    maxGuestsNumberPerMonth: int('max_guests_number_per_month').notNull(),
    devolutionReservationRate: decimal('devolution_reservation_rate', { precision: 10, scale: 2 }).notNull(),
    devolutionEventInscriptionRate: decimal('devolution_event_inscription_rate', { precision: 10, scale: 2 }).notNull(),
    devolutionAcademyInscriptionRate: decimal('devolution_academy_inscription_rate', { precision: 10, scale: 2 }).notNull(),
    paymentDeadlineDays: int('payment_deadline_days').notNull(),
    portadaURL: text('portada_url'),
    address: text('address'),
    openHours: text('open_hours'),
    email: varchar('email', { length: 255 }),
    phone: varchar('phone', { length: 20 }),

});

export const clubInsertSchema = createInsertSchema(club, {
    name: z.string().min(1).max(255),
    slogan: z.string().min(1).max(255),
    logoUrl: z.string().url().optional(),
    moratoriumRate: z.number(), //  Zod doesn't have a direct decimal type, but number works
    paymentDeadlineDays: z.number(),
    maxMemberReservationHoursPerDayAndSpace: z.number().int().positive(),
    maxMemberReservationHoursPerDay: z.number().int().positive(),
    maxGuestsNumberPerMonth: z.number().int().positive(),
    devolutionReservationRate: z.number(),
    devolutionEventInscriptionRate: z.number(),
    devolutionAcademyInscriptionRate: z.number(),
    portadaURL: z.string().url().optional(),
    address: z.string().optional(),
    openHours: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().max(20).optional(),
});
export const clubSelectSchema = createSelectSchema(club);
export const clubUpdateSchema = clubInsertSchema.partial();

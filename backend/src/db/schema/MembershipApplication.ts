import {
    mysqlTable,
    int,
    varchar,
    bigint,
} from 'drizzle-orm/mysql-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { memberRequest } from './MemberRequest';
import { auth } from './Auth'; // Asegúrate de importar correctamente tu tabla auth si está en otro archivo
import { recomendationMember } from './RecommendationMember';

//entidad muy dependiente que armaremos hasta el final para tener una solicitud de membresía recién.
export const membershipApplication = mysqlTable('membership_aplk', {
    id: bigint('id',{ mode: 'number', unsigned: true }).notNull().primaryKey().references(() => memberRequest.id),

    idPosiblyPartner: bigint('idPosiblyPartner',{ mode: 'number', unsigned: true }).references(() => memberRequest.id),

    applicantJobInfo: varchar('applicantJobInfo', { length: 250 }).notNull(), // Foreign Key to memberType, if exists
    accountID: bigint('account_id',{ mode: 'number', unsigned: true }).notNull().references(() => auth.id, { onDelete: 'cascade' }),
    accountPosiblyPartnerID: bigint('account_posibly_partner_id',{ mode: 'number', unsigned: true }).references(() => auth.id, { onDelete: 'cascade' }),

    idRecommendationMember1: bigint('idRecommendationMember1',{ mode: 'number', unsigned: true }).notNull().references(() => recomendationMember.id),
    idRecommendationMember2: bigint('idRecommendationMember2',{ mode: 'number', unsigned: true }).notNull().references(() => recomendationMember.id),
});

export const membershipApplicationInsertSchema = createInsertSchema(membershipApplication, {
    id: z.number().int(),
    idPosiblyPartner: z.number().int().optional(),
    
    applicantJobInfo: z.string().min(1).max(250),
    accountID: z.number().int(),
    accountPosiblyPartnerID: z.number().int(),
    idRecommendationMember1: z.number().int(),
    idRecommendationMember2: z.number().int(),
});

export const membershipApplicationSelectSchema = createSelectSchema(membershipApplication);
export const membershipApplicationUpdateSchema = membershipApplicationInsertSchema.partial();

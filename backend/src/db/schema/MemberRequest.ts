import {
    mysqlTable,
    varchar,
    date,
    mysqlEnum,
    serial,
    bigint,
  } from 'drizzle-orm/mysql-core';
  import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
  import { z } from 'zod';
  import { requestState } from '../../shared/enums/RequestState';
import { billDetail } from './BillDetail';
import { member } from './Member';
  export const memberRequest = mysqlTable('member_request', {
    id: serial('id').primaryKey(),
    reason: varchar('reason', { length: 50 }).notNull(),
    submissionDate: date('submissionDate'),
    requestState: mysqlEnum('requestState', requestState),

    //detalle de boleta asociada
    idBillDetail: bigint('id_bill_detail', { mode: 'number', unsigned: true }).references(() => billDetail.id),

    idRequestingMember: bigint('id_requesting_member', { mode: 'number', unsigned: true }).references(() => member.id),
  });
  export const memberRequestInsertSchema = createInsertSchema(memberRequest, {
    reason: z.string().min(1).max(50),
    submissionDate: z.coerce.date().optional(),
    requestState: z.enum(requestState).optional(),
    
    idBillDetail: z.number().optional(),
  });
  
  export const memberRequestSelectSchema = createSelectSchema(memberRequest);
  export const memberRequestUpdateSchema = memberRequestInsertSchema.partial();
  
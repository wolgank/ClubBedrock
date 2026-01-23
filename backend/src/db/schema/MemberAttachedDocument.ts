import {
    mysqlTable,
    int,
    varchar,
    serial,
    bigint,
    foreignKey,
  } from 'drizzle-orm/mysql-core';
  import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
  import { z } from 'zod';
  import { documentFormat } from './DocumentFormat';
import { memberRequest } from './MemberRequest';
  export const memberAttachedDocument = mysqlTable('member_attached_document', {
    id: serial('id').primaryKey(),
    fileName: varchar('fileName', { length: 255 }).notNull(),
    fileUrl: varchar('fileUrl', { length: 255 }).notNull(),
    memberRequestID: bigint('member_request_id',{ mode: 'number', unsigned: true }).notNull(),
    documentFormatId: bigint('document_format_id',{ mode: 'number', unsigned: true }).notNull(),
  }, (table) => [
      foreignKey({
        columns: [table.memberRequestID],
        foreignColumns: [memberRequest.id],
        name: 'custom_fk_member_request_id',
      }),
      foreignKey({
        columns: [table.documentFormatId],
        foreignColumns: [documentFormat.id],
        name: 'custom_fk_document_format_id',
      }),
    ]);
    
  export const memberAttachedDocumentInsertSchema = createInsertSchema(memberAttachedDocument, {
    fileName: z.string().min(1).max(50),
    fileUrl: z.string().min(1).max(50),
    memberRequestID: z.number().int(),
    documentFormatId: z.number().int(),
  });
  
  export const memberAttachedDocumentSelectSchema = createSelectSchema(memberAttachedDocument);
  export const memberAttachedDocumentUpdateSchema = memberAttachedDocumentInsertSchema.partial();
  
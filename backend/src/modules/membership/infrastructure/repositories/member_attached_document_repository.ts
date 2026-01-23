import type { z } from 'zod'
import { db } from '../../../../db'
import { memberAttachedDocument, memberAttachedDocumentInsertSchema } from '../../../../db/schema/MemberAttachedDocument'
import {eq}from 'drizzle-orm'
import { documentFormat, type documentFormatSelectSchema } from '../../../../db/schema/DocumentFormat'
// Tipo de un registro completo de la tabla, según Drizzle
export type MemberAttachedDocumentRecord = z.infer<typeof memberAttachedDocumentInsertSchema>

// La interfaz para insertar varios documentos
export interface CreateManyMemberAttachedDocumentInput {
  fileName: string
  fileUrl: string
  memberRequestID: number
  documentFormatId: number
}

/**
 * Inserta múltiples documentos adjuntos en la base de datos.
 *
 * Dado que MySQL (con Drizzle ORM) no soporta RETURNING en INSERT masivo,
 * simplemente invocamos `await db.insert(...).values(...)`. Si quisieras
 * capturar `insertId` o `affectedRows`, podrías asignar el resultado de esa llamada
 * a una variable, pero en este caso devolvemos `Promise<void>`.
 */
export async function insertMany(
  items: CreateManyMemberAttachedDocumentInput[]
): Promise<void> {
  // Llamada directa a .insert(...).values(...) sin .run() ni .execute()
  await db
    .insert(memberAttachedDocument)
    .values(
      items.map((item) => ({
        fileName: item.fileName,
        fileUrl: item.fileUrl,
        memberRequestID: item.memberRequestID,
        documentFormatId: item.documentFormatId,
      }))
    )

  // Si necesitas inspeccionar cuántas filas se afectaron o el insertId:
  // const result = await db
  //   .insert(memberAttachedDocument)
  //   .values(items.map(...))
  // //console.log('insertId:', result.insertId, 'affectedRows:', result.affectedRows)
}

/**
 * Recupera todos los documentos adjuntos asociados a una solicitud de miembro.
 */
export async function findByMemberRequestId(
  memberRequestID: number
): Promise<MemberAttachedDocumentRecord[]> {
  const rows = await db
    .select()
    .from(memberAttachedDocument)
    .where(eq(memberAttachedDocument.memberRequestID, memberRequestID))

  return rows
}

// Tipo Zod para los formatos
export type DocumentFormatRecord = z.infer<typeof documentFormatSelectSchema>

// Interfaz combinada para devolver documento + formato anidado
export interface MemberAttachedDocumentWithFormat {
  id: number
  fileName: string
  fileUrl: string
  memberRequestID: number
  documentFormatId: number
  format: DocumentFormatRecord
}
/**
 * Recupera todos los documentos adjuntos de una solicitud,
 * junto con los datos del `documentFormat` al que pertenecen.
 */
export async function findByMemberRequestIdWithFormat(
  memberRequestID: number
): Promise<MemberAttachedDocumentWithFormat[]> {
  const rows = await db
    .select({
      doc: memberAttachedDocument,
      fmt: documentFormat,
    })
    .from(memberAttachedDocument)
    .leftJoin(
      documentFormat,
      eq(memberAttachedDocument.documentFormatId, documentFormat.id)
    )
    .where(eq(memberAttachedDocument.memberRequestID, memberRequestID))

  return rows.map(({ doc, fmt }) => ({
    id: doc.id,
    fileName: doc.fileName,
    fileUrl: doc.fileUrl,
    memberRequestID: doc.memberRequestID,
    documentFormatId: doc.documentFormatId,
    format: fmt!,
  }))
}



import type { Context } from 'hono'
import { attachDocumentsToMemberRequest, listDocumentsByMemberRequest, type AttachDocumentInput } from '../../application/member_attached_document_service'
import { z } from 'zod'
import {  type MemberAttachedDocumentRecord } from '../repositories/member_attached_document_repository'

// --- Esquema de validación con Zod (opcional) ---
const AttachDocsSchema = z.object({
  documents: z
    .array(
      z.object({
        fileName: z.string().min(1),
        idDocumentFormat: z.number().int().positive(),
      })
    )
    .nonempty(),
})
/**
 * Controlador para adjuntar múltiples documentos a una solicitud de miembro.
 * Ruta: POST /api/member-requests/:id/documents
 */
export const createMultiple = async (c: Context) => {
  // 1) Obtengo el ID de la ruta
  const idParam = c.req.param('id')
  const idMemberRequest = Number(idParam)
  if (isNaN(idMemberRequest) || idMemberRequest <= 0) {
    return c.json({ error: 'El parámetro id no es válido' }, 400)
  }

  // 2) Parseo y valido body
  const body = await c.req.json()
  const parseResult = AttachDocsSchema.safeParse(body)
  if (!parseResult.success) {
    return c.json({ error: parseResult.error.flatten() }, 400)
  }
  const { documents } = parseResult.data as { documents: AttachDocumentInput[] }

  try {
    // 3) Llamo al service y obtengo el array de documentos insertados
    const insertedDocs: MemberAttachedDocumentRecord[] =
      await attachDocumentsToMemberRequest(idMemberRequest, documents)

    // 4) Retorno en JSON los registros insertados (o todos los docs en esa solicitud)
    return c.json(
      {
        message: 'Documentos adjuntados correctamente',
        data: insertedDocs,
      },
      201
    )
  } catch (err: any) {
    console.error('Error en controller.attachDocuments:', err)
    return c.json(
      { error: err.message || 'Error interno al adjuntar documentos' },
      500
    )
  }
}

/**
 * GET /api/member-requests/:id/documents  
 * Lista todos los documentos adjuntos de una memberRequest específica.
 */
export const listByMemberRequest = async (c: Context) => {
  const idParam = c.req.param('id')
  const idMemberRequest = Number(idParam)
  if (isNaN(idMemberRequest) || idMemberRequest <= 0) {
    return c.json({ error: 'El parámetro id no es válido' }, 400)
  }

  try {
    const docs: MemberAttachedDocumentRecord[] =
      await listDocumentsByMemberRequest(idMemberRequest)

    return c.json(
      {
        message: 'Documentos obtenidos correctamente',
        data: docs,
      },
      200
    )
  } catch (err: any) {
    console.error('Error en controller.listByMemberRequest:', err)
    return c.json(
      { error: err.message || 'Error interno al obtener documentos' },
      500
    )
  }
}
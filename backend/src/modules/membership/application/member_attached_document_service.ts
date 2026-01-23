import { findByMemberRequestId, findByMemberRequestIdWithFormat, insertMany, type CreateManyMemberAttachedDocumentInput, type MemberAttachedDocumentRecord, type MemberAttachedDocumentWithFormat } from '../infrastructure/repositories/member_attached_document_repository'

/**
 * Payload que viene desde el controller: 
 * cada elemento trae fileName (generado tras subir el archivo) 
 * e idDocumentFormat (de qué formato es).
 */
export interface AttachDocumentInput {
  fileName: string
  idDocumentFormat: number
}

/**
 * Este servicio se encarga de:
 * 1) Recibir idMemberRequest + arreglo de { fileName, idDocumentFormat }
 * 2) Construir el array de registros con fileName, fileUrl, memberRequestID, documentFormatId
 * 3) Llamar al repositorio para insertar todo de una vez
 */
export async function attachDocumentsToMemberRequest(
  idMemberRequest: number,
  docs: AttachDocumentInput[]
): Promise<MemberAttachedDocumentRecord[]> {
  if (!idMemberRequest || docs.length === 0) {
    throw new Error('Debe proveer idMemberRequest y al menos un documento')
  }

  // Base de la URL para que el frontend luego pueda descargar el doc
  const baseUrl = process.env.BACKEND_URL || ''

  // Construir los registros para insertar
  const itemsToInsert: CreateManyMemberAttachedDocumentInput[] = docs.map((d) => ({
    fileName: d.fileName,
    // Por ejemplo: https://mi-backend.com/files/download/{fileName}
    fileUrl: `${baseUrl}/files/download/${d.fileName}`,
    memberRequestID: idMemberRequest,
    documentFormatId: d.idDocumentFormat,
  }))

  // Inserto en bloque
  await insertMany(itemsToInsert)
  // Recupero todos los documentos asociados a esta solicitud (incluidos los recién insertados)
  const insertedDocs = await findByMemberRequestId(idMemberRequest)
  return insertedDocs
}

/**
 * Lista todos los documentos con su formato para una solicitud.
 */
export async function listDocumentsByMemberRequest(
  idMemberRequest: number
): Promise<MemberAttachedDocumentWithFormat[]> {
  if (isNaN(idMemberRequest) || idMemberRequest <= 0) {
    throw new Error('ID de memberRequest inválido')
  }
  return await findByMemberRequestIdWithFormat(idMemberRequest)
}

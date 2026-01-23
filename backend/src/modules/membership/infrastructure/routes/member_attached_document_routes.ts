import { Hono } from 'hono'

export const memberAttachedDocumentRouter = new Hono()

/**
 * POST /api/member-requests/:id/documents
 *   Crea varios registros de member_attached_document para la solicitud con ID = :id.
 */


export default memberAttachedDocumentRouter;


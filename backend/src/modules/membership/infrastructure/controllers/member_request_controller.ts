// controllers/member_request_controller.ts
import type { Context } from "hono";
import * as memberRequestService from "../../application/member_request_service";
import { memberRequest, memberRequestInsertSchema } from "../../../../db/schema/MemberRequest";
import { z } from "zod";
import { db } from "../../../../db";
import { newFamiliarInclusionRequestSchema } from "../../application/member_request_service";
import {ExclusionDto} from "../../application/member_request_service";
const createSchema = z.object({
  reason: z.string().min(1).max(50),
  submissionDate: z.coerce.date().optional(),
  requestState: z.string().optional(),
  newMemberDocumentType: z.string().min(1).max(50),
  newMemberDocumentId: z.string().min(1).max(50),
  newMemberName: z.string().min(1).max(50),
  newMemberLastName: z.string().min(1).max(50),
  memberTypeName: z.string().min(1).max(50),
});

export const createNew = async (c: Context) => {
  const body = await c.req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  try {
    const result = await memberRequestService.createNewMemberRequest(
      parsed.data
    );
    return c.json(result, 201);
  } catch (err: any) {
    return c.json({ error: err.message }, 400);
  }
};

// (Opcionales: podrías exponer getAll, getOne, etc.)
export const getAll = async (c: Context) => {
  const all = await db.select().from(memberRequest); // si agregas este método en el service
  return c.json(all);
};
/**
 * POST /member-requests/new-familiar
 * Crea una solicitud de inclusión familiar nueva.
 */
export const newFamiliar = async (c: Context) => {
  const body = await c.req.json();
  const parsed = newFamiliarInclusionRequestSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }
  const jwtPayload = c.get("account") as { sub: number; email: string; role: string };
  if (!jwtPayload?.sub) {
    return c.json({ error: "No autenticado correctamente" }, 401);
  }
  try {
    const result = await memberRequestService.newFamiliarInclusionRequest(
      parsed.data,
      jwtPayload.sub!,
    );
    return c.json(result, 201);
  } catch (err: any) {
    return c.json({ error: err.message }, 400);
  }
};
export const createExclusion = async (c: Context) => {
  const body = await c.req.json();
  const jwtPayload = c.get("account") as { sub: number; email: string; role: string };
   if (!jwtPayload?.sub) {
    return c.json({ error: "No autenticado correctamente" }, 401);
  }
  const authId = jwtPayload.sub;
  const parsed = ExclusionDto.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  try {
    const result = await memberRequestService.excludeFamiliarRequest(parsed.data,authId );
    return c.json(result, 201);
  } catch (err: any) {
    return c.json({ error: err.message }, 400);
  }
};
/**
 * GET /member-requests/family
 * Retorna la lista de solicitudes de inclusión familiar generadas por el miembro actual.
 * Extrae `authId` del JWT (almacenado en la variable de contexto "account").
 */
export const listFamilyRequests = async (c: Context) => {
  // 1) Extraemos el payload JWT guardado en `c.var` en el middleware
  const jwtPayload = c.get("account") as { sub: number; email: string; role: string };
  if (!jwtPayload?.sub) {
    return c.json({ error: "No autenticado correctamente" }, 401);
  }
  const authId = jwtPayload.sub;

  try {
    // 2) Llamamos al servicio
    const list = await memberRequestService.listFamilyRequestsByMember(authId);
    return c.json(list, 200);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
};


/**
 * GET /member-requests/family-all-manager
 *
 * Retorna TODAS las solicitudes de inclusión/exclusión familiar para revisión de un manager.
 */
export const listFamiliarsForManager = async (c: Context) => {
  try {
    const list = await memberRequestService.findFamiliarsRequestsForManager();
    return c.json(list, 200);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
};

export const getDetail = async (c: Context) => {
  const rawId = c.req.param("id");
  const requestId = Number(rawId);
  if (isNaN(requestId)) {
    return c.json({ error: "ID inválido" }, 400);
  }

  try {
    const detail = await memberRequestService.getMemberRequestDetail(requestId);
    return c.json(detail, 200);
  } catch (err: any) {
    const msg = err.message;
    if (msg.includes("no encontrada") || msg.includes("no encontrado")) {
      return c.json({ error: msg }, 404);
    }
    return c.json({ error: msg }, 500);
  }
};

export const approve = async (c: Context) => {
  const id = Number(c.req.param("id"));
  if (isNaN(id)) {
    return c.json({ error: "ID inválido" }, 400);
  }
  try {
    const result = await memberRequestService.approveMemberRequest(id);
    return c.json(result);
  } catch (err: any) {
    return c.json({ error: err.message }, 400);
  }
};


export const reject = async (c: Context) => {
  const idParam = c.req.param("id");
  const requestId = Number(idParam);
  if (isNaN(requestId)) {
    return c.json({ error: "ID inválido" }, 400);
  }

  try {
    const result = await memberRequestService.rejectMemberRequest(requestId);
    return c.json(result);
  } catch (err: any) {
    return c.json({ error: err.message }, 400);
  }
};



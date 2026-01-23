// controllers/member_application_controller.ts
import type { Context } from 'hono';
import * as membership_application_service from '../../application/membership_application_service';
import { membershipApplication, membershipApplicationInsertSchema } from '../../../../db/schema/MembershipApplication';
import { createMembershipApplicationSchema } from '../../dto/CreateMembershipApplicationDto';

import { z } from "zod";
import { db } from "../../../../db";


export const createNew = async (c: Context) => {
  const jwtPayload = c.get("account");
  //console.log("tokencito payload: ",jwtPayload);
  const body = await c.req.json();
  //console.log("cuerpito: ", body)
  const parsed = createMembershipApplicationSchema.safeParse(body);
  if (!parsed.success) {
    //console.log( parsed.error.flatten());
    return c.json({ error: parsed.error.flatten() }, 400);
  }

   // 2) Extraemos el payload JWT guardado en c.var 'user'
  //    En AuthService al hacer login pusiste: payload = { sub: account.id, ... }
  // const jwtPayload = c.get('user') as { sub: number; email: string; role: string };
  if (!jwtPayload?.sub) {
     return c.json({ error: 'No autenticado correctamente' }, 401);
  }
  const accountID = jwtPayload.sub;

  // 3) Construimos el DTO definitivo inyectando accountID desde el JWT
  const dto = {
    ...parsed.data,
    accountID,
  };


  try {
    const result = await membership_application_service.createMembershipApplication(
      dto
    );
    return c.json(result, 201);
  } catch (err: any) {
        //console.log( "error en service", err.message);

    return c.json({ error: err.message }, 400);
  }
};

// (Opcionales: podrías exponer getAll, getOne, etc.)
export const getAll = async (c: Context) => {
  const all = await db.select().from(membershipApplication); // si agregas este método en el service
  return c.json(all);
};

export const getMembershipApplications = async (c: Context) => {
  try {
    const list: membership_application_service.MembershipRequestSummary[] = await membership_application_service.getMembershipApplications();
    return c.json(list);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
};

/**
 * GET /membership-applications/:id/detail
 * Devuelve todos los datos relevantes de una solicitud de membresía.
 */
export const getDetail = async (c: Context) => {
  const id = Number(c.req.param("id"));
  if (isNaN(id)) {
    return c.json({ error: "ID inválido" }, 400);
  }
  try {
    const detail = await membership_application_service.getDetailedMembershipApplicationById(id);
    return c.json(detail);
  } catch (err: any) {
    return c.json({ error: err.message }, err.message === "Solicitud no encontrada" ? 404 : 500);
  }
};


export const approve = async (c: Context) => {
  const id = Number(c.req.param("id"));
  try {
    const app = await membership_application_service.approveMembershipApplication(id);
    return c.json(app);
  } catch (err: any) {
    return c.json({ error: err.message }, 400);
  }
};
export const reject = async (c: Context) => {
  const id = Number(c.req.param("id"));
  try {
    const app = await membership_application_service.rejectMembershipApplication(id);
    return c.json(app);
  } catch (err: any) {
    return c.json({ error: err.message }, 400);
  }
};

/**
 * GET /membership-applications/exists
 * Indica si el usuario autenticado ya envió una solicitud de membresía.
 */
export const checkExisting = async (c: Context) => {
  // JWT middleware guardó payload en c.var 'user'
  const jwt = c.get("account") as { sub: number };
  if (!jwt?.sub) {
    return c.json({ error: "No autenticado" }, 401);
  }
  const exists = await membership_application_service.hasExistingMembershipApplication(jwt.sub);
  return c.json({ exists });
};

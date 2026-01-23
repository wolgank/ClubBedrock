// controllers/member_controller.ts
import type { Context } from "hono";
import * as memberService from "../../application/member_service";
import { memberInsertSchema, memberUpdateSchema } from "../../../../db/schema/Member";
import type { SearchMembersDto } from "../../dto/SearchMembersDto";
import type { OtherMemberInfo } from "../../dto/OtherMemberInfo";
import { newFamiliarInclusionRequestSchema } from "../../application/member_request_service";
import type { OtherMemberSummary } from "../../dto/MemberSumaryForOp";

export const getAll = async (c: Context) => {
  const list = await memberService.getAllMembers();
  return c.json(list);
};

export const getOne = async (c: Context) => {
  const id = Number(c.req.param("id"));
  const item = await memberService.getMemberById(id);
  if (!item) return c.notFound();
  return c.json(item);
};

export const create = async (c: Context) => {
  const body = await c.req.json();
  const parsed = memberInsertSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }
  const created = await memberService.createMember(parsed.data);
  return c.json(created, 201);
};

export const update = async (c: Context) => {
  const id = Number(c.req.param("id"));
  const body = await c.req.json();
  const parsed = memberUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }
  await memberService.updateMember(id, parsed.data);
  return c.body(null, 204);
};

export const remove = async (c: Context) => {
  const id = Number(c.req.param("id"));
  await memberService.deleteMember(id);
  return c.body(null, 204);
};

export const searchTitular = async (c: Context) => {
  const q = c.req.query();
  const criteria: SearchMembersDto = {
    lastName:       q.lastname,
    name:           q.name,
    subCode:        q.subCode,
    email:          q.email,
    documentType:   q.documentType,
    documentId:     q.documentId,
  };
  try {
    const results = await memberService.searchTitularMembers(criteria);
    return c.json(results);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
};
/**
 * GET /members/first-payment
 * Retorna JSON { paid: boolean }
 */
export const checkFirstPayment = async (c: Context) => {
  // Obtenemos el payload del JWT que puso el middleware
  const jwt = c.get("account") as { sub?: number };
  //console.log("tokencito payload: ",jwt);
  //console.log("tokencito payload sub : ",jwt.sub);
  if (!jwt?.sub) {
    return c.json({ error: "No autenticado" }, 401);
  }
  try {
    const paid = await memberService.checkFirstPaymentPending(jwt.sub);
    return c.json({ paid });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
};
export const getOverview = async (c: Context) => {
  const jwt = c.get("account") as { sub?: number };
  if (!jwt?.sub) {
    return c.json({ error: "No autenticado" }, 401);
  }
  try {
    const overview = await memberService.getMembershipOverview(jwt.sub);
    return c.json(overview);
  } catch (err: any) {
    return c.json({ error: err.message }, 400);
  }
};

export const listOtherFamilyMembers = async (c: Context) => {
  // Extraer accountID del payload JWT (seteado en authMiddleware)
  const jwtPayload = c.get("account") as { sub: number; email: string; role: string };
  if (!jwtPayload?.sub) {
    return c.json({ error: "No autenticado correctamente" }, 401);
  }
  const accountID = jwtPayload.sub;

  try {
    const others: OtherMemberInfo[] = await memberService.getOtherMembersInMembership(accountID);
    return c.json(others);
  } catch (err: any) {
    return c.json({ error: err.message }, 400);
  }
};

export const getType = async (c: Context) => {
  const id = Number(c.req.param("id")); // or use c.req.query("id") depending on your routing
  //console.log("getType id: ", id);
  const academies = await memberService.getType(id);
  return c.json(academies);
};

export const findByTypeController = async (c: Context) => {
  const typeId = Number(c.req.query("typeId"));
  if (isNaN(typeId)) {
    return c.json({ error: "typeId inválido" }, 400);
  }
  try {
    const members: OtherMemberSummary[] = await memberService.findByType(typeId);
    return c.json(members);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
};

export const listMembersWithMoras = async (c: Context) => {
  try {
    const data = await memberService.getMembersWithMoras();
    return c.json(data);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
};


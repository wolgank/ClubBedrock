import type { Context } from "hono";
import * as service from "../../application/member_type_service";
import {
  memberTypeInsertSchema,
  memberTypeUpdateSchema,
} from "../../../../db/schema/MemberType";

export const getFamilyConfig = async (c: Context) => {
  const config = await service.getFamilyConfig();
  return c.json(config);
};

export const getAll = async (c: Context) => {
  const list = await service.getAllMemberTypes();
  return c.json(list);
};

export const getOne = async (c: Context) => {
  const id = Number(c.req.param("id"));
  const item = await service.getMemberTypeById(id);
  if (!item) return c.notFound();
  return c.json(item);
};

export const getOneByNameContaining = async (c: Context) => {
  const nameLike = String(c.req.query("nameLike"));
  const item = await service.getMemberTypeByNameContaining(nameLike);
  if (!item) return c.notFound();
  return c.json(item);
};

export const create = async (c: Context) => {
  const body = await c.req.json();
  const parsed = memberTypeInsertSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }
  const created = await service.createMemberType(parsed.data);
  return c.json(created, 201);
};

export const update = async (c: Context) => {
  const id = Number(c.req.param("id"));
  const body = await c.req.json();
  const parsed = memberTypeUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }
  await service.updateMemberType(id, parsed.data);
  return c.body(null, 204);
};

export const remove = async (c: Context) => {
  const id = Number(c.req.param("id"));
  await service.deleteMemberType(id);
  return c.body(null, 204);
};

/**
 * GET /member-types/:id/document-formats
 * Devuelve todos los formatos de documentos asociados a un MemberType.
 */
export const getDocumentFormatsByMemberType = async (c: Context) => {
  const idParam = c.req.param("id");
  const memberTypeId = Number(idParam);
  if (isNaN(memberTypeId)) {
    return c.json({ error: "ID inválido" }, 400);
  }

  try {
    const formats = await service.getDocumentFormatsByMemberType(
      memberTypeId
    );
    return c.json(formats);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
};


export const createWithDocumentFormats = async (c: Context) => {
  const body = await c.req.json();
  try {
    const result = await service.createMemberTypeWithDocumentFormats(body);
    return c.json(result, 201);
  } catch (err: any) {
    return c.json({ error: err.message }, 400);
  }
};

export const updateWithDocumentFormats = async (c: Context) => {
  const id = Number(c.req.param("id"));
  if (isNaN(id)) {
    return c.json({ error: "ID inválido" }, 400);
  }
  const body = await c.req.json();
  try {
    const result = await service.updateMemberTypeWithDocumentFormats(id, body);
    return c.json(result);
  } catch (err: any) {
    return c.json({ error: err.message }, 400);
  }
};



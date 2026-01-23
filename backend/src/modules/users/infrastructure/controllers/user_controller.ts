// controllers/user_controller.ts
import type { Context } from "hono";
import * as userService from "../../application/user_service";
import { userInsertSchema, userUpdateSchema } from "../../../../db/schema/User";

export const getAll = async (c: Context) => {
  const list = await userService.getAllUsers();
  return c.json(list);
};

export const getOne = async (c: Context) => {
  const id = Number(c.req.param("id"));
  const item = await userService.getUserById(id);
  if (!item) return c.notFound();
  return c.json(item);
};

export const create = async (c: Context) => {
  const body = await c.req.json();
  const parsed = userInsertSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }
  const created = await userService.createUser(parsed.data);
  return c.json(created, 201);
};

export const update = async (c: Context) => {
  const id = Number(c.req.param("id"));
  const body = await c.req.json();
  const parsed = userUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }
  await userService.updateUser(id, parsed.data);
  return c.body(null, 204);
};

export const remove = async (c: Context) => {
  const id = Number(c.req.param("id"));
  await userService.deleteUser(id);
  return c.body(null, 204);
};


export const getAccountByMembershipApplication = async (c: Context) => {
  // leemos el ID de la ruta: /membership-applications/:id/account
  const idParam = c.req.param('id');
  const applicationId = Number(idParam);
  if (isNaN(applicationId)) {
    return c.json({ error: 'ID inválido' }, 400);
  }

  const result: userService.AuthPlusUser | null =
    await userService.getAuthAndUserByMembershipApplication(applicationId);

  if (!result) {
    return c.notFound();
  }

  return c.json(result);
};

// controllers/userController.ts
export async function bulkUploadHandler(c: Context) {
  try {
    const form = await c.req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return c.json({ error: 'Falta archivo' }, 400);
    }
    const arrayBuffer = await file.arrayBuffer();
    const warnings = await userService.bulkUploadUsers(arrayBuffer);
    return c.json({ message: 'Carga completada', warnings }, 200);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
}
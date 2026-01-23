import { AppError } from "../../../../shared/utils/AppError";
import type { Context } from 'hono';
import * as spaceService from '../../application/space_service';
import { spaceInsertSchema } from '../../../../db/schema/Space';
export const getAll = async (c: Context) => {
  const spaces = await spaceService.getAllSpaces();
  return c.json(spaces);
};
export const getAllLeisure = async (c: Context) => {
  const spaces = await spaceService.getAllSpacesLeisure();
  return c.json(spaces);
};

export const getAllSports = async (c: Context) => {
  const spaces = await spaceService.getAllSpacesSports();
  return c.json(spaces);
};

export const getOne = async (c: Context) => {
  const id = Number(c.req.param('id'));
  const space = await spaceService.getSpaceById(id);
  if (!space) return c.notFound();
  return c.json(space);
};
export const getByType = async (c: Context) => {
  const type = c.req.param('type') as 'LEISURE' | 'SPORTS';
  const spaces = await spaceService.getSpacesByType(type);
  if (!spaces) {
    return c.notFound();
  }
  return c.json(spaces);
};





export const createNewSpace = async (c: Context) => {
  try {
    const body = await c.req.json();
    const parsed = spaceInsertSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.flatten() }, 400);
    }
    const result = await spaceService.createNewSpace(parsed.data);
    c.set("newRowId", result?.id);
    return c.json(result, 201);
  }
  catch (error) {
    console.error("Error al eliminar el espacio:", error);
    if (error instanceof AppError) {
      console.error("AppError details:", error.message, "Status:", error.status);
      return c.json({ message: error.message }, { status: error.status as any });
    }
    return c.json(
      { message: "Error al eliminar espacio", details: error instanceof Error ? error.message : error },
      501
    );
  }
}

export const create = async (c: Context) => {
  const body = await c.req.json();
  const { weeklySchedules, ...spaceData } = body;
  const parsed = spaceInsertSchema.safeParse(spaceData);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const result = await spaceService.createSpace(parsed.data, weeklySchedules);
  c.set("newRowId", result?.id);
  return c.json(result, 201);
};
export const update = async (c: Context) => {
  const id = Number(c.req.param('id'));
  const body = await c.req.json();
  const parsed = spaceInsertSchema.partial().safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  await spaceService.updateSpace(id, parsed.data);
  return c.body(null, 204);
};


export const remove = async (c: Context) => {
  try {
    const id = Number(c.req.param('id'));
    await spaceService.deleteSpace(id);
    return c.json({ message: "Eliminacion exitosa" }, 200);
  }
  catch (error) {
    console.error("Error al eliminar el espacio:", error);
    if (error instanceof AppError) {
      console.error("AppError details:", error.message, "Status:", error.status);
      return c.json({ message: error.message }, { status: error.status as any });
    }
    return c.json(
      { message: "Error al eliminar espacio", details: error instanceof Error ? error.message : error },
      501
    );

  }
};



export const getReservationsBySpaceId = async (c: Context) => {
  const id = Number(c.req.param('id'));
  const space = await spaceService.getReservationsBySpaceId(id);
  if (!space) return c.notFound();
  return c.json(space);
};


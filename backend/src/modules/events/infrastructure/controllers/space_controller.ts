import type { Context } from 'hono';
import * as spaceService from '../../application/space_service';
import { createSpaceSchema} from "../../domain/space"



export const getAll = async (c: Context) => {
  const spaces = await spaceService.getAllSpaces();
  return c.json(spaces);
};

export const getOne = async (c: Context) => {
  const id = Number(c.req.param('id'));
  const space = await spaceService.getSpaceById(id);
  if (!space) return c.notFound();
  return c.json(space);
};

export const create = async (c: Context) => {
  const body = await c.req.json();
  const parsed = createSpaceSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const result = await spaceService.createSpace(parsed.data);
  return c.json(result, 201);
};

export const update = async (c: Context) => {
  const id = Number(c.req.param('id'));
  const body = await c.req.json();
  const parsed = createSpaceSchema.partial().safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  await spaceService.updateSpace(id, parsed.data);
  return c.body(null, 204);
};

export const updateSpaceAvailabilityStatus = async (c: Context) => {
    // Obtener el cuerpo de la solicitud
    const body = await c.req.json();
  
    // Obtener el id y el nuevo estado de disponibilidad desde el cuerpo de la solicitud
    const { id, isAvailable } = body;
  
    // Asegurarse de que el id y isAvailable están presentes en el cuerpo
    if (typeof id !== 'number' || typeof isAvailable !== 'boolean') {
      return c.json({ error: 'Invalid data' }, 400);
    }
  
    // Llamar al servicio para actualizar la disponibilidad del espacio
    await spaceService.updateSpaceAvailability(id, isAvailable);
  
    // Responder con código 204 (sin contenido) para indicar que la operación fue exitosa
    return c.body(null, 204);
  };
  
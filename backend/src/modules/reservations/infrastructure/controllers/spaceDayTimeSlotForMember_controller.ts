import type { Context } from 'hono';
import * as spaceDayTimeSlotForMemberService from '../../application/spaceDayTimeSlotForMember_service';
import { spaceDayTimeSlotForMemberInsertSchema } from '../../../../db/schema/SpaceDayTimeSlotForMember';
import { format } from "date-fns";

export const getAll = async (c: Context) => {
  const spaces = await spaceDayTimeSlotForMemberService.getAllSpaceDayTimeSlotForMember();
  return c.json(spaces);
};
export const getOne = async (c: Context) => {
  const id = Number(c.req.param('id'));
  const space = await spaceDayTimeSlotForMemberService.getAllSpaceDayTimeSlotForMemberById(id);
  if (!space) return c.notFound();
  return c.json(space);
};
export const create = async (c: Context) => {
  const body = await c.req.json();
  const parsed = spaceDayTimeSlotForMemberInsertSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const result = await spaceDayTimeSlotForMemberService.createAllSpaceDayTimeSlotForMember(parsed.data);
  return c.json(result, 201);
};
export const createTwo = async (c: Context) => {
  const body = await c.req.json();
  const parsed = spaceDayTimeSlotForMemberInsertSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const result = await spaceDayTimeSlotForMemberService.createAllSpaceDayTimeSlotForMemberTwo(parsed.data);
  c.set("newRowId", result?.id);
  return c.json(result, 201);
};
export const update = async (c: Context) => {
  const id = Number(c.req.param('id'));
  const body = await c.req.json();
  const parsed = spaceDayTimeSlotForMemberInsertSchema.partial().safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  await spaceDayTimeSlotForMemberService.updateSpaceDayTimeSlotForMember(id, parsed.data);
  return c.body(null, 204);
};
export const remove = async (c: Context) => {
  const id = Number(c.req.param('id'));
  await spaceDayTimeSlotForMemberService.deleteSpaceDayTimeSlotForMember(id);
  return c.body(null, 204);
};



export const getTimeSlotDaySpaceId = async (c: Context) => {
  const id = Number(c.req.query('id'));
  const date = c.req.query('date');

  if (!id || !date) {
    return c.json({ error: "Se requiere 'id' y 'date' en query params." }, 400);
  }

  const result = await spaceDayTimeSlotForMemberService.getAvailableTimeSlotsByDay(id, date);
  return c.json(result, 200);
};


export const getNoTimeSlotDaySpaceId = async (c: Context) => {
  const id = Number(c.req.query('id'));
  const date = c.req.query('date');

  if (!id || !date) {
    return c.json({ error: "Se requiere 'id' y 'date' en query params." }, 400);
  }

  const result = await spaceDayTimeSlotForMemberService.getNoAvailableTimeSlotsByDay(id, date);
  return c.json(result, 200);
};

export const getTimeSlotDaySpaceIdDouble = async (c: Context) => {
  const id = Number(c.req.query('id'));

  if (!id) {
    return c.json({ error: "Se requiere 'id' y 'date' en query params." }, 400);
  }

  const result = await spaceDayTimeSlotForMemberService.getAvailableTimeSlotsByDayDouble(id);
  return c.json(result, 200);
};


export const getTimeSlotDaySpaceIdALL = async (c: Context) => {
  const id = Number(c.req.query('id'));

  if (!id ) {
    return c.json({ error: "Se requiere 'id'." }, 400);
  }

  const result = await spaceDayTimeSlotForMemberService.getAvailableTimeSlotsALL(id);
  return c.json(result, 200);
};






import { z } from "zod";

// Creamos un esquema que valida un arreglo del esquema original
const arraySchema = z.array(spaceDayTimeSlotForMemberInsertSchema);

export const createArray = async (c: Context) => {
  const body = await c.req.json();

  // Validamos que sea un arreglo válido de objetos
  const parsed = arraySchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  // Llamamos al servicio con el arreglo validado
  const result = await spaceDayTimeSlotForMemberService.createAllSpaceDayTimeSlotForMemberArray(parsed.data);
  return c.json(result, 201);
};




export const crearHorariosController = async (c: Context) => {
  const body = await c.req.json();

  const parsed = spaceDayTimeSlotForMemberInsertSchema
    .extend({
      duracion_bloque: z.number().int().positive("La duración del bloque debe ser un entero positivo"),
    })
    .safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  try {
    const bloques = await spaceDayTimeSlotForMemberService.crearHorariosDisnponibles(parsed.data);
    return c.json(bloques, 201);
  } catch (error) {
    console.error("Error al crear bloques disponibles:", error);
    return c.json({ error: "Error interno del servidor" }, 500);
  }
};

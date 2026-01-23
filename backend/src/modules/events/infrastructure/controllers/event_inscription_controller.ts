import type { Context } from 'hono';
import * as eventInscriptionService from '../../application/event_inscription_service';
import { eventInscriptionInsertSchema } from '../../../../db/schema/EventInscription';
import { billInsertSchema } from '../../../../db/schema/Bill';
import { billDetailInsertSchema } from '../../../../db/schema/BillDetail';
import { inscriptionXUserInsertSchema } from '../../../../db/schema/InscriptionXUser';
import { z } from 'zod';
import { eventInscription } from '../../../../db/schema/EventInscription';
import { formatHourFromISO, formatDateToYMD } from '../../../../shared/utils/formatsTime';
import { AppError } from '../../../../shared/utils/AppError';
export const getAll = async (c: Context) => {
  const events = await eventInscriptionService.getAllEventInscription();
  return c.json(events);
};
export const getOne = async (c: Context) => {
  const id = Number(c.req.param('id'));
  const event = await eventInscriptionService.getEventInscriptionById(id);
  if (!event) return c.notFound();
  return c.json(event);
};
export const create = async (c: Context) => {
  const body = await c.req.json();
  const parsed = eventInscriptionInsertSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const result = await eventInscriptionService.createEventInscription(parsed.data);
  return c.json(result, 201);
};
export const update = async (c: Context) => {
  const id = Number(c.req.param('id'));
  const body = await c.req.json();
  const parsed = eventInscriptionInsertSchema.partial().safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  await eventInscriptionService.updateEventInscription(id, parsed.data);
  return c.body(null, 204);
};


export const cancelEventInscriptionById = async (c: Context) => {
  try {
    const id = Number(c.req.param('id'));
    await eventInscriptionService.cancelEventInscriptionById(id);
    return c.body(null, 204);
  }
  catch (error) {
    console.error("Error al eliminar inscripcion:", error);
    if (error instanceof AppError) {
      console.error("AppError details:", error.message, "Status:", error.status);
      return c.json({ message: error.message }, { status: error.status as any });
    }
    return c.json(
      { message: "Error al eliminar inscripcion", details: error instanceof Error ? error.message : error },
      501
    );

  }
}


export const remove = async (c: Context) => {
  const id = Number(c.req.param('id'));
  await eventInscriptionService.deleteEvent(id);
  return c.body(null, 204);
};

//===============================================================================

export const createInscription = async (c: Context) => {
  const body = await c.req.json();
  //console.log("Body", body);
  //console.log("Body Bill", body.bill);
  const billParse = billInsertSchema.safeParse(body.bill);
  //console.log("Bill", billParse.error);
  //console.log("Bill Detail", body.billDetails);
  const detailParse = z.array(billDetailInsertSchema.omit({ billId: true })).safeParse(body.billDetails);
  //console.log("Bill Detail", detailParse);
  //mostrar errores de validación en consola
  //console.log("Bill Detail Error", detailParse.error);
  const inscriptionParse = z.array(inscriptionXUserInsertSchema).safeParse(body.inscriptions); // Array de inscripciones
  //console.log("Inscription", inscriptionParse);
  const eventInscriptionParse = z.array(eventInscriptionInsertSchema.omit({ inscriptionXUser: true, id: true })).safeParse(body.eventInscriptions); // Array de event inscriptions
  //console.log("Event Inscription", eventInscriptionParse);
  if (!billParse.success || !detailParse.success || !inscriptionParse.success || !eventInscriptionParse.success) {
    return c.json({
      error: {
        bill: billParse.success ? null : billParse.error.flatten(),
        billDetail: detailParse.success ? null : detailParse.error.flatten(),
        inscription: inscriptionParse.success ? null : inscriptionParse.error.flatten(),
        eventInscription: eventInscriptionParse.success ? null : eventInscriptionParse.error.flatten(),
      }
    }, 400);
  }
  //console.log("Antes de crear la inscripción");
  try {
    const result = await eventInscriptionService.createInscription(
      billParse.data,
      detailParse.data,
      inscriptionParse.data,
      eventInscriptionParse.data,
    );
    return c.json(result, 201);
  } catch (error) {
    console.error("Error al crear la inscripción:", error);

    if (error instanceof AppError) {
      console.error("AppError details:", error.message, "Status:", error.status);
      return c.json({ error: error.message }, { status: error.status as any }); // <- hack para status numérico
    }
    return c.json(
      { error: "Error al crear la inscripción", details: error instanceof Error ? error.message : error },
      500
    );
  }
};

export const check = async (c: Context) => {
  //console.log("Checking if users are inscribed in event", c.req.json());

  try {
    const body = await c.req.json();
    const parsed = z.object({
      userId: z.number(),
      eventId: z.number(),
    }).safeParse(body);

    if (!parsed.success) {
      return c.json({ error: parsed.error.flatten() }, 400);
    }

    const result = await eventInscriptionService.areUsersInscribedInEvent(parsed.data.userId, parsed.data.eventId);


    return c.json({ result }, 200);
  } catch {
    return c.json({ error: 'Invalid JSON body or failed to check inscriptions' }, 400);
  }
};

export const removeInscription = async (c: Context) => {
  try {
    const body = await c.req.json();
    const parsed = z.object({
      userIds: z.array(z.number()),
      eventId: z.number(),
    }).safeParse(body);

    if (!parsed.success) {
      return c.json({ error: parsed.error.flatten() }, 400);
    }

    await eventInscriptionService.removeInscription(parsed.data.userIds, parsed.data.eventId);
    // Si la eliminación es exitosa, retorna un 200 con un mensaje de se eliminó correctamente la inscripción de usuario al evento 
    return c.json({
      message: `La inscripción del usuario con ID ${parsed.data.userIds} al evento con ID ${parsed.data.eventId} se eliminó correctamente.`,
    }, 200);
  } catch (error) {
    if (error instanceof AppError) {
      return c.json({ error: error.message }, { status: error.status as any }); // <- hack para status numérico
    }
    return c.json({ error: 'Failed to remove inscription' }, 500);
  }
};

export const getHistoricUserId = async (c: Context) => {
  const id = Number(c.req.param('id'));
  try {
    const historic = await eventInscriptionService.getHistoricUserId(id);
    const parse = historic.map((slot: any) => ({
      ...slot,
      date: typeof slot.date === "string" ? slot.date : slot.date.toISOString(),
      startHour: typeof slot.startHour === "string" ? slot.startHour : slot.startHour.toISOString(),
      endHour: typeof slot.endHour === "string" ? slot.endHour : slot.endHour.toISOString(),
    }));
    return c.json(parse);
  } catch (error) {
    if (error instanceof AppError) {
      return c.json({ error: error.message }, { status: error.status as any });
    }
    return c.json(
      { error: "Error al crear la inscripción", details: error instanceof Error ? error.message : error },
      500
    );
  }
}
import type { Context } from 'hono';
import * as reservationService from '../../application/reservation_service';
import { reservationInsertSchema } from '../../../../db/schema/Reservation';
export const getAll = async (c: Context) => {
  const reservations = await reservationService.getAllReservations();
  return c.json(reservations);
};
export const getOne = async (c: Context) => {
  const id = Number(c.req.param('id'));
  const reservation = await reservationService.getReservationById(id);
  if (!reservation) return c.notFound();
  return c.json(reservation);
};
export const create = async (c: Context) => {
  const body = await c.req.json();
  const parsed = reservationInsertSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const result = await reservationService.createReservation(parsed.data);
   c.set("newRowId", result?.id);
  return c.json(result, 201);
};

export const createNew = async (c: Context) => {
  const body = await c.req.json();
  const parsed = reservationInsertSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const result = await reservationService.createReservation(parsed.data);
   c.set("newRowId", result?.id);
  return c.json(result, 201);
};


export const update = async (c: Context) => {
  const id = Number(c.req.param('id'));
  const body = await c.req.json();
  const parsed = reservationInsertSchema.partial().safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  await reservationService.updateReservation(id, parsed.data);
  return c.body(null, 204);
};
export const remove = async (c: Context) => {
  const id = Number(c.req.param('id'));
  await reservationService.deleteReservation(id);
  return c.body(null, 204);
};

import { AppError } from "../../../../shared/utils/AppError";

export const createNewReservationWithValidation = async (c: Context) => {
  // const body = await c.req.json();

  try {
    const result = await reservationService.createNewReservationWithValidation();
    return c.json({}, 201);
  } catch (error) {
    console.error("Error al crear la reserva, pipipipppi:", error);

    if (error instanceof AppError) {
      console.error("AppError details:", error.message, "Status:", error.status);
      return c.json({ message: error.message }, { status: error.status as any });
    }
    return c.json(
      { message: "Error al crear la inscripción", details: error instanceof Error ? error.message : error },
      501
    );
  }
}


export const createNewSports = async (c: Context) => {
  try {
    const body = await c.req.json();
    const parsed = reservationInsertSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.flatten() }, 400);
    }
    const result = await reservationService.createNewReservationSports(parsed.data);
    //console.log("result createNewReservationSports", result)
    c.set("newRowId",result.id);
    return c.json({ message: "Insercion exitosa" }, 201);
  } catch (error) {
    console.error("Error al crear la reserva:", error);
    if (error instanceof AppError) {
      console.error("AppError details:", error.message, "Status:", error.status);
      return c.json({ message: error.message }, { status: error.status as any });
    }
    return c.json(
      { message: "Error al crear la reserva", details: error instanceof Error ? error.message : error },
      501
    );
  }
}


export const getSpecialReservationsBySpaceId = async (c: Context) => {
  const spaceId = Number(c.req.param('id'));
  if (isNaN(spaceId)) {
    return c.json({ error: "Invalid space ID" }, 400);
  }
  
  const reservations = await reservationService.getSpecialReservationsBySpaceId(spaceId);
  return c.json(reservations);
}


export const getCorreoByUserId = async (c: Context) => {
  const userId = Number(c.req.param('id'));
  const res = await reservationService.getCorreoByUserId(userId);
  return c.json(res);
}
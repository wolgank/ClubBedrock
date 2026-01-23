import type { Context } from 'hono';
import * as reservationService from '../../application/reservation_service';
import { createReservationSchema} from "../../../reservations/domain/reservation"

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
  const parsed = createReservationSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const result = await reservationService.createReservation(parsed.data);
  return c.json(result, 201);
};

export const update = async (c: Context) => {
  const id = Number(c.req.param('id'));
  const body = await c.req.json();
  const parsed = createReservationSchema.partial().safeParse(body);
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

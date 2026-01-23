import type { Context } from 'hono';
import * as reservationInscriptionService from '../../application/reservation_inscription_service';
import { reservationInscriptionInsertSchema } from '../../../../db/schema/ReservationInscription';
export const getAll = async (c: Context) => {
  const reservations = await reservationInscriptionService.getAllReservationInscription();
  return c.json(reservations);
};
export const getOne = async (c: Context) => {
  const id = Number(c.req.param('id'));
  const reservation = await reservationInscriptionService.getReservationInscriptionByUserId(id);
  if (!reservation) return c.notFound();
  return c.json(reservation);
};

export const update = async (c: Context) => {
  const id = Number(c.req.param('id'));
  const body = await c.req.json();
  const parsed = reservationInscriptionInsertSchema.partial().safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  await reservationInscriptionService.updateReservationInscription(id, parsed.data);
  return c.body(null, 204);
};
export const remove = async (c: Context) => {
  const id = Number(c.req.param('id'));
  await reservationInscriptionService.deleteReservationInscription(id);
  return c.body(null, 204);
};

export const getInfoReservationInscriptionById = async (c: Context) => {
  const id = Number(c.req.param('id'));
  const reservation = await reservationInscriptionService.getInfoReservationInscriptionById(id);
  if (!reservation) return c.notFound();
  return c.json(reservation);
}

export const reporteEspacioDeportivo = async (c: Context) => {
  const data = await reservationInscriptionService.reporteEspacioDeportivo();
  return c.json(data)
}


export const reporteEspacioLeisure = async (c: Context) => {
  const data = await reservationInscriptionService.reporteEspacioLeisure();
  return c.json(data)
}

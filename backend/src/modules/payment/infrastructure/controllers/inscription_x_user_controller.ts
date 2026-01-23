import type { Context } from 'hono';
import * as inscriptionXUserService from '../../application/inscription_x_user_service';
import { inscriptionXUserInsertSchema } from '../../../../db/schema/InscriptionXUser';

export const getAll = async (c: Context) => {
    const reservations = await inscriptionXUserService.getAllInscriptionUser();
    return c.json(reservations);
  };
  export const getOne= async (c: Context) => {
    const id = Number(c.req.param('id'));
    const reservation = await inscriptionXUserService.getInscriptionUserById(id);
    if (!reservation) return c.notFound();
    return c.json(reservation);
  };
  export const create = async (c: Context) => {
    const body = await c.req.json();
    const parsed = inscriptionXUserInsertSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.flatten() }, 400);
    }
  
    const result = await inscriptionXUserService.createInscriptionXUser(parsed.data);
    return c.json(201);
  };
  export const update = async (c: Context) => {
    const id = Number(c.req.param('id'));
    const body = await c.req.json();
    const parsed = inscriptionXUserInsertSchema.partial().safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.flatten() }, 400);
    }
  
    await inscriptionXUserService.updateInscriptionXUser(id, parsed.data);
    return c.body(null, 204);
  };
  export const remove = async (c: Context) => {
    const id = Number(c.req.param('id'));
    await inscriptionXUserService.deleteInscriptionXUser(id);
    return c.body(null, 204);
  };
          
// controllers/membership_controller.ts
import type { Context } from 'hono';
import * as membershipService from '../../application/membership_service';
import { membershipInsertSchema } from '../../../../db/schema/Membership';
  export const getAll = async (c: Context) => {
    const event = await membershipService.getAllMemberships();
    if (!event) return c.notFound();
    return c.json(event);
  };

  export const getOne = async (c: Context) => {
    const id = Number(c.req.param('id'));
    const event = await membershipService.getMembershipById(id);
    if (!event) return c.notFound();
    return c.json(event);
  };
  export const create = async (c: Context) => {
    const body = await c.req.json();
    const parsed = membershipInsertSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.flatten() }, 400);
    }
  
    const result = await membershipService.createMembership(parsed.data);
    return c.json(result, 201);
  };
  export const update = async (c: Context) => {
    const id = Number(c.req.param('id'));
    const body = await c.req.json();
    const parsed = membershipInsertSchema.partial().safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.flatten() }, 400);
    }
  
    await membershipService.updateMembership(id, parsed.data);
    return c.body(null, 204);
  };
  export const remove = async (c: Context) => {
    const id = Number(c.req.param('id'));
    await membershipService.deleteMembership(id);
    return c.body(null, 204);
  };



  
          
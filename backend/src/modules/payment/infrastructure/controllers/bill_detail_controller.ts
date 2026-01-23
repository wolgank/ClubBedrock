import type { Context } from 'hono';
import * as billDetailService from '../../application/bill_detail_service';
import { billDetailInsertSchema } from '../../../../db/schema/BillDetail';
export const getAll = async (c: Context) => {
    const reservations = await billDetailService.getAllBillDetail();
    return c.json(reservations);
  };
  export const getOne= async (c: Context) => {
    const id = Number(c.req.param('id'));
    const reservation = await billDetailService.getBillDetailById(id);
    if (!reservation) return c.notFound();
    return c.json(reservation);
  };
  export const create = async (c: Context) => {
    const body = await c.req.json();
    const parsed = billDetailInsertSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.flatten() }, 400);
    }
  
    const result = await billDetailService.createBillDetail(parsed.data);
    return c.json(result, 201);
  };
  export const update = async (c: Context) => {
    const id = Number(c.req.param('id'));
    const body = await c.req.json();
    const parsed = billDetailInsertSchema.partial().safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.flatten() }, 400);
    }
  
    await billDetailService.updateBillDetail(id, parsed.data);
    return c.body(null, 204);
  };
  export const remove = async (c: Context) => {
    const id = Number(c.req.param('id'));
    await billDetailService.deleteBillDetail(id);
    return c.body(null, 204);
  };
          
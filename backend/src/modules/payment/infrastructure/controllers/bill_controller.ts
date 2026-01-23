import type { Context } from 'hono';
import * as billService from '../../application/bill_service';
import { billInsertSchema } from '../../../../db/schema/Bill';
import type { MemberBillInfo } from '../../dto/MemberBillInfo';
import type { BillWithDetails } from '../../dto/BillWithDetails';
export const getAll = async (c: Context) => {
    const reservations = await billService.getAllBill();
    return c.json(reservations);
  };
  export const getOne= async (c: Context) => {
    const id = Number(c.req.param('id'));
    const reservation = await billService.getBillById(id);
    if (!reservation) return c.notFound();
    return c.json(reservation);
  };
  export const create = async (c: Context) => {
    const body = await c.req.json();
    const parsed = billInsertSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.flatten() }, 400);
    }
  
    const result = await billService.createBill(parsed.data);
    return c.json(result, 201);
  };
  export const update = async (c: Context) => {
    const id = Number(c.req.param('id'));
    const body = await c.req.json();
    const parsed = billInsertSchema.partial().safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.flatten() }, 400);
    }
  
    await billService.updateBill(id, parsed.data);
    return c.body(null, 204);
  };
  export const remove = async (c: Context) => {
    const id = Number(c.req.param('id'));
    await billService.deletebillTable(id);
    return c.body(null, 204);
  };

  export const recalculate = async (c: Context) => {
  const id = Number(c.req.param("id"));
  if (isNaN(id)) {
    return c.json({ error: "ID inválido" }, 400);
  }

  try {
    
    const finalAmount = String(await billService.recalculateBillAmount(undefined,id));
    return c.json({ billId: id, finalAmount });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
};

export const pay = async (c: Context) => {
  try {
    const body = await c.req.json();
    const result = await billService.payBill(body);
    return c.json(result, 200);
  } catch (err: any) {
    return c.json({ error: err.message }, 400);
  }
};

export const payAdmissionFee = async (c: Context) => {
  try {
    const jwt = c.get("account") as { sub: number };
  if (!jwt?.sub) return c.json({ error: "No autenticado" }, 401);
  
    const body = await c.req.json();
    const result = await billService.payAdmissionFee(body,jwt.sub);
    return c.json(result, 200);
  } catch (err: any) {
    return c.json({ error: err.message }, 400);
  }
};     
export const fetchAdmissionFee = async (c: Context) => {
  const jwt = c.get("account") as { sub: number };
  //console.log("el jwt que llegó es, ",jwt);
  if (!jwt?.sub) return c.json({ error: "No autenticado" }, 401);

  try {
    const info = await billService.getAdmissionFee(jwt.sub);
    return c.json(info);
  } catch (err: any) {
    //console.log("el problema es ", err);
    return c.json({ error: err.message }, 404);
  }
};

export const listMemberFees = async (c: Context) => {
  // 1) Extraer el payload JWT guardado en c.var 'account'
  const jwtPayload = c.get("account") as { sub?: number };
  if (!jwtPayload?.sub) {
    return c.json({ error: "No autenticado correctamente" }, 401);
  }
  const accountID = jwtPayload.sub;

  try {
    const bills: MemberBillInfo[] = await billService.getFeesForMember(accountID);
    return c.json(bills);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
};
export const listMemberFeesForManager = async (c: Context) => {
  // 1) Extraer el payload JWT guardado en c.var 'account'
  
  try {
    const id = Number(c.req.param('id'));
    const error= id??"ponme id pe causa, soy pa listar fees pal manager";
    if(error!=id) return c.json(error);
    
    const bills: MemberBillInfo[] = await billService.getFeesForMemberManagerReq(id);
    return c.json(bills);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
};
/**
 * GET /bills/:id/details
 * Retorna una factura completa con sus detalles (bill_details).
 */
export const getBillWithDetails = async (c: Context) => {
  const idParam = c.req.param("id");
  const billId = Number(idParam);
  if (isNaN(billId)) {
    return c.json({ error: "ID inválido" }, 400);
  }

  try {
    const billData: BillWithDetails = await billService.getBillDetailById(billId);
    return c.json(billData);
  } catch (err: any) {
    return c.json(
      { error: err.message },
      err.message === "Factura no encontrada" ? 404 : 500
    );
  }
};


import { db } from "../../../db";
import { bill as billTable, billInsertSchema, bill } from "../../../db/schema/Bill";
import { eq, sql, and,desc } from "drizzle-orm";
import { billDetail } from "../../../db/schema/BillDetail";
import { z } from "zod";
import { paymentMethod } from "../../../shared/enums/PaymentMethod";
import { payment, paymentInsertSchema } from "../../../db/schema/Payment";
import { user } from "../../../db/schema/User";
import { membershipXMember } from "../../../db/schema/MembershipXMember";
import { member } from "../../../db/schema/Member";
import { membership } from "../../../db/schema/Membership";
import { membershipState } from "../../../shared/enums/MembershipState";
import { membershipApplication } from "../../../db/schema/MembershipApplication";
import { memberRequest } from "../../../db/schema/MemberRequest";
import { getDetailsFromBill, type BillDetailInfo } from "./bill_detail_service";
import { debtStatus } from "../../../shared/enums/DebtStatus";
import type { MemberBillInfo } from "../dto/MemberBillInfo";
import type { BillWithDetails } from "../dto/BillWithDetails";
import type { MySqlTransaction } from "drizzle-orm/mysql-core";
import type { MySql2PreparedQueryHKT, MySql2QueryResultHKT } from "drizzle-orm/mysql2";

export const getAllBill = () => db.select().from(billTable);

export const getBillById = (id: number) =>
    db
        .select()
        .from(billTable)
        .where(eq(billTable.id, id))
        .then((res) => res[0]);

export const createBill = async (data: typeof billInsertSchema._input) => {
    const insertId = await db
        .insert(billTable)
        .values({
            ...data,
            finalAmount: data.finalAmount?.toString(),
            createdAt: new Date(data.createdAt),
            dueDate: new Date(data.dueDate),
        })
        .$returningId()
        .then((res) => res[0]);

    if (!insertId?.id) {
        throw new Error("Failed to retrieve the inserted billTable ID.");
    }
    const [createBill] = await db
        .select()
        .from(billTable)
        .where(eq(billTable.id, insertId.id));
    return createBill;
};

export const updateBill = async (
    id: number,
    data: Partial<typeof billInsertSchema._input>
) => {

    await db
        .update(billTable)
        .set(
            {
                ...data,
                finalAmount: data.finalAmount !== undefined ? data.finalAmount?.toString() : undefined,
                createdAt: data.createdAt ? new Date(data.createdAt) : undefined,
                dueDate: data.dueDate ? new Date(data.dueDate) : undefined
            }
        )
        .where(eq(billTable.id, id));

    const updatedBillTable = await db
        .select()
        .from(billTable)
        .where(eq(billTable.id, id));
    if (!updatedBillTable.length) {
        throw new Error("Failed to update the billTable.");
    }

    return updatedBillTable[0];
};

export const deletebillTable = (id: number) =>
    db.delete(billTable).where(eq(billTable.id, id));

export const recalculateBillAmount = async (
  tx?: MySqlTransaction<MySql2QueryResultHKT, MySql2PreparedQueryHKT, any, any> ,
  billId: number=0): Promise<number> => {
  // return await db.transaction(async (tx) => {
  if (!tx) {
    // No se pasó tx → creamos uno con db.transaction
    return await db.transaction(async (innerTx) => {
      return recalculateBillAmount(innerTx, billId);
    });
  }
    // 1) Sumar todos los finalPrice de los detalles asociados, forzando a string
    const [row] = await tx
      .select({
        total: sql<string>`COALESCE(SUM(${billDetail.finalPrice}), 0)`,
      })
      .from(billDetail)
      .where(eq(billDetail.billId, billId));

    // row puede venir undefined si no hay resultados
    const totalStr = row?.total ?? "0";

    // Convertimos a número
    const newTotal = Number(totalStr);
    //console.log("nuevo total: ",newTotal);
    // 2) Actualizar el campo finalAmount de la factura
    await tx
      .update(bill)
      .set({ finalAmount: newTotal.toString() })
      .where(eq(bill.id, billId));

    //console.log("nuevo total: ",newTotal);
    // 3) Devolver el total calculado
    return newTotal;
  // });
};


// DTO de entrada para el pago
const PayDto = z.object({
  billId: z.number().int(),
  paymentMethod: z.enum(paymentMethod),
});
export type PayDto = z.infer<typeof PayDto>;

/**
 * Paga una factura:
 * 1. Verifica que exista y esté en estado PENDING o OVERDUE.
 * 2. Actualiza su status a PAID.
 * 3. Crea un registro en `payment` con:
 *    - id = billId
 *    - debtId = misma cadena que billId
 *    - amount = bill.finalAmount
 *    - status = PAID
 *    - paymentDate = ahora
 *    - paymentMethod = dado
 *    - referenceCode = `${billId}-${timestamp}-${rand}`
 */
export async function payBill(input: PayDto) {
  const { billId, paymentMethod } = PayDto.parse(input);

  //console.log("billid parseado y del input", billId, input.billId)
  return await db.transaction(async (tx) => {
    // 1) Leer la factura
    const [b] = await tx
      .select({ amount: bill.finalAmount, status: bill.status })
      .from(bill)
      .where(eq(bill.id, billId));

    if (!b) {
      throw new Error("Factura no encontrada");
    }
    if (b.status !== "PENDING" && b.status !== "OVERDUE") {
      throw new Error("Factura no está en estado pendiente o vencida");
    }

    // 2) Actualizar a PAID
    await tx
      .update(bill)
      .set({ status: debtStatus[1]})
      .where(eq(bill.id, billId));

    // 3) Crear Payment
    const now = new Date();
    // generar código de referencia: BILL-{id}-{timestamp}-{4 dígitos}
    const ref = `BILL-${billId}-${now.getTime()}-${Math
      .random()
      .toString(36)
      .slice(2, 6)
      .toUpperCase()}`;

    const paymentDto = {
      id:            billId,
      debtId:        String(billId),
      amount:        b.amount.toString(),
      status:        "PAID",
      paymentDate:   now,
      paymentMethod,
      referenceCode: ref,
    };

    const parsed = paymentInsertSchema.parse(paymentDto);
    await tx.insert(payment).values(parsed);

    return { billId, referenceCode: ref, paidAmount: Number(b.amount) };
  });
}

export async function payAdmissionFee(
 input: PayDto,
  accountID: number
): Promise<{ billId: number; referenceCode: string; paidAmount: number }> {
  return await db.transaction(async (tx) => {
    // 1) Cobrar la factura con el helper ya existente
    const { referenceCode, paidAmount } = await payBill( { billId:input.billId, paymentMethod:input.paymentMethod } );

    // 2) Obtener el user.id desde accountID
    const [u] = await tx
      .select({ id: user.id })
      .from(user)
      .where(eq(user.accountID, accountID));
    if (!u) throw new Error("Usuario no encontrado");

    // 3) Buscar la membership PRE_ADMITTED para ese usuario
    const [mxm] = await tx
      .select({ membershipId: membershipXMember.membershipId })
      .from(membershipXMember)
      .innerJoin(member, eq(member.id, membershipXMember.memberId))
      .innerJoin(membership, eq(membership.id, membershipXMember.membershipId))
      .where(
        and(
            eq(member.id, u.id),
            eq(membership.state, membershipState[3]) // PRE_ADMITTED
        )
      )
      .limit(1);

    // 4) Si existe, la activamos
    if (mxm) {
      await tx
        .update(membership)
        .set({ state: membershipState[1] }) // ACTIVE
        .where(eq(membership.id, mxm.membershipId));
    }
    return { billId:input.billId , referenceCode, paidAmount };
  });
}


export type AdmissionFeeInfo = {
  bill: {
    id: number;
    finalAmount: string;
    status: string;
    description: string | null;
    createdAt: Date;
    dueDate: Date | null;
    userId: number;
  };
  details: BillDetailInfo[];
};

export async function getAdmissionFee(
  accountID: number
): Promise<AdmissionFeeInfo> {
  // 1) Obtener la última aplicación de membresía de esta cuenta
  const [app] = await db
    .select({ id: membershipApplication.id })
    .from(membershipApplication)
    .where(eq(membershipApplication.accountID, accountID))
    .orderBy(desc(membershipApplication.id))
    .limit(1);
  if (!app) throw new Error("No hay solicitudes de membresía para esta cuenta");

  // 2) Leer el memberRequest principal y extraer idBillDetail
  const [req] = await db
    .select({ idBillDetail: memberRequest.idBillDetail, idBill: billDetail.billId })
    .from(memberRequest)
    .where(eq(memberRequest.id, app.id))
    .innerJoin(billDetail, eq(billDetail.id, memberRequest.idBillDetail) )
    ;
  if (!req || req.idBillDetail == null) {
    throw new Error("No se encontró el detalle de factura para la solicitud");
  }
  

  // 3) Traer el BillDetail(s)
  const details = await getDetailsFromBill(req.idBill);

  if (details.length === 0) {
    throw new Error("Detalle de factura no encontrado");
  }

  // 4) Traer el Bill
  const [b] = await db
    .select({
      id:          bill.id,
      finalAmount: bill.finalAmount,
      status:      bill.status,
      description: bill.description,
      createdAt:   bill.createdAt,
      dueDate:     bill.dueDate,
      userId:      bill.userId,
    })
    .from(bill)
    .where(eq(bill.id, details[0]!.billId));

  if (!b) throw new Error("Factura no encontrada");

  return { bill: b, details };
}

/**
 * Recupera todas las facturas (bills) asociadas al miembro cuyo accountID es el dado.
 * Devuelve: id, finalAmount, description, createdAt, dueDate, status.
 */
export async function getFeesForMemberManagerReq(
  memberId: number
): Promise<MemberBillInfo[]> {
//nos traen ya el user/member id
  // 2) Traer todas las facturas de ese usuario
  return await db
    .select({
      id:          bill.id,
      finalAmount: bill.finalAmount,
      description: bill.description,
      createdAt:   bill.createdAt,
      dueDate:     bill.dueDate,
      status:      bill.status,
    })
    .from(bill)
    .where(eq(bill.userId, memberId))
    .orderBy(desc(bill.createdAt));
}

export async function getFeesForMember(
  accountID: number
): Promise<MemberBillInfo[]> {
  // 1) Encontrar el user.id asociado al accountID
  const [u] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.accountID, accountID))
    .limit(1);
//console.log("usuario: ", u)
  if (!u) {
    throw new Error("Usuario asociado no encontrado");
  }

  // 2) Traer todas las facturas de ese usuario
  return await db
    .select({
      id:          bill.id,
      finalAmount: bill.finalAmount,
      description: bill.description,
      createdAt:   bill.createdAt,
      dueDate:     bill.dueDate,
      status:      bill.status,
    })
    .from(bill)
    .where(eq(bill.userId, u.id))
    .orderBy(desc(bill.createdAt));
}


/**
 * Recupera la factura con sus detalles (bill_details) dada su id.
 * - Si la factura no existe, lanza error.
 * - Devuelve la factura con todos sus BillDetail asociados.
 */
export async function getBillDetailById(billId: number): Promise<BillWithDetails> {
  // 1) Obtener la factura general
  const [b] = await db
    .select({
      id:          bill.id,
      finalAmount: bill.finalAmount,
      status:      bill.status,
      description: bill.description,
      createdAt:   bill.createdAt,
      dueDate:     bill.dueDate,
      userId:      bill.userId,
    })
    .from(bill)
    .where(eq(bill.id, billId));

  if (!b) {
    throw new Error("Factura no encontrada");
  }

  // 2) Obtener todos los detalles asociados
  const details = await db
    .select({
      id:         billDetail.id,
      price:      billDetail.price,
      discount:   billDetail.discount,
      finalPrice: billDetail.finalPrice,
      description: billDetail.description,
    })
    .from(billDetail)
    .where(eq(billDetail.billId, billId));

  return {
    id:          b.id,
    finalAmount: b.finalAmount,
    status:      b.status,
    description: b.description,
    createdAt:   b.createdAt,
    dueDate:     b.dueDate,
    userId:      b.userId,
    details:     details.map((d) => ({
      id:         d.id,
      price:      d.price,
      discount:   d.discount,
      finalPrice: d.finalPrice,
      description: d.description,
    })),
  };
}






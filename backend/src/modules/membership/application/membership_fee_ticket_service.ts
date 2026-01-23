// services/membership_fee_ticket_service.ts

import { db } from "../../../db";
import type { MySqlTransaction } from "drizzle-orm/mysql-core";
import { and, eq, sql, desc } from "drizzle-orm";
import {
  membership,
} from "../../../db/schema/Membership";
import { membershipXMember } from "../../../db/schema/MembershipXMember";
import { member } from "../../../db/schema/Member";
import { memberType } from "../../../db/schema/MemberType";
import { bill } from "../../../db/schema/Bill";
import { billDetail } from "../../../db/schema/BillDetail";
import { membershipFeeTicket, membershipFeeTicketInsertSchema } from "../../../db/schema/MembershipFeeTicket";

import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { debtStatus } from "../../../shared/enums/DebtStatus";


import { addOneMonth } from "../../../shared/utils/dayUtils";
import { recalculateBillAmount } from "../../payment/application/bill_service";
import type { MySql2PreparedQueryHKT, MySql2QueryResultHKT } from "drizzle-orm/mysql2";



function daysInMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}
/**
 * Genera la cuota de membresía *prorrateada* para la membresía indicada.
 * - Prorratea el total de las cuotas según los días que faltan hasta el 1º del mes siguiente.
 * - Crea Bill, BillDetail y MembershipFeeTicket.
 *
 * @param tx           – Transacción de Drizzle (o se crea una nueva si no se pasa).
 * @param membershipId – ID de la membresía a facturar.
 * @returns            { ticketId, billId }
 */
export async function generateMembershipFeeTicketFromMembership(
  tx?: MySqlTransaction<MySql2QueryResultHKT, MySql2PreparedQueryHKT, any, any>,
  membershipId: number = 0
): Promise<{ ticketId: number; billId: number }> {
  if (!tx) {
    // No se pasó tx → creamos uno con db.transaction
    return await db.transaction(async (innerTx) => {
      return generateMembershipFeeTicketFromMembership(innerTx, membershipId);
    });
  }


  // 1) Obtener miembros activos de esta membresía
  const members = await tx
    .select({
      id: member.id,
      subCode: member.subCode,
      typeName: memberType.name,
      feeCost: memberType.costInMembershipFee,
    })
    .from(membershipXMember)
    .innerJoin(member, eq(member.id, membershipXMember.memberId))
    .innerJoin(memberType, eq(memberType.id, member.memberTypeId))
    .where(
      and(
        eq(membershipXMember.membershipId, membershipId),
        // filtramos por endDate IS NULL:
        sql`${membershipXMember.endDate} IS NULL`
      )
    );

  if (members.length === 0) {
    throw new Error("No hay miembros activos en esta membresía");
  }
// 2) Calcular días para prorrateo
  const now = new Date();
  const firstNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysRemaining = Math.ceil(
    (firstNextMonth.getTime() - now.getTime()) / msPerDay
  );
  const totalDays = daysInMonth(now);

  // 3) Construir descripción y monto prorrateado
  const descParts = members.map((m) => `${m.typeName}: ${m.subCode}`);
  const baseTotal = members.reduce((sum, m) => sum + Number(m.feeCost), 0);
  const proratedTotal = (baseTotal * daysRemaining) / totalDays;
  const description = `CUOTA PRORRATEADA (${daysRemaining}/${totalDays} días) · ${descParts.join(
    "; "
  )}`;

  // 3) Crear Bill
  const titular = members.find(m => m.typeName === "TITULAR" || m.typeName === "Titular");
  if (!titular) {
    throw new Error("No se encontró un miembro de tipo TITULAR o Titular en esta membresía");
  }
  const titularUserId = titular.id;
  const billDto = {
      finalAmount: proratedTotal.toFixed(2),
    status: debtStatus[0],
    description,
    createdAt: now,

    dueDate: addOneMonth(now),

    userId: titularUserId,
  };


  const [billRec] = await tx.insert(bill).values(billDto).$returningId();
  if (!billRec) throw new Error("No se creó el Bill");

  // 4) Crear BillDetail
  const bdDto = {
    billId: billRec.id,
    price: proratedTotal.toFixed(2),
    discount: "0.00",
    finalPrice: proratedTotal.toFixed(2),
    description,
  };
  const [bdRec] = await tx.insert(billDetail).values(bdDto).$returningId();
  if (!bdRec) throw new Error("No se creó el BillDetail");

  // 5) Calcular fechas del ticket: hoy hasta mismo día mes siguiente
  // const startDate = now;
  // let endYear = now.getFullYear();
  // let endMonth = now.getMonth() + 1; // next month
  // if (endMonth === 12) {
  //   endMonth = 0;
  //   endYear += 1;
  // }
  // const desiredDay = now.getDate();
  // let candidate = new Date(endYear, endMonth, desiredDay);
  // // si overflow de mes, ajustar al último día del mes
  // if (candidate.getMonth() !== endMonth) {
  //   candidate = new Date(endYear, endMonth + 1, 0);
  // }
  // const endDate = candidate;

// 6) Crear MembershipFeeTicket
  const [ticketRec] = await tx
    .insert(membershipFeeTicket)
    .values(
      membershipFeeTicketInsertSchema.parse({
        id: bdRec.id,
        membershipId,
        startDate: now,
        endDate: firstNextMonth,
        moratoriumApplied: false,
      })
    );
  //   .$returningId();
  // if (!ticketRec) throw new Error("No se creó el MembershipFeeTicket");


  return {
    ticketId: bdRec.id,
    billId: billRec.id,

  };

}

export type AddMemberFeeResult = {
  billId: number;
  billDetailId: number;
  //ticketId: number;
};


/**
 * Agrega la cuota de membresía de un nuevo miembro **creando siempre
 * una nueva factura**, prorrateando el importe según el último ticket.
 */
export async function addNewMemberFeeToMembership(
  tx: MySqlTransaction<MySql2QueryResultHKT, MySql2PreparedQueryHKT, any, any>,
  newMemberId: number
): Promise<AddMemberFeeResult> {
  const now = new Date();

  // 1) Obtener membershipId activo
  const [mxm] = await tx
    .select({ membershipId: membershipXMember.membershipId })
    .from(membershipXMember)
    .where(and(
      eq(membershipXMember.memberId, newMemberId),
      sql`${membershipXMember.endDate} IS NULL`
    ))
    .limit(1);
  if (!mxm) throw new Error("Membresía activa no encontrada");

  const membershipId = mxm.membershipId;
    //console.log("la membresia de este patita es:",mxm);
  // 2) Último ticket de cuota
  const [lastTicket] = await tx
    .select({
      billDetailId: membershipFeeTicket.id,
      startDate:    membershipFeeTicket.startDate,
      endDate:      membershipFeeTicket.endDate,
    })
    .from(membershipFeeTicket)
    .where(eq(membershipFeeTicket.membershipId, membershipId))
    .orderBy(desc(membershipFeeTicket.startDate))
    .limit(1);
  if (!lastTicket) throw new Error("No existe ticket previo");

  const { billDetailId: refBDId, startDate: refStart, endDate: refEnd } = lastTicket;
    //console.log("el last ticket que encontré de este patita es:",lastTicket);
  // 3) Obtener el billId y userId del ticket de referencia
  const [refBD] = await tx
    .select({ billId: billDetail.billId })
    .from(billDetail)
    .where(eq(billDetail.id, refBDId));
  if (!refBD) throw new Error("BillDetail de referencia no encontrado");

  const billIdRef = refBD.billId;
  const [ userId ] = await tx
    .select({ userId: bill.userId })
    .from(bill)
    .where(eq(bill.id, billIdRef));

  // 4) Obtener costo del nuevo miembro
  const [ memberTypeId ] = await tx
    .select({ memberTypeId: member.memberTypeId })
    .from(member)
    .where(eq(member.id, newMemberId));
  const [tipo] = await tx
    .select({
      cost: memberType.costInMembershipFee,
      name: memberType.name,
    })
    .from(memberType)
    .where(eq(memberType.id, memberTypeId?.memberTypeId!));

  // 5) Calcular prorrateo
  const totalDays     = (refEnd.getTime()   - refStart.getTime()) / 86_400_000;
  const remainingDays = (refEnd.getTime()   - now.getTime())      / 86_400_000;
  const prorated      = (tipo?.cost! * (remainingDays / totalDays)).toFixed(2);

  // 6) Crear **nueva** factura
  const billDto = {
    finalAmount: prorated,
    status:      debtStatus[0],
    description: `CUOTA DE MEMBRESÍA PRORRATEADA (${tipo?.name!})`,
    createdAt:   now,
    dueDate:     refEnd,
    userId:userId?.userId!,
  };
  const [newBill] = await tx.insert(bill).values(billDto).$returningId();
  if (!newBill) throw new Error("No se creó la nueva factura");
  const billId = newBill.id;

  // 7) Insertar su único billDetail (monto completo, no prorrateado)
  const bdDescription = `CUOTA DE MEMBRESÍA PRORRATEADA (${tipo?.name!})`;
  const bdDto = {
    billId,
    price:      tipo?.cost!.toFixed(2)!,
    discount:   (tipo?.cost! *(1- remainingDays / totalDays)).toFixed(2)!,
    finalPrice: tipo?.cost!.toFixed(2)!,
    description: bdDescription,
  };
  const [newBD] = await tx.insert(billDetail).values(bdDto).$returningId();
  if (!newBD) throw new Error("No se creó el detalle de factura");
  const billDetailId = newBD.id;

  // 8) Recalcular total de la factura
 // await recalculateBillAmount(tx, billId);

  // 9) Crear el membership_fee_ticket asociado
  const ticketDto = {
    id:                billDetailId,
    membershipId,
    startDate:         now,
    endDate:           refEnd,
    moratoriumApplied: false,
  };
  await tx.insert(membershipFeeTicket).values(ticketDto);

  return { billId, billDetailId };// , ticketId: billDetailId
}
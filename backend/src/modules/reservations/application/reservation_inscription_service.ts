// services/event_service.ts
import { db } from "../../../db";
import { reservationInscription as reservationInscriptionTable, reservationInscriptionInsertSchema } from "../../../db/schema/ReservationInscription";
import { inscriptionXUser as inscription_x_userTable } from "../../../db/schema/InscriptionXUser"
import { eq, inArray, and, sql } from "drizzle-orm";
import { reservation as reservationTable } from "../../../db/schema/Reservation"
import { space, space as spaceTable } from "../../../db/schema/Space"
import { spaceDayTimeSlotForMember as spaceDayTimeSlotForMemberTable } from "../../../db/schema/SpaceDayTimeSlotForMember"
import { inscriptionXUser as inscriptionXUserTable } from "../../../db/schema/InscriptionXUser"
import * as notificationService from "../../notifications/application/notifications_service"

export const getAllReservationInscription = () => db.select().from(reservationInscriptionTable);


////////////////////////////////////////////////////////////////////////////////////////////

export const getReservationInscriptionByUserId = async (userId: number) => {
  const inscriptions = await db
    .select({ id: inscription_x_userTable.id })
    .from(inscription_x_userTable)
    .where(eq(inscription_x_userTable.userId, userId));

  const inscriptionIds = inscriptions.map((insc) => insc.id);

  if (inscriptionIds.length === 0) return [];

  const results = await db
    .select({
      reservationInscriptionId: reservationInscriptionTable.id,
      isCancelled: reservationInscriptionTable.isCancelled,
      reservationId: reservationInscriptionTable.reservationId,
      reservationTitle: reservationTable.name,
      reservationDate: reservationTable.date,
      reservationLocation: spaceTable.reference,
      spaceId: spaceTable.id,
      spaceName: spaceTable.name,
      spaceType: spaceTable.type,
      capacity: spaceTable.capacity,
      costPerHour: spaceTable.costPerHour,
      startHour: reservationTable.startHour,
      endHour: reservationTable.endHour,
      description: spaceTable.description,
      urlImage: spaceTable.urlImage
    })
    .from(reservationInscriptionTable)
    .innerJoin(reservationTable, eq(reservationTable.id, reservationInscriptionTable.reservationId))
    .innerJoin(spaceTable, eq(spaceTable.id, reservationTable.spaceId))
    .where(
      and(
        inArray(reservationInscriptionTable.inscriptionXUser, inscriptionIds),
        eq(reservationInscriptionTable.isCancelled, false)
      )
    );
  return results;
}

////////////////////////////////////////////////////////////////////////////////////////////


export const updateReservationInscription = async (
  id: number,
  data: Partial<typeof reservationInscriptionInsertSchema._input>
) => {

  await db
    .update(reservationInscriptionTable)
    .set(
      {
        ...data,
      }
    )
    .where(eq(reservationInscriptionTable.id, id));

  const updatedReservationInscription = await db
    .select()
    .from(reservationInscriptionTable)
    .where(eq(reservationInscriptionTable.id, id));
  if (!updatedReservationInscription.length) {
    throw new Error("Failed to update the reservation inscription.");
  }

  return updatedReservationInscription[0];
};

export const deleteReservationInscription = async (id: number) => {
  await db.transaction(async (tx) => {
    const [reservationInscription] = await tx
      .select({
        reservationId: reservationInscriptionTable.reservationId,
        inscriptionXUserId: reservationInscriptionTable.inscriptionXUser
      })
      .from(reservationInscriptionTable)
      .where(eq(reservationInscriptionTable.id, id));

    if (!reservationInscription) throw new Error('ReservationInscription se perdio por ahi');

    const [reservation] = await tx
      .select({
        startHour: reservationTable.startHour,
        endHour: reservationTable.endHour,
        spaceId: reservationTable.spaceId
      })
      .from(reservationTable)
      .where(eq(reservationTable.id, reservationInscription.reservationId));

    if (!reservation) throw new Error('Reservation se perdio por ahi');

    const [spaceUsed] = await tx
      .select({
        name: spaceTable.name
      })
      .from(spaceTable)
      .where(eq(spaceTable.id, reservation.spaceId));


    await tx
      .update(reservationInscriptionTable)
      .set({ isCancelled: true })
      .where(eq(reservationInscriptionTable.id, id));

    await tx
      .delete(spaceDayTimeSlotForMemberTable)
      .where(and(
        eq(spaceDayTimeSlotForMemberTable.startHour, reservation.startHour),
        eq(spaceDayTimeSlotForMemberTable.endHour, reservation.endHour),
        eq(spaceDayTimeSlotForMemberTable.spaceUsed, reservation.spaceId),
        eq(spaceDayTimeSlotForMemberTable.isUsed, true)
      ));



    const [user] = await getInfoReservationInscriptionById(id);

    if (user?.email) {
      await notificationService.enviarCorreo({
        to: user.email,
        subject: "Cancelación de reserva de espacio",
        message: `Estimado/a ${user.name} ${user.lastname},

Le informamos que su reserva del espacio ${spaceUsed?.name} del dia ${new Date(reservation.startHour).toDateString()} ha sido cancelada exitosamente.

Si desea volver a reservar un espacio, puede hacerlo desde el sistema.

Saludos cordiales,`
      });
    }

  });
};


import { user as userTable } from "../../../db/schema/User";
import { auth as authTable } from "../../../db/schema/Auth";
import { billDetail as billDetailTable } from "../../../db/schema/BillDetail";
import { bill as billTable } from "../../../db/schema/Bill";

export const getInfoReservationInscriptionById = async (id: number) => {
  return db
    .select({
      name: userTable.name,
      lastname: userTable.lastname,
      email: authTable.email,
    })
    .from(reservationInscriptionTable)
    .innerJoin(inscriptionXUserTable, eq(reservationInscriptionTable.inscriptionXUser, inscriptionXUserTable.id))
    .innerJoin(userTable, eq(inscriptionXUserTable.userId, userTable.id))
    .innerJoin(authTable, eq(userTable.accountID, authTable.id))
    .where(eq(reservationInscriptionTable.id, id));
}

function formatTime(date: string | Date): string {
  const d = new Date(date);
  return d.toTimeString().slice(0, 5); // "HH:MM"
}


export const reporteEspacioDeportivo = async () => {
  const data = await db
    .select({
      idReserva: reservationTable.id,
      fechaReserva: sql`DATE(${reservationTable.date})`.as("fechaReserva"),
      horario: sql`CONCAT(TIME_FORMAT(${reservationTable.startHour}, '%H:%i'), ' - ', TIME_FORMAT(${reservationTable.endHour}, '%H:%i'))`.as("horario"),
      nombreCancha: spaceTable.name,
      nombreCliente: sql`CONCAT(${userTable.name}, ' ', ${userTable.lastname})`.as("nombreCliente"),
      emailCliente: authTable.email,
      estadoReserva: sql`
        CASE
          WHEN ${reservationInscriptionTable.isCancelled} = true THEN 'CANCELADA'
          ELSE 'ACTIVA'
        END
      `.as("estadoReserva"),
      montoTotal: billDetailTable.finalPrice,
      montoPagado: billDetailTable.finalPrice,
      estadoPago: billTable.status,
      metodoPago: sql`
        CASE
          WHEN ${billDetailTable.finalPrice} = 0 THEN 'GRATUITO'
          ELSE 'TARJETA'
        END
      `.as("metodoPago"),
    })
    .from(reservationInscriptionTable)
    .innerJoin(
      reservationTable,
      eq(reservationTable.id, reservationInscriptionTable.reservationId)
    )
    .innerJoin(spaceTable, eq(spaceTable.id, reservationTable.spaceId))
    .innerJoin(
      inscriptionXUserTable,
      eq(reservationInscriptionTable.inscriptionXUser, inscriptionXUserTable.id)
    )
    .innerJoin(userTable, eq(inscriptionXUserTable.userId, userTable.id))
    .innerJoin(authTable, eq(userTable.accountID, authTable.id))
    .innerJoin(billDetailTable, eq(billDetailTable.id, inscriptionXUserTable.id))
    .innerJoin(billTable, eq(billTable.id, billDetailTable.billId))
    .where(eq(spaceTable.type, "SPORTS")); // ← Aquí está el nuevo filtro

  return data;
};


export const reporteEspacioLeisure = async () => {
  const data = await db
    .select({
      idReserva: reservationTable.id,
      fecha: sql`DATE(${reservationTable.date})`.as("fechaReserva"),
      horario: sql`CONCAT(TIME_FORMAT(${reservationTable.startHour}, '%H:%i'), ' - ', TIME_FORMAT(${reservationTable.endHour}, '%H:%i'))`.as("horario"),
      nombreEspacio: spaceTable.name,
      nombreUsuario: sql`CONCAT(${userTable.name}, ' ', ${userTable.lastname})`.as("nombreUsuario"),
      emailUsuario: authTable.email,
      estadoReserva: sql`
        CASE
          WHEN ${reservationInscriptionTable.isCancelled} = true THEN 'CANCELADA'
          ELSE 'ACTIVA'
        END
      `.as("estadoReserva"),
      montoTotal: billDetailTable.finalPrice,
      costoBloque: billDetailTable.finalPrice,
      estadoPago: billTable.status,
      metodoPago: sql`
        CASE
          WHEN ${billDetailTable.finalPrice} = 0 THEN 'GRATUITO'
          ELSE 'TARJETA'
        END
      `.as("metodoPago"),
    })
    .from(reservationInscriptionTable)
    .innerJoin(
      reservationTable,
      eq(reservationTable.id, reservationInscriptionTable.reservationId)
    )
    .innerJoin(spaceTable, eq(spaceTable.id, reservationTable.spaceId))
    .innerJoin(
      inscriptionXUserTable,
      eq(reservationInscriptionTable.inscriptionXUser, inscriptionXUserTable.id)
    )
    .innerJoin(userTable, eq(inscriptionXUserTable.userId, userTable.id))
    .innerJoin(authTable, eq(userTable.accountID, authTable.id))
    .innerJoin(billDetailTable, eq(billDetailTable.id, inscriptionXUserTable.id))
    .innerJoin(billTable, eq(billTable.id, billDetailTable.billId))
    .where(eq(spaceTable.type, "LEISURE")); // ← Aquí está el nuevo filtro

  return data;
};

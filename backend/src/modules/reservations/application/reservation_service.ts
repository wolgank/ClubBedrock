// services/event_service.ts
import { db } from "../../../db";
import { reservation as reservationTable, reservationInsertSchema, reservation } from "../../../db/schema/Reservation";
import { eq, and, lt, gt, between } from "drizzle-orm";
export const getAllReservations = () => db.select().from(reservationTable);
import { spaceDayTimeSlotForMember as spaceDayTimeSlotForMemberTable } from "../../../db/schema/SpaceDayTimeSlotForMember";

export const getReservationById = (id: number) =>
  db
    .select()
    .from(reservationTable)
    .where(eq(reservationTable.id, id))
    .then((res) => res[0]);

export const createReservation = async (data: typeof reservationInsertSchema._input) => {
  const insertId = await db
    .insert(reservationTable)
    .values({
      ...data,
      date: new Date(data.date), // Convierte la fecha de string a Date
      startHour: new Date(data.startHour), // Convierte la fecha de string a Date
      endHour: new Date(data.endHour), // Convierte la fecha de string a Date
    })
    .$returningId()
    .then((res) => res[0]);

  if (!insertId?.id) {
    throw new Error("Failed to retrieve the inserted reservation ID.");
  }
  const [createdReservation] = await db
    .select()
    .from(reservationTable)
    .where(eq(reservationTable.id, insertId.id));
  return createdReservation;
};


export const createNewReservation = async (data: typeof reservationInsertSchema._input) => {
  return await db.transaction(async (tx) => {
    // Insertar en la tabla de reservas
    const insertId = await tx
      .insert(reservationTable)
      .values({
        ...data,
        date: new Date(data.date),
        startHour: new Date(data.startHour),
        endHour: new Date(data.endHour),
      })
      .$returningId()
      .then((res) => res[0]);

    if (!insertId?.id) {
      throw new Error("No se pudo recuperar el ID de la reserva insertada.");
    }

    // Insertar en la tabla timeslotForMember
    await tx.insert(spaceDayTimeSlotForMemberTable).values({
      day: new Date(data.date),
      startHour: new Date(data.startHour),
      endHour: new Date(data.endHour),
      spaceUsed: data.spaceId,
      isUsed: true,
      pricePerBlock: 0, // Usa 0 si no se proporciona precio
    });

    // Obtener y devolver la reserva creada
    const [createdReservation] = await tx
      .select()
      .from(reservationTable)
      .where(eq(reservationTable.id, insertId.id));

    return createdReservation;
  });
};





import { MySqlTransaction } from 'drizzle-orm/mysql-core';

export const createReservationWithTransaction = async (
  data: typeof reservationInsertSchema._input,
  tx: MySqlTransaction<any, any, any, any>
) => {
  const dateObj = new Date(data.date);
  const start = new Date(`${data.date}T${data.startHour}`);
  const end = new Date(`${data.date}T${data.endHour}`);

  // 1. Validar que la hora de inicio sea anterior a la de fin
  if (start >= end) {
    throw new Error(`La hora de inicio ${data.startHour} debe ser anterior a la de fin ${data.endHour}`);
  }

  // 2. Verificar si ya hay una reserva solapada en el mismo espacio y día
  const overlapping = await tx
    .select()
    .from(reservationTable)
    .where(
      and(
        eq(reservationTable.date, dateObj),
        eq(reservationTable.spaceId, data.spaceId),
        lt(reservationTable.startHour, end),
        gt(reservationTable.endHour, start)
      )
    );

  if (overlapping.length > 0) {
    throw new Error(
      `Conflicto de reserva: ya existe una reserva en el espacio ${data.spaceId} el ${data.date} entre ${data.startHour} y ${data.endHour}`
    );
  }

  // 3. Insertar la reserva
  const insertId = await tx
    .insert(reservationTable)
    .values({
      ...data,
      date: dateObj,
      startHour: start,
      endHour: end,
    })
    .$returningId()
    .then((res) => res[0]);

  if (!insertId?.id) {
    throw new Error("No se pudo obtener el ID de la reserva insertada.");
  }

  const [createdReservation] = await tx
    .select()
    .from(reservationTable)
    .where(eq(reservationTable.id, insertId.id));

  return createdReservation;
};




export const updateReservation = async (
  id: number,
  data: Partial<typeof reservationInsertSchema._input>
) => {

  await db
    .update(reservationTable)
    .set(
      {
        ...data,
        date: data.date ? new Date(data.date) : undefined, // Convierte la fecha de string a Date
        startHour: data.startHour ? new Date(data.startHour) : undefined, // Convierte la fecha de string a Date
        endHour: data.endHour ? new Date(data.endHour) : undefined, // Convierte la fecha de string a Date
      }
    )
    .where(eq(reservationTable.id, id));

  const updatedReservation = await db
    .select()
    .from(reservationTable)
    .where(eq(reservationTable.id, id));
  if (!updatedReservation.length) {
    throw new Error("Failed to update the reservation.");
  }

  return updatedReservation[0];
};

export const deleteReservation = (id: number) =>
  db.transaction(async (tx) => {
    // 1. Obtener la reserva con sus horas
    const [reservation] = await tx
      .select()
      .from(reservationTable)
      .where(eq(reservationTable.id, id));

    if (!reservation) throw new Error('Reserva no encontrada');

    // 2. Borrar los time slots que coincidan exactamente en horas
    await tx
      .delete(spaceDayTimeSlotForMemberTable)
      .where(
        and(
          eq(spaceDayTimeSlotForMemberTable.startHour, reservation.startHour),
          eq(spaceDayTimeSlotForMemberTable.endHour, reservation.endHour)
        )
      );

    // 3. Borrar la reserva
    await tx
      .delete(reservationTable)
      .where(eq(reservationTable.id, id));
  });


import { AppError } from "../../../shared/utils/AppError";


export const createNewReservationWithValidation = async () => {

  throw new AppError("payasito , que rico gagagagagagagagagagag.", 501);
}


export const createNewReservationSports = async (data: typeof reservationInsertSchema._input) => {
  try {
    const result = await db.transaction(async (tx) => {

      const startOfDay = new Date(data.date);
      startOfDay.setUTCHours(0, 0, 0, 0);

      const endOfDay = new Date(data.date);
      endOfDay.setUTCHours(23, 59, 59, 999);


      const start = new Date(data.startHour);
      const end = new Date(data.endHour);

      start.setSeconds(0, 0);
      end.setSeconds(0, 0);

      const overlappingSlots = await tx
        .select()
        .from(spaceDayTimeSlotForMemberTable)
        .where(
          and(
            between(spaceDayTimeSlotForMemberTable.day, startOfDay, endOfDay),
            eq(spaceDayTimeSlotForMemberTable.spaceUsed, data.spaceId),
            eq(spaceDayTimeSlotForMemberTable.isUsed, true),
            lt(spaceDayTimeSlotForMemberTable.startHour, end),
            gt(spaceDayTimeSlotForMemberTable.endHour, start)
          )
        );
      //console.log("overlappingSlots", overlappingSlots);
      //console.log(start, end);

      if (overlappingSlots.length > 0) {
        const slot = overlappingSlots[0];
        const start = new Date(slot!.startHour).toLocaleTimeString("es-PE", { hour: '2-digit', minute: '2-digit' });
        const end = new Date(slot!.endHour).toLocaleTimeString("es-PE", { hour: '2-digit', minute: '2-digit' });
        throw new AppError(
          `Conflicto con una reserva existente: ${start} - ${end}.`,
          501
        );
      }

      const insertId = await tx
        .insert(spaceDayTimeSlotForMemberTable)
        .values({
          day: new Date(data.date),
          startHour: new Date(data.startHour),
          endHour: new Date(data.endHour),
          spaceUsed: data.spaceId,
          isUsed: true,
          pricePerBlock: 0,
        })
        .$returningId()
        .then((res) => res[0]);

      if (!insertId?.id) {
        throw new AppError("No se pudo insertar el timeslot", 500);
      }

      const insertReservationId = await tx
        .insert(reservationTable)
        .values({
          ...data,
          isSpecial: true,
          date: new Date(data.date),
          startHour: new Date(data.startHour),
          endHour: new Date(data.endHour),
        })
        .$returningId()
        .then((res) => res[0]);

      if (!insertReservationId?.id) {
        throw new AppError("No se pudo insertar la reserva.", 500);
      }
      return insertReservationId;
    });
    return result;
  } catch (error) {
    console.error("Error transaccional al crear reserva:", error);
    throw error instanceof AppError
      ? error
      : new AppError("Error inesperado al crear la reserva", 500);
  }
}

export const getSpecialReservationsBySpaceId = (spaceId: number) => {
  return db
    .select()
    .from(reservationTable)
    .where(and(eq(reservationTable.spaceId, spaceId), eq(reservationTable.allowOutsiders, true), eq(reservationTable.isSpecial, true)))
}

import { auth as authTable } from "../../../db/schema/Auth";
import { user as userTable } from "../../../db/schema/User";

export const getCorreoByUserId = async (userId: number) => {
  const result = await db
    .select({
      email: authTable.email,
    })
    .from(userTable)
    .innerJoin(authTable, eq(userTable.accountID, authTable.id))
    .where(eq(userTable.id, userId));

  return result[0]?.email ?? null;
};

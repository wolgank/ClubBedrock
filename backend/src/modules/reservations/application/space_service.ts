// services/event_service.ts
import { db } from "../../../db";
import { space as spaceTable, spaceInsertSchema } from "../../../db/schema/Space";
import { eq, and } from "drizzle-orm";
import { spaceDayTimeSlotForMember as spaceDayTimeSlotForMemberTable } from "../../../db/schema/SpaceDayTimeSlotForMember";
export const getAllSpaces = () => db.select().from(spaceTable).where(eq(spaceTable.isAvailable, true));
export const getAllSpacesLeisure = () => db.select().from(spaceTable).where(and(eq(spaceTable.isAvailable, true), eq(spaceTable.type, "LEISURE")));
export const getAllSpacesSports = () => db.select().from(spaceTable).where(and(eq(spaceTable.isAvailable, true), eq(spaceTable.type, "SPORTS")));
import { AppError } from "../../../shared/utils/AppError";

export const getSpaceById = (id: number) =>
  db
    .select()
    .from(spaceTable)
    .where(and(eq(spaceTable.id, id), eq(spaceTable.isAvailable, true)))
    .then((res) => res[0]);







function getNextDateTime(dayOfWeek: string, time: string): Date {
  const daysMap = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };

  const targetDay = daysMap[dayOfWeek.toLowerCase() as keyof typeof daysMap];
  const now = new Date();
  const todayDay = now.getDay();

  let daysToAdd = (targetDay - todayDay + 7) % 7;
  if (daysToAdd === 0) daysToAdd = 7;

  const nextDate = new Date(now);
  nextDate.setDate(now.getDate() + daysToAdd);

  const [hoursStr, minutesStr] = time.split(":");
  const hours = Number(hoursStr);
  const minutes = Number(minutesStr);

  if (isNaN(hours) || isNaN(minutes)) {
    throw new Error(`Invalid time format: ${time}`);
  }
  nextDate.setHours(hours);
  nextDate.setMinutes(minutes);
  nextDate.setSeconds(0);
  nextDate.setMilliseconds(0);

  return nextDate;
}

export const createNewSpace = async (
  data: typeof spaceInsertSchema._input,
) => {

  const existingSpace = await db
    .select()
    .from(spaceTable)
    .where(
      and(
        eq(spaceTable.name, data.name),
        eq(spaceTable.type, data.type)
      )
    );

  if (existingSpace.length > 0) {
    throw new AppError("Ya existe un espacio con el mismo nombre y categoría.", 500);
  }



  const linkUrl = data.urlImage
    ? `${process.env.BACKEND_URL}/files/download/${data.urlImage}`
    : `${process.env.BACKEND_URL}/files/download/Placeholder.png`;


  const insertId = await db
    .insert(spaceTable)
    .values({
      ...data,
      urlImage: linkUrl,
    })
    .$returningId()
    .then((res) => res[0]);

  if (!insertId?.id) {
    throw new AppError("Failed to retrieve the inserted space ID.", 500);
  }

  const [createdSpace] = await db
    .select()
    .from(spaceTable)
    .where(eq(spaceTable.id, insertId.id));

  return createdSpace;

}

export const createSpace = async (
  data: typeof spaceInsertSchema._input,
  weeklySchedules?: Array<{ day: string; start: string; end: string }>
) => {
  const linkUrl = data.urlImage
    ? `${process.env.BACKEND_URL}/files/download/${data.urlImage}`
    : `${process.env.BACKEND_URL}/files/download/Placeholder.png`;

  return await db.transaction(async (tx) => {
    // Insertar el espacio
    const insertId = await tx
      .insert(spaceTable)
      .values({
        ...data,
        urlImage: linkUrl,
      })
      .$returningId()
      .then((res) => res[0]);

    if (!insertId?.id) {
      throw new Error("Failed to retrieve the inserted space ID.");
    }

    // Insertar los horarios asociados, si hay
    if (weeklySchedules && weeklySchedules.length > 0) {
      for (const schedule of weeklySchedules) {
        const startDate = getNextDateTime(schedule.day, schedule.start);
        const endDate = getNextDateTime(schedule.day, schedule.end);

        await tx.insert(spaceDayTimeSlotForMemberTable).values({
          spaceUsed: insertId.id,
          day: startDate, // Solo la parte de la fecha se usará (ignorar tiempo)
          startHour: startDate,
          endHour: endDate,
        });
      }
    }

    // Consultar y devolver el espacio creado
    const [createdSpace] = await tx
      .select()
      .from(spaceTable)
      .where(eq(spaceTable.id, insertId.id));

    return createdSpace;
  });
};


export const getSpacesByType = (type: 'LEISURE' | 'SPORTS') =>
  db
    .select()
    .from(spaceTable)
    .where(and(eq(spaceTable.type, type), eq(spaceTable.isAvailable, true), eq(spaceTable.canBeReserved, true)))
    .then((res) => res);

export const updateSpace = async (
  id: number,
  data: Partial<typeof spaceInsertSchema._input>
) => {
  const linkUrl = data.urlImage
    ? `${process.env.BACKEND_URL}/files/download/${data.urlImage}`
    : `${process.env.BACKEND_URL}/files/download/Placeholder.png`;

  await db
    .update(spaceTable)
    .set(
      {
        ...data,
        urlImage: linkUrl,
      }
    )
    .where(eq(spaceTable.id, id));

  const updatedSpace = await db
    .select()
    .from(spaceTable)
    .where(eq(spaceTable.id, id));
  if (!updatedSpace.length) {
    throw new Error("Failed to update the space.");
  }

  return updatedSpace[0];
};

export const deleteSpace = async (id: number) => {
  return await db.transaction(async (tx) => {
    // Buscar el espacio por ID
    const [space] = await tx.select()
      .from(spaceTable)
      .where(eq(spaceTable.id, id));

    // Si no se encontró el espacio
    if (!space) {
      throw new AppError("Espacio no encontrado", 500);
    }

    // Si ya está eliminado
    if (!space.isAvailable) {
      throw new AppError("Este espacio ya fue eliminado", 500);
    }

    // Si no, proceder a actualizar
    await tx.update(spaceTable)
      .set({ isAvailable: false })
      .where(eq(spaceTable.id, id));

    return { message: "Espacio eliminado correctamente" };
  });
};


////////////////////////////////////////////////////////////////

import { inscriptionXUser as inscriptionXUserTable } from "../../../db/schema/InscriptionXUser";
import { reservation as reservationTable } from "../../../db/schema/Reservation";
import { user as userTable } from "../../../db/schema/User";
import { reservationInscription as reservationInscriptionTable } from "../../../db/schema/ReservationInscription";
import { auth as authTable } from "../../../db/schema/Auth";

export const getReservationsBySpaceId = async (spaceId: number) => {
  const results = await db
    .select({
      id: reservationInscriptionTable.id,
      name: userTable.name,
      lastname: userTable.lastname,
      startHour: reservationTable.startHour,
      endHour: reservationTable.endHour,
      correo: authTable.email,
      isCancelled: reservationInscriptionTable.isCancelled,
    })
    .from(reservationInscriptionTable)
    .innerJoin(reservationTable, eq(reservationInscriptionTable.reservationId, reservationTable.id))
    .innerJoin(inscriptionXUserTable, eq(reservationInscriptionTable.inscriptionXUser, inscriptionXUserTable.id))
    .innerJoin(userTable, eq(inscriptionXUserTable.userId, userTable.id))
    .innerJoin(authTable, eq(userTable.accountID, authTable.id))
    .where(and(eq(reservationTable.spaceId, spaceId), eq(reservationInscriptionTable.isCancelled, false)));
  return results;
};
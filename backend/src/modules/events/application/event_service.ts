// services/event_service.ts
import { db } from "../../../db";
import { event, eventInsertSchema, eventInsertSchemaM } from "../../../db/schema/Event";
import { eq, and, asc, desc, gte, lte, sql, lt, gt, between, inArray } from "drizzle-orm";
import { createEventSchema, querySchemaEvents } from "../../events/domain/event";
import type { CreateEvent, EventFilter } from "../../events/domain/event";
export const getAllEvents = () => db.select().from(event);
import { space } from "../../../db/schema/Space"
import { reservation } from "../../../db/schema/Reservation"
import { AppError } from "../../../shared/utils/AppError";


export const getAllEventsMember = () => db.select(
  {
    id: event.id,
    name: event.name,
    date: event.date,
    startHour: event.startHour,
    endHour: event.endHour,
    allowOutsiders: event.allowOutsiders,
  }

).from(event).where(eq(event.isActive, true));

export const getEventById = (id: number) =>
  db
    .select()
    .from(event)
    .where(eq(event.id, id))
    .then((res) => res[0]);

export const createEvent = async (data: unknown) => {
  // Convertir la fecha de string a Date

  const parsedData = createEventSchema.parse(data);

  const convertedData = {
    ...parsedData,
    date: new Date(parsedData.date),
    startHour: new Date(parsedData.startHour),
    endHour: new Date(parsedData.endHour),
    ticketPriceMember: parsedData.ticketPriceMember.toString(),
    ticketPriceGuest: parsedData.ticketPriceGuest.toString(),
  };

  // Inserta el evento con los datos corregidos
  const insertId = await db
    .insert(event)
    .values(convertedData)
    .$returningId()
    .then((res) => res[0]);

  // Obtenemos el evento recién creado utilizando su ID
  if (!insertId?.id) {
    throw new Error("Failed to retrieve the inserted event ID.");
  }
  const [createdEvent] = await db
    .select()
    .from(event)
    .where(eq(event.id, insertId.id));
  return createdEvent;
};

export const updateEvent = async (id: number, data: Partial<CreateEvent>) => {
  // Convertir la fecha de string a Date si está presente en los datos

  const parsedData = createEventSchema.parse(data);
  const convertedData = {
    ...parsedData,
    date: new Date(parsedData.date),
    startHour: new Date(parsedData.startHour),
    endHour: new Date(parsedData.endHour),
    ticketPriceMember: parsedData.ticketPriceMember.toString(),
    ticketPriceGuest: parsedData.ticketPriceGuest.toString(),
  };

  await db
    .update(event)
    .set(convertedData) // Asegura que 'date' sea del tipo correcto
    .where(eq(event.id, id)); // Devuelve el evento actualizado

  const updatedEvent = await db
    .select()
    .from(event)
    .where(eq(event.id, id));
  if (!updatedEvent.length) {
    throw new Error("Failed to update the event.");
  }

  return updatedEvent[0]; // Retorna el primer evento actualizado
};




export const getFilteredPaginated = async (filter: EventFilter) => {
  //console.log('filter', filter)
  const {
    page,
    size,
    orden,
    isActive,
    startDate,
    endDate,
    startHour,
    endHour,
    allowOutsiders,
  } = filter;

  // Validar con zod solo los campos necesarios
  const parsed = querySchemaEvents.safeParse({ page, size, orden, isActive });
  if (!parsed.success) {
    throw new Error(JSON.stringify(parsed.error.format()));
  }

  const offset = (page - 1) * size;
  const whereClauses = [];

  if (isActive === true) {
    whereClauses.push(eq(event.isActive, true));
  }

  // Aquí podrías aplicar filtros opcionales
  // Ejemplo:
  //console.log('SstartDate', startHour)
  //console.log('endDate', endHour)
  if (startDate) whereClauses.push(gte(event.date, new Date(startDate)));
  if (endDate) whereClauses.push(lte(event.date, new Date(endDate)));
  if (startHour) {
    whereClauses.push(
      sql`TIME(${event.startHour}) >= ${startHour.padEnd(8, ':00')}`
    );
  }
  if (endHour) {
    whereClauses.push(
      sql`TIME(${event.endHour}) <= ${endHour.padEnd(8, ':00')}`
    );
  }
  if (allowOutsiders) whereClauses.push(eq(event.allowOutsiders, false));
  // Puedes agregar más filtros según sea necesario
  // etc.

  const orderBy = orden === 'reciente' ? [desc(event.date)] : [asc(event.date)];

  const eventos = await db
    .select()
    .from(event)
    .where(whereClauses.length > 0 ? and(...whereClauses) : undefined)
    .orderBy(...orderBy)
    .limit(size)
    .offset(offset);

  // Aquí puedes ver la consulta SQL generada y los parámetros

  const countResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(event)
    .where(whereClauses.length > 0 ? and(...whereClauses) : undefined);

  const count = countResult && countResult[0] ? countResult[0].count : 0;
  const totalPages = Math.ceil(count / size);

  /*
  const queryObj = db
    .select()
    .from(event)
    .where(whereClauses.length > 0 ? and(...whereClauses) : undefined)
    .orderBy(...orderBy)
    .limit(size)
    .offset(offset);
  */
  //const { sql: generatedSql, params } = queryObj.toSQL();

  ////console.log('SQL Generada:', generatedSql);
  ////console.log('Parámetros:', params);


  return { eventos, totalPages };
};










































import { reservation as reservationTable, reservationInsertSchema } from "../../../db/schema/Reservation";
import { spaceDayTimeSlotForMember as spaceDayTimeSlotForMemberTable } from "../../../db/schema/SpaceDayTimeSlotForMember";
import * as notificationService from "../../notifications/application/notifications_service"



export const createNewEvent = async (
  // data: typeof billInsertSchema._input,
  // dataBillDetail: Omit<typeof billDetailInsertSchema._input, "billId">,
  // dataInscription: typeof inscriptionXUserInsertSchema._input,
  // dataReservationInscription: typeof reservationInscriptionInsertSchema._input,
  dataReservation: typeof reservationInsertSchema._input,
  dataEvent: typeof eventInsertSchemaM._input
) => {

  return await db.transaction(async (tx) => {

    // 1. Verificar si existe un evento activo con el mismo nombre
    const existingEvent = await tx
      .select()
      .from(event)
      .where(
        and(
          eq(event.name, dataEvent.name),
          eq(event.isActive, true)
        )
      );

    if (existingEvent.length > 0) {
      throw new AppError("Ya existe un evento activo con el mismo nombre.", 409);
    }



    const reservationInsertId = await tx
      .insert(reservationTable)
      .values({
        ...dataReservation,
        date: new Date(dataReservation.date), // Convierte la fecha de string a Date
        startHour: new Date(dataReservation.startHour), // Convierte la fecha de string a Date
        endHour: new Date(dataReservation.endHour), // Convierte la fecha de string a Date
      })
      .$returningId()
      .then((res) => res[0]);

    if (!reservationInsertId?.id) {
      throw new AppError("Failed to retrieve the inserted reservation ID.", 500);
    }

    const linkUrl = dataEvent.urlImage
      ? `${process.env.BACKEND_URL}/files/download/${dataEvent.urlImage}`
      : `${process.env.BACKEND_URL}/files/download/Placeholder.png`;

    const eventInsertId = await tx
      .insert(event)
      .values({
        ...dataEvent,
        date: new Date(dataEvent.date),
        startHour: new Date(dataEvent.startHour),
        endHour: new Date(dataEvent.endHour),
        reservationId: reservationInsertId.id,
        urlImage: linkUrl
      })
      .$returningId()
      .then((res) => res[0]);

    if (!eventInsertId?.id) {
      throw new AppError("Failed to retrieve the inserted eventInsertId ID.", 500);
    }












    const startOfDay = new Date(dataReservation.date);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(dataReservation.date);
    endOfDay.setUTCHours(23, 59, 59, 999);


    const start = new Date(dataReservation.startHour);
    const end = new Date(dataReservation.endHour);

    start.setSeconds(0, 0);
    end.setSeconds(0, 0);

    const overlappingSlots = await tx
      .select()
      .from(spaceDayTimeSlotForMemberTable)
      .where(
        and(
          between(spaceDayTimeSlotForMemberTable.day, startOfDay, endOfDay),
          eq(spaceDayTimeSlotForMemberTable.spaceUsed, dataReservation.spaceId),
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

    await tx.insert(spaceDayTimeSlotForMemberTable).values({
      day: new Date(dataReservation.date),
      startHour: new Date(dataReservation.startHour),
      endHour: new Date(dataReservation.endHour),
      spaceUsed: dataReservation.spaceId,
      isUsed: true,
      pricePerBlock: 0, // Usa 0 si no se proporciona precio
    });














    return {
      reservationInsertId: reservationInsertId.id,
      eventInsertId: eventInsertId.id,
    };
  });
};



export const getAllEventsSpace = () => {
  return db
    .select({
      id: event.id,
      name: event.name,
      date: event.date,
      startHour: event.startHour,
      endHour: event.endHour,
      spaceUsed: event.spaceUsed,
      ticketPriceMember: event.ticketPriceMember,
      ticketPriceGuest: event.ticketPriceGuest,
      capacity: event.capacity,
      urlImage: event.urlImage,
      isActive: event.isActive,
      description: event.description,
      allowOutsiders: event.allowOutsiders,
      numberOfAssistants: event.numberOfAssistants,
      reservationId: event.reservationId,
      spaceId: space.id,
      spaceName: space.name,
      registerCount: event.registerCount
    })
    .from(event)
    .where(eq(event.isActive, true))
    .innerJoin(reservation, eq(event.reservationId, reservation.id))
    .innerJoin(space, eq(reservation.spaceId, space.id));
};

import { eventInscription as eventInscriptionTable } from "../../../db/schema/EventInscription";
import { inscriptionXUser as inscriptionXUserTable } from "../../../db/schema/InscriptionXUser";
import { user as userTable } from "../../../db/schema/User";
import { billDetail as billDetailTable } from "../../../db/schema/BillDetail";
import { bill as billTable } from "../../../db/schema/Bill";



export const getAllInscriptions = async (idEvento: number) => {
  return await db
    .select({
      eventInscriptionId: eventInscriptionTable.id,
      nombre: userTable.name,
      apellido: userTable.lastname,
      fechaPago: billTable.createdAt,
      dni: userTable.documentID,
      correo: authTable.email,
    })
    .from(eventInscriptionTable)
    .innerJoin(inscriptionXUserTable, eq(eventInscriptionTable.inscriptionXUser, inscriptionXUserTable.id))
    .innerJoin(userTable, eq(inscriptionXUserTable.userId, userTable.id))
    .innerJoin(billDetailTable, eq(inscriptionXUserTable.id, billDetailTable.id))
    .innerJoin(billTable, eq(billDetailTable.billId, billTable.id))
    .innerJoin(authTable, eq(userTable.accountID, authTable.id))
    .where(and(
      eq(eventInscriptionTable.eventId, idEvento),
      eq(eventInscriptionTable.isCancelled, false),
      eq(inscriptionXUserTable.isCancelled, false)
    ));
};


export const deleteEventInscription = (id: number) =>
  db.update(eventInscriptionTable)
    .set({ isCancelled: true })
    .where(eq(eventInscriptionTable.id, id));



import { auth as authTable } from "../../../db/schema/Auth";
import { space as spaceTable } from "../../../db/schema/Space";

export const deleteEvent = async (id: number) => {
  let usersToNotify: { nombre: string; email: string | null }[] = [];
  let eventName: string | undefined;

  await db.transaction(async (tx) => {
    // 1. Buscar el evento
    const [eventAux] = await tx
      .select()
      .from(event)
      .where(eq(event.id, id));

    // 2. Verificar si existe
    if (!eventAux) {
      throw new AppError("Evento no encontrado", 404);
    }

    // 3. Verificar si ya fue eliminado
    if (!eventAux.isActive) {
      throw new AppError("Este evento ya fue eliminado", 400);
    }

    eventName = eventAux.name;

    const [space] = await tx
      .select()
      .from(spaceTable)
      .where(eq(spaceTable.name, eventAux.spaceUsed!)); // Asumiendo que spaceUsed no es null

    if (!space?.id) {
      throw new AppError(`No se encontró un espacio con el nombre '${eventAux.spaceUsed}'`, 404);
    }

    // 4. Marcar el evento como inactivo
    await tx
      .update(event)
      .set({ isActive: false })
      .where(eq(event.id, id));

    // 5. Eliminar registros de timeSlotForMember que coincidan con las horas
    await tx
      .delete(spaceDayTimeSlotForMemberTable)
      .where(
        and(
          eq(spaceDayTimeSlotForMemberTable.startHour, eventAux.startHour),
          eq(spaceDayTimeSlotForMemberTable.endHour, eventAux.endHour),
          eq(spaceDayTimeSlotForMemberTable.spaceUsed, space.id),
          eq(spaceDayTimeSlotForMemberTable.isUsed, true)
        )
      );

    // 6. Marcar todas las inscripciones relacionadas como canceladas

    const eventRelatedInscriptionIds = await tx
      .select({
        id: eventInscriptionTable.inscriptionXUser,
      })
      .from(eventInscriptionTable)
      .where(eq(eventInscriptionTable.eventId, id));


    usersToNotify = await tx
      .select({
        nombre: userTable.name,
        email: authTable.email,
      })
      .from(eventInscriptionTable)
      .innerJoin(inscriptionXUserTable, eq(eventInscriptionTable.inscriptionXUser, inscriptionXUserTable.id))
      .innerJoin(userTable, eq(inscriptionXUserTable.userId, userTable.id))
      .innerJoin(authTable, eq(userTable.accountID, authTable.id))
      .where(
        and(
          eq(eventInscriptionTable.eventId, id),
          eq(eventInscriptionTable.isCancelled, false)
        )
      );



    const idsToCancel = eventRelatedInscriptionIds.map((row) => row.id);

    if (idsToCancel.length > 0) {
      await tx
        .update(inscriptionXUserTable)
        .set({ isCancelled: true })
        .where(inArray(inscriptionXUserTable.id, idsToCancel));
    }

    await tx
      .update(eventInscriptionTable)
      .set({ isCancelled: true })
      .where(eq(eventInscriptionTable.eventId, id));

    // return { message: "Evento eliminado correctamente junto con los slots asociados." };

  });
  if (!eventName) {
    console.error("Nombre del evento no disponible al enviar correos.");
    return;
  }

  for (const user of usersToNotify) {
    //console.log(user)
    if (!user.email) continue;

    try {
      await notificationService.enviarCorreo({
        to: user.email,
        subject: "Cancelación de evento",
        message: `Estimado/a ${user.nombre},

Le informamos que el evento "${eventName}" ha sido cancelado.

Lamentamos los inconvenientes ocasionados. Para mayor información, puede contactarse con la administración del club.
`,
      });
    } catch (err) {
      console.error(`Error al enviar correo a ${user.email}:`, err);
    }
  }


};


export const getInfoEventInscription = async (id: number) => {
  return db
    .select({
      name: userTable.name,
      lastname: userTable.lastname,
      email: authTable.email,
    })
    .from(eventInscriptionTable)
    .innerJoin(inscriptionXUserTable, eq(eventInscriptionTable.inscriptionXUser, inscriptionXUserTable.id))
    .innerJoin(userTable, eq(inscriptionXUserTable.userId, userTable.id))
    .innerJoin(authTable, eq(userTable.accountID, authTable.id))
    .where(eq(eventInscriptionTable.id, id));
}




export const editEvent = async (
  eventoId: number,
  dataReservation: typeof reservationInsertSchema._input,
  dataEvent: typeof eventInsertSchemaM._input
) => {
  return await db.transaction(async (tx) => {
    // 1. Obtener el evento actual
    const oldEvent = await tx
      .select()
      .from(event)
      .where(eq(event.id, eventoId))
      .then(res => res[0]);

    if (!oldEvent) {
      throw new AppError("Evento no encontrado", 404);
    }

    // 2. Obtener la reservación vinculada
    const oldReservation = await tx
      .select()
      .from(reservationTable)
      .where(eq(reservationTable.id, oldEvent.reservationId))
      .then(res => res[0]);

    if (!oldReservation) {
      throw new AppError("Reservación del evento no encontrada", 404);
    }

    // 3. Eliminar slot horario vinculado (spaceDayTimeSlotForMember)
    await tx
      .delete(spaceDayTimeSlotForMemberTable)
      .where(
        and(
          eq(spaceDayTimeSlotForMemberTable.spaceUsed, oldReservation.spaceId),
          eq(spaceDayTimeSlotForMemberTable.startHour, oldReservation.startHour),
          eq(spaceDayTimeSlotForMemberTable.endHour, oldReservation.endHour),
          eq(spaceDayTimeSlotForMemberTable.isUsed, true),
        )
      );

    // 4. Insertar nueva reservación
    const newReservationId = await tx
      .insert(reservationTable)
      .values({
        ...dataReservation,
        date: new Date(dataReservation.date),
        startHour: new Date(dataReservation.startHour),
        endHour: new Date(dataReservation.endHour),
      })
      .$returningId()
      .then(res => res[0]);

    if (!newReservationId?.id) {
      throw new AppError("No se pudo crear la nueva reservación", 500);
    }













    const startOfDay = new Date(dataReservation.date);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(dataReservation.date);
    endOfDay.setUTCHours(23, 59, 59, 999);


    const start = new Date(dataReservation.startHour);
    const end = new Date(dataReservation.endHour);

    start.setSeconds(0, 0);
    end.setSeconds(0, 0);

    const overlappingSlots = await tx
      .select()
      .from(spaceDayTimeSlotForMemberTable)
      .where(
        and(
          between(spaceDayTimeSlotForMemberTable.day, startOfDay, endOfDay),
          eq(spaceDayTimeSlotForMemberTable.spaceUsed, dataReservation.spaceId),
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






























    // 5. Insertar nuevo espacio usado en ese horario
    await tx.insert(spaceDayTimeSlotForMemberTable).values({
      day: new Date(dataReservation.date),
      startHour: new Date(dataReservation.startHour),
      endHour: new Date(dataReservation.endHour),
      spaceUsed: dataReservation.spaceId,
      isUsed: true,
    });

    // 6. Actualizar el evento con nuevos datos y nueva reservación
    const linkUrl = dataEvent.urlImage
      ? `${process.env.BACKEND_URL}/files/download/${dataEvent.urlImage}`
      : `${process.env.BACKEND_URL}/files/download/Placeholder.png`;

    const eventUpdateId = await tx
      .update(event)
      .set({
        ...dataEvent,
        reservationId: newReservationId.id,
        date: new Date(dataEvent.date),
        startHour: new Date(dataEvent.startHour),
        endHour: new Date(dataEvent.endHour),
        urlImage: linkUrl,
      })
      .where(eq(event.id, eventoId))

    if (!eventUpdateId) {
      throw new AppError("No se pudo actualizar el evento", 500);
    }

    return {
      reservationUpdateId: newReservationId.id,
    };
  });
};



export const reporteEventos = async () => {
  const data = await db
    .select({
      idEvento: event.id,
      nombreEvento: event.name,
      fecha: sql`DATE(${event.date})`.as("fecha"),
      horario: sql`CONCAT(TIME_FORMAT(${event.startHour}, '%H:%i'), ' - ', TIME_FORMAT(${event.endHour}, '%H:%i'))`.as("horario"),
      lugar: event.spaceUsed,
      capacidad: event.capacity,
      inscritos: sql`COALESCE(SUM(
        CASE
          WHEN ${eventInscriptionTable.isCancelled} = false THEN 1
          ELSE 0
        END
      ), 0)`.as("inscritos"),
      asistentes: sql`COALESCE(SUM(
        CASE
          WHEN ${eventInscriptionTable.isCancelled} = false THEN 1
          ELSE 0
        END
      ), 0)`.as("asistentes"),
      tasaAsistencia: sql`COALESCE(ROUND((
        SUM(
          CASE
            WHEN ${eventInscriptionTable.isCancelled} = false THEN 1
            ELSE 0
          END
        ) / NULLIF(${event.capacity}, 0)
      ) * 100, 1), 0)`.as("tasaAsistencia"),
      precioSocio: event.ticketPriceMember,
      precioInvitado: event.ticketPriceGuest,
      ingresosEstimados: sql`COALESCE(SUM(
        CASE
          WHEN ${eventInscriptionTable.isCancelled} = false THEN ${event.ticketPriceMember}
          ELSE 0
        END
      ), 0)`.as("ingresosEstimados"),
      estado: sql`
        CASE
          WHEN ${event.isActive} = false THEN 'Cancelado'
          ELSE 'Activo'
        END
      `.as("estado"),
    })
    .from(event)
    .leftJoin(eventInscriptionTable, eq(eventInscriptionTable.eventId, event.id))
    .groupBy(
      event.id,
      event.name,
      event.date,
      event.startHour,
      event.endHour,
      event.spaceUsed,
      event.capacity,
      event.ticketPriceMember,
      event.ticketPriceGuest,
      event.isActive
    );

  return data;
};

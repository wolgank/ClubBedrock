// services/event_service.ts
import { db } from "../../../db";
import { bill as billTable, billInsertSchema, bill } from "../../../db/schema/Bill";
import { billDetail as billDetailTable, billDetailInsertSchema, billDetailStringInsertSchema, billDetail } from "../../../db/schema/BillDetail"
import { inscriptionXUser as inscriptionXUserTable, inscriptionXUserInsertSchema } from "../../../db/schema/InscriptionXUser"
import { eventInscription as eventInscriptionTable, eventInscriptionInsertSchema } from "../../../db/schema/EventInscription";
import { event as eventTable } from "../../../db/schema/Event";
import { user as userTable } from "../../../db/schema/User";
import { membershipXMember as membershipXMemberTable } from "../../../db/schema/MembershipXMember";
import { member as memberTable } from "../../../db/schema/Member";
import { memberType as memberTypeTable } from "../../../db/schema/MemberType";
import { eq, sql, and, inArray } from "drizzle-orm";
import { AppError } from "../../../shared/utils/AppError";
export const getAllEventInscription = () => db.select().from(eventInscriptionTable);

export const getEventInscriptionById = (id: number) =>
  db
    .select()
    .from(eventInscriptionTable)
    .where(eq(eventInscriptionTable.id, id))
    .then((res) => res[0]);

export const createEventInscription = async (data: typeof eventInscriptionInsertSchema._input) => {

  // Inserta el evento con los datos corregidos
  const insertId = await db
    .insert(eventInscriptionTable)
    .values({
      ...data,
      isCancelled: data.isCancelled !== undefined ? data.isCancelled : false,
    })
    .$returningId()
    .then((res) => res[0]);

  // Obtenemos el evento recién creado utilizando su ID
  if (!insertId?.id) {
    throw new Error("Failed to retrieve the inserted event inscription ID.");
  }
  const [createdEventInscription] = await db
    .select()
    .from(eventInscriptionTable)
    .where(eq(eventInscriptionTable.id, insertId.id));
  return createdEventInscription;
};

export const updateEventInscription = async (
  id: number,
  data: Partial<typeof eventInscriptionInsertSchema._input>
) => {

  await db
    .update(eventInscriptionTable)
    .set({
      ...data,
    }) // Asegura que 'date' sea del tipo correcto
    .where(eq(eventInscriptionTable.id, id));

  const updatedEventInscription = await db
    .select()
    .from(eventInscriptionTable)
    .where(eq(eventInscriptionTable.id, id));
  if (!updatedEventInscription.length) {
    throw new Error("Failed to update the event inscription.");
  }

  return updatedEventInscription[0];
};

export const deleteEvent = (id: number) =>
  db.delete(eventInscriptionTable).where(eq(eventInscriptionTable.id, id));



//====================================================================

export const createInscription = async (
  data: typeof billInsertSchema._input,
  dataBillDetails: Omit<typeof billDetailInsertSchema._input, "billId">[],
  dataInscriptions: Omit<typeof inscriptionXUserInsertSchema._input, "id">[],
  dataEventInscriptions: Omit<
    typeof eventInscriptionInsertSchema._input,
    "inscriptionXUser" | "id"
  >[],
) => {
  return await db.transaction(async (tx) => {
    try {
      // — 1. Insertar la factura —
      //console.log("Datos de la factura:", data);
      const { id: billId } = await tx
        .insert(billTable)
        .values({
          ...data,
          finalAmount: bill.finalAmount.toString(),
          createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
          dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        })
        .$returningId()
        .then((r) => r[0]!);

      // — 2. Validar longitudes —
      if (
        dataBillDetails.length !== dataInscriptions.length ||
        dataBillDetails.length !== dataEventInscriptions.length
      ) {
        throw new Error("Los arrays deben tener la misma longitud");
      }

      const details: { billDetailId: number; eventInscriptionId: number }[] = [];

      //console.log("Antes de insertar los detalles de la factura");
      //console.log("Datos de los detalles de la factura:", dataBillDetails);
      // — 3. Insertar cada conjunto de datos —
      for (let i = 0; i < dataBillDetails.length; i++) {
        // 3.1. bill_detail
        const input = {
          ...dataBillDetails[i],
          billId,
          price: String(dataBillDetails[i]?.price),
          finalPrice: String(dataBillDetails[i]?.finalPrice),
          discount: dataBillDetails[i]?.discount !== undefined ? String(dataBillDetails[i]?.discount) : undefined,
        };
        //console.log("Input a insertar en billDetail:", input);
        const parsed = billDetailStringInsertSchema.parse(input);
        //console.log("Parsed billDetail:", parsed);
        const { id: billDetailId } = await tx
          .insert(billDetailTable)
          .values({
            ...parsed,
            price: String(parsed.price),
            finalPrice: String(parsed.finalPrice),
            discount: parsed.discount !== undefined ? String(parsed.discount) : undefined,
          })
          .$returningId()
          .then((r) => r[0]!);



        // 3.2. inscription_x_user (usando billDetailId como PK=FK)

        //Tube que forsar el billDetailId ya que no lo estaba tomando

        //const inscriptionXUserParsed = inscriptionXUserInsertSchema.parse(rawInscriptionXUser);
        //NO FUNCIONABA
        const item = dataInscriptions[i];
        if (!item) throw new Error(`dataInscriptions[${i}] es undefined`);

        const rawInscriptionXUser = {
          ...item,
          id: billDetailId,
        };

        const inscriptionXUserParsed = inscriptionXUserInsertSchema.parse(rawInscriptionXUser);
        //console.log("InscriptionXUser a insertar:", inscriptionXUserParsed);
        //console.log("BillDetailId:", billDetailId);
        //console.log("RawInscriptionXUser:", rawInscriptionXUser);
        await tx
          .insert(inscriptionXUserTable)
          .values(rawInscriptionXUser)
          .execute();

        // 3.3. event_inscription

        const userId = dataInscriptions[i]?.userId;
        const eventId = dataEventInscriptions[i]?.eventId;
        if (userId === undefined || eventId === undefined) {
          throw new Error(`dataInscriptions[${i}].userId is undefined`);
        }

        const alreadyExists = await tx
          .select()
          .from(eventInscriptionTable)
          .where(
            and(
              eq(eventInscriptionTable.eventId, eventId),
              inArray(
                eventInscriptionTable.inscriptionXUser,
                tx
                  .select({ id: inscriptionXUserTable.id })
                  .from(inscriptionXUserTable)
                  .where(eq(inscriptionXUserTable.userId, userId))
              )
            )
          )
          .then((res) => res[0]);

        if (alreadyExists) {
          throw new AppError("El usuario ya está inscrito en este evento", 409);

        }

        //console.log("EventInscription a insertar:", dataEventInscriptions[i]);
        const { id: eventInscriptionId } = await tx
          .insert(eventInscriptionTable)
          .values(
            eventInscriptionInsertSchema.parse({
              ...dataEventInscriptions[i],
              inscriptionXUser: billDetailId,
            }),
          )
          .$returningId()
          .then((r) => r[0]!);

        if (!dataEventInscriptions[i]) {
          throw new Error(`dataEventInscriptions[${i}] is undefined`);
        }
        // eventId is already declared above, so just check and use it
        if (eventId === undefined) {
          throw new Error(`dataEventInscriptions[${i}].eventId is undefined`);
        }


        const eventData = await tx
          .select({ registerCount: eventTable.registerCount, capacity: eventTable.capacity })
          .from(eventTable)
          .where(eq(eventTable.id, eventId))
          .then((rows) => rows[0]);

        if (!eventData) throw new AppError(`Evento con id ${eventId} no encontrado`, 404);

        if (eventData.registerCount + 1 > eventData.capacity) {
          throw new AppError(`El evento ya alcanzó su capacidad máxima`, 409);
        }


        await tx
          .update(eventTable)
          .set({
            registerCount: sql`${eventTable.registerCount} + 1`,
          })
          .where(eq(eventTable.id, eventId));


        details.push({ billDetailId, eventInscriptionId });
      }

      // — 4. Si llegamos aquí, todo OK: Drizzle hará COMMIT automáticamente —
      return { billId, details };
    } catch (err) {
      // opcional: loguear
      console.error("Error en createInscription:", err);
      // al lanzar de nuevo, Drizzle hará ROLLBACK
      throw err;
    }
  });
};


export const cancelEventInscriptionById = async (eventInscriptionId: number) => {
  return await db.transaction(async (tx) => {
    const [eventInscription] = await tx
      .select()
      .from(eventInscriptionTable)
      .where(eq(eventInscriptionTable.id, eventInscriptionId));

    if (!eventInscription) {
      throw new AppError(`No se encontró la inscripción con ID ${eventInscriptionId}`);
    }

    const [inscriptionXUser] = await tx
      .select()
      .from(inscriptionXUserTable)
      .where(eq(inscriptionXUserTable.id, eventInscription.inscriptionXUser));

    if (!inscriptionXUser) {
      throw new AppError(`No se encontró la inscripciónXUsuario con ID ${eventInscription.inscriptionXUser}`);
    }

    if (eventInscription.isCancelled || inscriptionXUser.isCancelled) {
      throw new AppError(`La inscripción con ID ${eventInscriptionId} ya fue cancelada anteriormente.`);
    }

    const eventId = eventInscription.eventId;

    await tx
      .update(eventInscriptionTable)
      .set({ isCancelled: true })
      .where(eq(eventInscriptionTable.id, eventInscriptionId));

    await tx
      .update(inscriptionXUserTable)
      .set({ isCancelled: true })
      .where(eq(inscriptionXUserTable.id, eventInscription.inscriptionXUser));

    await tx
      .update(eventTable)
      .set({
        registerCount: sql`${eventTable.registerCount} - 1`,
      })
      .where(eq(eventTable.id, eventId));

    return { success: true, eventInscriptionId };
  });
};

// funcion para verifica si hay algien ya insrito en un evento que devuel el appError 409

/*export const areUsersInscribedInEvent = async (
  userId: number[],
  eventId: number
) => {
  // Subconsulta: usuarios con membresía en común
  const commonUserIds = await db
    .select({ id: userTable.id })
    .from(userTable)
    .innerJoin(membershipXMemberTable, eq(userTable.id, membershipXMemberTable.memberId))
    .innerJoin(memberTable, eq(userTable.id, memberTable.id))
    .innerJoin(memberTypeTable, eq(memberTable.memberTypeId, memberTypeTable.id))
    .where(
      inArray(
        membershipXMemberTable.membershipId,
        db
          .select({ membershipId: membershipXMemberTable.membershipId })
          .from(membershipXMemberTable)
          .where(eq(membershipXMemberTable.memberId, userId))
      )
    );

  const userIds = commonUserIds.map((u) => u.id);

  // Consulta principal: ver quiénes están inscritos al curso
  const results = await db
    .select({ userId: inscriptionXUserTable.userId })
    .from(eventInscriptionTable)
    .innerJoin(
      inscriptionXUserTable,
      eq(eventInscriptionTable.inscriptionXUser, inscriptionXUserTable.id) // `inscriptionXUser` es la FK
    )
    .where(
      and(
        eq(eventInscriptionTable.eventId, eventId),
        inArray(inscriptionXUserTable.userId, userIds),
        eq(inscriptionXUserTable.isCancelled, false) // Solo inscripciones activas
      )
    )

  const resultMap: Record<number, boolean> = {};
  for (const id of userIds) {
    resultMap[id] = results.some((r) => r.userId === id);
  }

  return resultMap;
};*/

export const areUsersInscribedInEvent = async (
  userId: number, // ✅ ahora es un arreglo
  eventId: number
) => {
  // Subconsulta: usuarios con membresía en común
  const commonUserIds = await db
    .select({ id: userTable.id })
    .from(userTable)
    .innerJoin(membershipXMemberTable, eq(userTable.id, membershipXMemberTable.memberId))
    .innerJoin(memberTable, eq(userTable.id, memberTable.id))
    .innerJoin(memberTypeTable, eq(memberTable.memberTypeId, memberTypeTable.id))
    .where(
      inArray(
        membershipXMemberTable.membershipId,
        db
          .select({ membershipId: membershipXMemberTable.membershipId })
          .from(membershipXMemberTable)
          .where(eq(membershipXMemberTable.memberId, userId)) // ✅ aquí usamos eq
      )
    );

  const commonIds = commonUserIds.map((u) => u.id);

  // Consulta principal: ver quiénes están inscritos al curso
  const results = await db
    .select({ userId: inscriptionXUserTable.userId })
    .from(eventInscriptionTable)
    .innerJoin(
      inscriptionXUserTable,
      eq(eventInscriptionTable.inscriptionXUser, inscriptionXUserTable.id)
    )
    .where(
      and(
        eq(eventInscriptionTable.eventId, eventId),
        inArray(inscriptionXUserTable.userId, commonIds),
        eq(inscriptionXUserTable.isCancelled, false)
      )
    );

  const resultMap: Record<number, boolean> = {};
  for (const id of commonIds) {
    resultMap[id] = results.some((r) => r.userId === id);
  }

  return resultMap;
};




export const removeInscription = async (userIds: number[], eventId: number) => {
  return await db.transaction(async (tx) => {
    // Verificar si el usuario está inscrito en el evento
    const [eventInscription] = await db
      .select({ id: inscriptionXUserTable.id })
      .from(eventInscriptionTable)
      .innerJoin(
        inscriptionXUserTable,
        eq(eventInscriptionTable.inscriptionXUser, inscriptionXUserTable.id)
      )
      .where(
        and(
          eq(eventInscriptionTable.eventId, eventId),
          inArray(inscriptionXUserTable.userId, userIds),
          eq(inscriptionXUserTable.isCancelled, false)
        )
      );

    //console.log("Event Inscription:", eventInscription);
    if (!eventInscription) {
      throw new AppError("El usuario no está inscrito en este evento", 404);
    }

    // Cancelar la inscripción
    await tx
      .update(inscriptionXUserTable)
      .set({ isCancelled: true })
      .where(eq(inscriptionXUserTable.id, eventInscription.id));

    // Actualizar el contador de inscripciones del evento
    await tx
      .update(eventTable)
      .set({
        registerCount: sql`${eventTable.registerCount} - 1`,
      })
      .where(eq(eventTable.id, eventId));

    return { success: true, eventInscriptionId: eventInscription.id };
  });
}

export const getHistoricUserId = async (id: number) => {
  try {
    if (!id || typeof id !== "number" || id <= 0) {
      throw new AppError("ID de usuario inválido", 400);
    }

    const results = await db
      .select({
        id: eventTable.id,
        name: eventTable.name,
        date: eventTable.date,
        startHour: eventTable.startHour,
        endHour: eventTable.endHour,
        allowOutsiders: eventTable.allowOutsiders,
        description: eventTable.description,
        spaceUsed: eventTable.spaceUsed,
        ticketPriceMember: eventTable.ticketPriceMember,
        ticketPriceGuest: eventTable.ticketPriceGuest,
        capacity: eventTable.capacity,
        numberOfAssistants: eventTable.numberOfAssistants,
        urlImage: eventTable.urlImage,
        registerCount: eventTable.registerCount,
      })
      .from(eventInscriptionTable)
      .innerJoin(
        eventTable,
        eq(eventInscriptionTable.eventId, eventTable.id)
      )
      .innerJoin(
        inscriptionXUserTable,
        eq(eventInscriptionTable.inscriptionXUser, inscriptionXUserTable.id)
      )
      .where(
        and(
          eq(inscriptionXUserTable.userId, id),
          eq(inscriptionXUserTable.isCancelled, false)
        )
      );
    //console.log(results);
    if (!Array.isArray(results)) {
      throw new AppError("Error inesperado al obtener los eventos", 500);
    }

    // if (results.length === 0) {
    //   throw new AppError("El usuario no tiene inscripciones activas", 404);
    // }

    return results;
  } catch (err) {
    if (err instanceof AppError) {
      throw err; // Repropaga si ya es un AppError conocido
    }

    console.error("Error inesperado en getHistoricUserId:", err);
    throw new AppError("Ocurrió un error al consultar el historial de eventos", 500);
  }
};

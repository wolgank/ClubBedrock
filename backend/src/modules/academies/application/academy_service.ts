// services/event_service.ts
import { db } from "../../../db";
import { academy as academyTable, academyInsertSchema, academy } from "../../../db/schema/Academy";
import { academyCourse as academyCourseTable, academyCourseInsertSchema } from "../../../db/schema/AcademyCourse";
import { courseTimeSlot as courseTimeSlotTable, courseTimeSlotInsertSchema } from "../../../db/schema/CourseTimeSlot";
import { eq, sql, and, inArray } from "drizzle-orm";
import { inscriptionXUser as inscriptionXUserTable } from "../../../db/schema/InscriptionXUser";
import { user as userTable } from "../../../db/schema/User";
import { academyInscription as academyInscriptionTable } from "../../../db/schema/AcademyInscription";
import { auth as authTable } from "../../../db/schema/Auth";
export const getAllAcademies = () => db.select().from(academyTable).where(eq(academyTable.isActive, true));


export const getAcademies = () => {
  return db
    .select({
      id: academyTable.id,
      name: academyTable.name,
      description: academyTable.description,
      sport: academyTable.sport,
      numeroInscritos: sql<number>`COALESCE(SUM(${academyCourseTable.registerCount}), 0)`.as("numeroInscritos"),
      numeroCursos: sql<number>`COALESCE(COUNT(${academyCourseTable.id}), 0)`.as("numeroCursos"),
    })
    .from(academyTable)
    .leftJoin(academyCourseTable, and(eq(academyCourseTable.academyId, academyTable.id), eq(academyCourseTable.isActive, 1)))
    .where(eq(academyTable.isActive, true))
    .groupBy(academyTable.id);
};

export const getAllBasicAcademyInfo = () => {
  return db
    .select({
      id: academyTable.id,
      name: academyTable.name,
      description: academyTable.description,
      sport: academyTable.sport,
      urlImage: academyTable.urlImage,
    })
    .from(academyTable)
    .where(eq(academyTable.isActive, true))
}

export const getAcademySpecialById = (academyId: number) => {
  return db
    .select({
      id: academyTable.id,
      name: academyTable.name,
      description: academyTable.description,
      sport: academyTable.sport,
      numeroInscritos: sql<number>`COALESCE(SUM(${academyCourseTable.registerCount}), 0)`.as("numeroInscritos"),
      numeroCursos: sql<number>`COALESCE(COUNT(${academyCourseTable.id}), 0)`.as("numeroCursos"),
      urlImage: academyTable.urlImage,
    })
    .from(academyTable)
    .leftJoin(academyCourseTable, eq(academyCourseTable.academyId, academyTable.id))
    .where(and(eq(academyTable.id, academyId), eq(academyTable.isActive, true)))
    .groupBy(academyTable.id)
    .then((res) => res[0]); // retorna solo el objeto de esa academia
};

export const getAcademyInscriptionById = (academyId: number) => {
  return db
    .select({
      academyInscriptionId: academyInscriptionTable.id,
      name: userTable.name,
      lastname: userTable.lastname,
      courseName: academyCourseTable.name,
      correo: authTable.email,
    })
    .from(academyCourseTable)
    .innerJoin(
      academyInscriptionTable,
      eq(academyInscriptionTable.academyCourseId, academyCourseTable.id)
    )
    .innerJoin(
      inscriptionXUserTable,
      eq(inscriptionXUserTable.id, academyInscriptionTable.inscriptionXUserId)
    )
    .innerJoin(
      userTable,
      eq(userTable.id, inscriptionXUserTable.userId)
    )
    .innerJoin(
      authTable,
      eq(authTable.id, userTable.accountID)
    )
    .where(
      and(
        eq(academyCourseTable.academyId, academyId),
        eq(academyInscriptionTable.isCancelled, false),
        eq(inscriptionXUserTable.isCancelled, false)
      ));
};


export const CancelInscription = async (inscriptionId: number) => {
  await db.transaction(async (tx) => {

    const [inscription] = await tx
      .select({
        academyCourseId: academyInscriptionTable.academyCourseId,
        inscriptionXUserId: academyInscriptionTable.inscriptionXUserId, // <-- importante
      })
      .from(academyInscriptionTable)
      .where(eq(academyInscriptionTable.id, inscriptionId));

    if (!inscription) {
      throw new Error("Inscripción no encontrada.");
    }


    await tx
      .update(academyInscriptionTable)
      .set({ isCancelled: true })
      .where(eq(academyInscriptionTable.id, inscriptionId));

    await tx
      .update(inscriptionXUserTable)
      .set({ isCancelled: true })
      .where(eq(inscriptionXUserTable.id, inscription.inscriptionXUserId));


    await tx
      .update(academyCourseTable)
      .set({
        registerCount: sql`${academyCourseTable.registerCount} - 1`
      })
      .where(eq(academyCourseTable.id, inscription.academyCourseId));
  });
};

export const getContactInfo = async (inscriptionId: number) => {
  return db
    .select({
      name: userTable.name,
      lastname: userTable.lastname,
      email: authTable.email,
    })
    .from(academyInscriptionTable)
    .innerJoin(inscriptionXUserTable, eq(academyInscriptionTable.inscriptionXUserId, inscriptionXUserTable.id))
    .innerJoin(userTable, eq(inscriptionXUserTable.userId, userTable.id))
    .innerJoin(authTable, eq(userTable.accountID, authTable.id))
    .where(eq(academyInscriptionTable.id, inscriptionId));
}

export const getAcademyById = (id: number) =>
  db
    .select()
    .from(academyTable)
    .where(eq(academyTable.id, id))
    .then((res) => res[0]);

export const createAcademy = async (data: typeof academyInsertSchema._input) => {

  const insertId = await db
    .insert(academyTable)
    .values({
      ...data,
    })
    .$returningId()
    .then((res) => res[0]);

  if (!insertId?.id) {
    throw new Error("Failed to retrieve the inserted academy ID.");
  }
  const [createdAcademy] = await db
    .select()
    .from(academyTable)
    .where(eq(academyTable.id, insertId.id));
  return createdAcademy;
};

export const updateAcademy = async (
  id: number,
  data: Partial<typeof academyInsertSchema._input>
) => {

  await db
    .update(academyTable)
    .set({
      ...data,
    }) // Asegura que 'date' sea del tipo correcto
    .where(eq(academyTable.id, id));

  const updatedAcademy = await db
    .select()
    .from(academyTable)
    .where(eq(academyTable.id, id));
  if (!updatedAcademy.length) {
    throw new Error("Failed to update the academy.");
  }

  return updatedAcademy[0];
};

export const deleteAcademy = (id: number) =>
  db.delete(academyTable).where(eq(academyTable.id, id));

export const getAllCoursesByAcademy = (academyId: number) =>
  db
    .select({
      id: academyCourseTable.id,
      name: academyCourseTable.name,
      startDate: academyCourseTable.startDate,
      endDate: academyCourseTable.endDate,
      description: academyCourseTable.description,
      capacity: academyCourseTable.capacity,
      allowOutsiders: academyCourseTable.allowOutsiders,
      isActive: academyCourseTable.isActive,
      urlImage: academyCourseTable.urlImage,
      courseType: academyCourseTable.courseType,
      academyName: academyTable.name,
      day: courseTimeSlotTable.day,
      startTime: sql`CAST(${courseTimeSlotTable.startHour} AS TIME)`.as('startTime'),
      endTime: sql`CAST(${courseTimeSlotTable.endHour} AS TIME)`.as('endTime'),
    })
    .from(academyCourseTable)
    .innerJoin(academyTable, eq(academyCourseTable.academyId, academyTable.id))
    .innerJoin(courseTimeSlotTable, eq(academyCourseTable.id, courseTimeSlotTable.academyCourseId))
    .where(eq(academyTable.id, academyId))
    .orderBy(
      academyCourseTable.id,
      courseTimeSlotTable.day,
      sql`CAST(${courseTimeSlotTable.startHour} AS TIME)`
    );






//*///////////////////////////////////////////////////////////////////////////////////////////////
//*///////////////////////////////////////////////////////////////////////////////////////////////
//*///////////////////////////////////////////////////////////////////////////////////////////////
//*/////////////////////////////////////                     /////////////////////////////////////
//*/////////////////////////////////////    ███╗   ██╗███████╗██╗    ██╗                     /////////////////////////////////////
//*/////////////////////////////////////    ████╗  ██║██╔════╝██║    ██║                     /////////////////////////////////////
//*/////////////////////////////////////    ██╔██╗ ██║█████╗  ██║ █╗ ██║                     /////////////////////////////////////
//*/////////////////////////////////////    ██║╚██╗██║██╔══╝  ██║███╗██║                     /////////////////////////////////////
//*/////////////////////////////////////    ██║ ╚████║███████╗╚███╔███╔╝                     /////////////////////////////////////
//*/////////////////////////////////////    ╚═╝  ╚═══╝╚══════╝ ╚══╝╚══╝                      /////////////////////////////////////
//*/////////////////////////////////////                     /////////////////////////////////////
//*///////////////////////////////////////////////////////////////////////////////////////////////
//*///////////////////////////////////////////////////////////////////////////////////////////////
//*///////////////////////////////////////////////////////////////////////////////////////////////

import { coursepricicing as coursepricicingTable, coursePricicingInsertSchema } from "../../../db/schema/CoursePricing";
import { addDays, isBefore, parseISO } from "date-fns";
import { reservation as reservationTable, reservationInsertSchema } from "../../../db/schema/Reservation";
import { space as spaceTable } from "../../../db/schema/Space";
import { spaceDayTimeSlotForMember as spaceDayTimeSlotForMemberTable, spaceDayTimeSlotForMemberInsertSchema } from "../../../db/schema/SpaceDayTimeSlotForMember";
import { url } from "inspector";
import { AppError } from "../../../shared/utils/AppError";
import * as notificationService from "../../notifications/application/notifications_service"

type AcademyCoursePayload = Omit<typeof academyCourseInsertSchema._input, "academyId"> & {
  dataCourseTimeSlot: Omit<typeof courseTimeSlotInsertSchema._input, "academyCourseId" | "reservationId">[];
  dataCoursePrices: typeof coursePricicingInsertSchema._input[];
};

export const createNewAcademy = async (
  dataAcademy: typeof academyInsertSchema._input,
  dataAcademyCourses: AcademyCoursePayload[]) => {

  return await db.transaction(async (tx) => {


    /**
     * Inserto primero la academia, no deberia de haber problema alguno
     */


    const linkUrl = dataAcademy.urlImage
      ? `${process.env.BACKEND_URL}/files/download/${dataAcademy.urlImage}`
      : `${process.env.BACKEND_URL}/files/download/Placeholder.png`;

    // `${process.env.BACKEND_URL}/files/download/Placeholder.png`
    //console.log(linkUrl)
    const insertAcademyId = await tx
      .insert(academyTable)
      .values({
        ...dataAcademy,
        urlImage: linkUrl,
        isActive: true,
      })
      .$returningId()
      .then((res) => res[0]);

    if (!insertAcademyId?.id) {
      throw new Error("Failed to retrieve the inserted academy ID.");
    }


    /**
     * Inserto el AcademyCourse como arreglo
     */

    for (const course of dataAcademyCourses) {

      const { dataCourseTimeSlot, dataCoursePrices, ...dataAcademyCourse } = course;

      const fullDataAcademyCourse = academyCourseInsertSchema.parse({
        ...dataAcademyCourse,
        academyId: insertAcademyId.id,
      })

      const insertAcademyCourseId = await tx
        .insert(academyCourseTable)
        .values({
          name: fullDataAcademyCourse.name,
          startDate: new Date(fullDataAcademyCourse.startDate),
          endDate: new Date(fullDataAcademyCourse.endDate),
          capacity: fullDataAcademyCourse.capacity,
          description: fullDataAcademyCourse.description,
          academyId: fullDataAcademyCourse.academyId,
          allowOutsiders: fullDataAcademyCourse.allowOutsiders,
          courseType: fullDataAcademyCourse.courseType,
          registerCount: 0
        })
        .$returningId()
        .then((res) => res[0]);

      if (!insertAcademyCourseId?.id) {
        throw new Error("Failed to retrieve the inserted AcademyCourse.");
      }

      /**
       * Un for interno, para ingresar todos los CoursePricing
       */

      //console.log("insertAcademyCourseId.id", insertAcademyCourseId.id);
      //console.log("dataCoursePrices", dataCoursePrices);

      for (const dataCoursePrice of dataCoursePrices) {
        //console.log(insertAcademyCourseId.id, dataCoursePrice)

        const fullDataCoursePrice = coursePricicingInsertSchema.parse({
          ...dataCoursePrice,
          academyCourseId: Number(insertAcademyCourseId.id),
        });

        const insertCoursePriceId = await tx
          .insert(coursepricicingTable)
          .values({
            numberDays: fullDataCoursePrice.numberDays.toString(),  //// CAMBIAR ESTO SI CAMBIAN LA BD
            inscriptionPriceMember: fullDataCoursePrice.inscriptionPriceMember,
            inscriptionPriceGuest: fullDataCoursePrice.inscriptionPriceGuest,
            academyCourseId: fullDataCoursePrice.academyCourseId!,
          })
          .$returningId()
          .then((res) => res[0]);

        if (!insertCoursePriceId?.id) {
          throw new Error("Failed to retrieve the inserted CoursePrice.");
        }
      }



      // /**
      //  * Otro for interno para el timeSlot de cursos
      //  */
      //console.log("dataCourseTimeSlot", dataCourseTimeSlot);
      for (const slot of dataCourseTimeSlot) {

        //   /**
        //    * Vamos a crear un huevo de reservaciones para el espacio deportivo usado
        //    */

        const startDate = parseISO(fullDataAcademyCourse.startDate);
        const endDate = parseISO(fullDataAcademyCourse.endDate);

        const dayMap: Record<string, number> = {
          SUNDAY: 0,
          MONDAY: 1,
          TUESDAY: 2,
          WEDNESDAY: 3,
          THURSDAY: 4,
          FRIDAY: 5,
          SATURDAY: 6,
        };

        const targetDay = dayMap[slot.day.toUpperCase()];

        let current = new Date(startDate);
        //console.log("startDate", startDate);
        //console.log("endDate", endDate);

        while (isBefore(current, endDate) || current.toDateString() === endDate.toDateString()) {
          if (current.getDay() === targetDay) {

            if (!slot.startHour || !slot.endHour) {
              throw new Error("startHour o endHour están vacíos");
            }

            const [startHstr, startMstr] = slot.startHour.split(":");
            const [endHstr, endMstr] = slot.endHour.split(":");

            const startH = Number(startHstr);
            const startM = Number(startMstr);
            const endH = Number(endHstr);
            const endM = Number(endMstr);

            if (
              Number.isNaN(startH) || Number.isNaN(startM) ||
              Number.isNaN(endH) || Number.isNaN(endM)
            ) {
              throw new Error("Formato inválido en startHour o endHour");
            }

            const startDateTime = new Date(current);
            startDateTime.setHours(startH, startM, 0, 0);

            const endDateTime = new Date(current);
            endDateTime.setHours(endH, endM, 0, 0);

            //console.log("startDateTime", startDateTime);
            //console.log("endDateTime", endDateTime);
            //console.log("slot.spaceUsed", slot.spaceUsed);

            const space = await tx
              .select()
              .from(spaceTable)
              .where(eq(spaceTable.name, slot.spaceUsed!))
              .then(res => res[0]);

            if (!space?.id) {
              throw new Error(`No se encontró un espacio con el nombre: ${slot.spaceUsed!}`);
            }


            const reservationInsertId = await tx
              .insert(reservationTable)
              .values({
                name: `Reserva de espacio para academia ${dataAcademy.name}`,
                capacity: dataAcademyCourse.capacity,
                allowOutsiders: dataAcademyCourse.allowOutsiders,
                spaceId: space.id,
                date: new Date(startDateTime),
                startHour: new Date(startDateTime),
                endHour: new Date(endDateTime),
              })
              .$returningId()
              .then((res) => res[0]);

            if (!reservationInsertId?.id) {
              throw new Error("Failed to retrieve the inserted reservation.");
            }


            const fullDataCourseTimeSlot = courseTimeSlotInsertSchema.parse({
              ...slot,
              day: slot.day.toUpperCase(),
              academyCourseId: insertAcademyCourseId.id,
              reservationId: reservationInsertId.id,
            })


            const insertCourseTimeSlotId = await tx
              .insert(courseTimeSlotTable)
              .values({
                day: fullDataCourseTimeSlot.day,
                startHour: new Date(startDateTime),
                endHour: new Date(endDateTime),
                spaceUsed: fullDataCourseTimeSlot.spaceUsed,
                reservationId: fullDataCourseTimeSlot.reservationId!,
                academyCourseId: fullDataCourseTimeSlot.academyCourseId!,
              })
              .$returningId()
              .then((res) => res[0]);

            if (!insertCourseTimeSlotId?.id) {
              throw new Error("Failed to retrieve the inserted CourseTimeSlot.");
            }


            const insertId = await tx
              .insert(spaceDayTimeSlotForMemberTable)
              .values(
                {
                  day: new Date(startDateTime),
                  startHour: new Date(startDateTime),
                  endHour: new Date(endDateTime),
                  isUsed: true,
                  spaceUsed: space.id
                })
              .$returningId()
              .then((res) => res[0]);

            if (!insertId?.id) {
              throw new Error("Failed to retrieve the inserted space time slot... ID.");
            }

          }
          current = addDays(current, 1);
        }
      }
    }
  });
};

export const createAcademySolo = async (
  dataAcademy: typeof academyInsertSchema._input,
) => {

  return await db.transaction(async (tx) => {

    // Verificar si ya existe una academia activa con el mismo nombre
    const existingActiveAcademy = await tx
      .select()
      .from(academyTable)
      .where(
        and(
          eq(academyTable.name, dataAcademy.name),
          eq(academyTable.isActive, true)
        )
      );

    if (existingActiveAcademy.length > 0) {
      throw new AppError("Ya existe una academia activa con el mismo nombre.");
    }

    const linkUrl = dataAcademy.urlImage
      ? `${process.env.BACKEND_URL}/files/download/${dataAcademy.urlImage}`
      : `${process.env.BACKEND_URL}/files/download/Placeholder.png`;

    //console.log(linkUrl)
    const insertAcademyId = await tx
      .insert(academyTable)
      .values({
        ...dataAcademy,
        urlImage: linkUrl,
        isActive: true,
      })
      .$returningId()
      .then((res) => res[0]);

    if (!insertAcademyId?.id) {
      throw new AppError("Failed to retrieve the inserted academy ID.");
    }


  });
};


export const deleteAcademyById = async (academyId: number) => {
  await db.transaction(async (tx) => {
    // Paso 0: Verificar si la academia ya está inactiva
    const existingAcademy = await tx
      .select({ isActive: academyTable.isActive })
      .from(academyTable)
      .where(eq(academyTable.id, academyId))
      .then((res) => res[0]);

    if (!existingAcademy) {
      throw new AppError("La academia no existe.", 404);
    }

    if (existingAcademy.isActive === false) {
      throw new AppError("La academia ya fue eliminada.", 400);
    }

    // Paso 1: Obtener todos los cursos de la academia
    const courses = await tx
      .select({ id: academyCourseTable.id })
      .from(academyCourseTable)
      .where(
        and(eq(academyCourseTable.academyId, academyId), eq(academyCourseTable.isActive, 1))
      );

    const courseIds = courses.map((course) => course.id);
    if (courseIds.length > 0) {


      await tx
        .update(academyCourseTable)
        .set({ isActive: 0 })
        .where(inArray(academyCourseTable.id, courseIds));

      // Paso 2: Obtener todos los time slots de esos cursos
      const slots = await tx
        .select({
          startHour: courseTimeSlotTable.startHour,
          endHour: courseTimeSlotTable.endHour,
          spaceName: courseTimeSlotTable.spaceUsed,
        })
        .from(courseTimeSlotTable)
        .where(inArray(courseTimeSlotTable.academyCourseId, courseIds));

      if (slots.length > 0) {
        const uniqueSpaceNames = [...new Set(slots.map((s) => s.spaceName))];
        const validSpaceNames = uniqueSpaceNames.filter(
          (name): name is string => name !== null && name !== undefined
        );

        const spaces = await tx
          .select({
            id: spaceTable.id,
            name: spaceTable.name,
          })
          .from(spaceTable)
          .where(inArray(spaceTable.name, validSpaceNames));

        const nameToIdMap = new Map(spaces.map((s) => [s.name, s.id]));

        // Paso 3: Eliminar coincidencias exactas en space_day_time_slot_for_member
        for (const slot of slots) {
          const spaceId = nameToIdMap.get(slot.spaceName!);
          if (!spaceId) continue;

          await tx
            .delete(spaceDayTimeSlotForMemberTable)
            .where(
              and(
                eq(spaceDayTimeSlotForMemberTable.startHour, slot.startHour),
                eq(spaceDayTimeSlotForMemberTable.endHour, slot.endHour),
                eq(spaceDayTimeSlotForMemberTable.isUsed, true),
                eq(spaceDayTimeSlotForMemberTable.spaceUsed, spaceId)
              )
            );
        }
      }


      await tx
        .delete(courseTimeSlotTable)
        .where(inArray(courseTimeSlotTable.academyCourseId, courseIds));

    }


    // Paso 5: Cancelar inscripciones asociadas
    const inscriptions = await tx
      .select({
        id: academyInscriptionTable.id,
        inscriptionXUserId: academyInscriptionTable.inscriptionXUserId,
      })
      .from(academyInscriptionTable)
      .where(
        and(
          inArray(academyInscriptionTable.academyCourseId, courseIds),
          eq(academyInscriptionTable.isCancelled, false)
        )
      );


    const inscriptionIds = inscriptions.map(i => i.id);
    const inscriptionXUserIds = inscriptions.map(i => i.inscriptionXUserId);

    if (inscriptionIds.length > 0) {
      await tx
        .update(academyInscriptionTable)
        .set({ isCancelled: true })
        .where(inArray(academyInscriptionTable.id, inscriptionIds));
    }

    if (inscriptionXUserIds.length > 0) {
      await tx
        .update(inscriptionXUserTable)
        .set({ isCancelled: true })
        .where(inArray(inscriptionXUserTable.id, inscriptionXUserIds));
    }



    // Paso 4: Marcar la academia como inactiva
    await tx
      .update(academyTable)
      .set({ isActive: false })
      .where(eq(academyTable.id, academyId));



    // Paso 6: Obtener correos y nombres de usuarios para notificar
    const usersToNotify = await tx
      .select({
        nombre: userTable.name,
        email: authTable.email,
        curso: academyCourseTable.name,
      })
      .from(academyInscriptionTable)
      .innerJoin(inscriptionXUserTable, eq(academyInscriptionTable.inscriptionXUserId, inscriptionXUserTable.id))
      .innerJoin(userTable, eq(inscriptionXUserTable.userId, userTable.id))
      .innerJoin(authTable, eq(userTable.accountID, authTable.id))
      .innerJoin(academyCourseTable, eq(academyInscriptionTable.academyCourseId, academyCourseTable.id))
      .where(inArray(academyInscriptionTable.id, inscriptionIds));

    for (const user of usersToNotify) {
      if (!user.email) continue;

      await notificationService.enviarCorreo({
        to: user.email,
        subject: 'Cancelación de inscripción a curso',
        message: `Estimado/a ${user.nombre},

Le informamos que su inscripción al curso "${user.curso}" ha sido cancelada debido a la desactivación de la academia correspondiente.

Lamentamos los inconvenientes que esto pueda ocasionar.
`,
      });
    }




  });
};


export const editAcademyById = async (
  academyId: number,
  data: { name: string; description: string; sport: string; urlImage?: string }
) => {

  const linkUrl = data.urlImage
    ? `${process.env.BACKEND_URL}/files/download/${data.urlImage}`
    : `${process.env.BACKEND_URL}/files/download/Placeholder.png`;

  //console.log(linkUrl);
  //console.log(data.urlImage);

  //console.log("data", data);
  // Verificamos si existe la academia
  const academy = await db
    .select()
    .from(academyTable)
    .where(eq(academyTable.id, academyId))
    .then((res) => res[0]);

  if (!academy) {
    throw new AppError("La academia no existe.");
  }

  // Actualizamos solo los campos permitidos
  await db
    .update(academyTable)
    .set({
      name: data.name,
      description: data.description,
      sport: data.sport,
      urlImage: linkUrl,
    })
    .where(eq(academyTable.id, academyId));
};


export const reporteAcademias = async () => {
  const data = await db
    .select({
      idAcademia: academyTable.id,
      nombreAcademia: academyTable.name,
      deporte: academyTable.sport,
      capacidadMaxima: sql`SUM(
        CASE
          WHEN ${academyCourseTable.isActive} = 1 THEN ${academyCourseTable.capacity}
          ELSE 0
        END
      )`.as("capacidadMaxima"),
      totalInscritos: sql`SUM(
        CASE
          WHEN ${inscriptionXUserTable.isCancelled} = false THEN 1
          ELSE 0
        END
      )`.as("totalInscritos"),
      tasaOcupacion: sql`
  COALESCE(ROUND(
    (
      SUM(
        CASE WHEN ${inscriptionXUserTable.isCancelled} = false THEN 1 ELSE 0 END
      ) / NULLIF(
        SUM(
          CASE WHEN ${academyCourseTable.isActive} = 1 THEN ${academyCourseTable.capacity} ELSE 0 END
        ), 0
      )
    ) * 100, 1
  ), 0)
`.as("tasaOcupacion")
      ,
      estado: sql`
        CASE
          WHEN ${academyTable.isActive} = 1 THEN 'Activa'
          ELSE 'Inactiva'
        END
      `.as("estado"),
    })
    .from(academyTable)
    .leftJoin(academyCourseTable, eq(academyCourseTable.academyId, academyTable.id))
    .leftJoin(academyInscriptionTable, eq(academyInscriptionTable.academyCourseId, academyCourseTable.id))
    .leftJoin(inscriptionXUserTable, eq(inscriptionXUserTable.id, academyInscriptionTable.inscriptionXUserId))
    .groupBy(
      academyTable.id,
      academyTable.name,
      academyTable.sport,
      academyTable.isActive
    );

  return data;
};



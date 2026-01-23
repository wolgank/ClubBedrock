// services/event_service.ts
import { db } from "../../../db";
import { academyCourse as academyCourseTable, academyCourseInsertSchema } from "../../../db/schema/AcademyCourse";
import { courseTimeSlot as courseTimeSlotTable } from "../../../db/schema/CourseTimeSlot";
import { reservation as reservationTable } from "../../../db/schema/Reservation";
import { coursepricicing, coursepricicing as coursepricicingTable } from "../../../db/schema/CoursePricing";
import { eq, and, between, gt, lt, inArray, sql } from "drizzle-orm";
import { startOfDay, addDays, isBefore, isAfter } from "date-fns";
import { getDayOfWeekNumber, getNextOrSameDay, getFirstDateForDayOfWeek } from "../../../shared/utils/dayUtils";
import { createCourseWithTimeSlotsSchema } from "../domain/courseWithTimeSlots";
import {
  selectDayAcademyInscription as selectDayAcademyInscriptionTable,
  selectDayAcademyInscriptionInsertSchema,
} from "../../../db/schema/SelectDayAcademyInscription";
import { z } from "zod";
import * as reservationService from '../../reservations/application/reservation_service';
import * as coursePricingService from '../../academies/application/course_pricing_service';
import * as notificationService from "../../notifications/application/notifications_service"

export const getAllAcademyCourse = () => db.select().from(academyCourseTable).where(eq(academyCourseTable.isActive, 1));

export const getAcademyCourseById = (id: number) =>
  db
    .select()
    .from(academyCourseTable)
    .where(eq(academyCourseTable.id, id))
    .then((res) => res[0]);


export const createCourseWithReservations = async (
  input: z.infer<typeof createCourseWithTimeSlotsSchema>
) => {
  const { academyCourse, timeSlots, coursePricingList } = input;
  //console.log("Creating course with reservations:", academyCourse, timeSlots);

  const courseId = await db.transaction(async (tx) => {
    // 1. Insertar curso
    const insertResult = await tx
      .insert(academyCourseTable)
      .values({
        ...academyCourse,
        startDate: new Date(academyCourse.startDate),
        endDate: new Date(academyCourse.endDate),
        isActive:
          academyCourse.isActive !== undefined
            ? academyCourse.isActive ? 1 : 0
            : 1,
      })
      .$returningId();

    const insertedCourse = insertResult?.[0];
    if (!insertedCourse?.id) {
      throw new Error("Failed to insert academy course or retrieve ID.");
    }

    const academyCourseId = insertedCourse.id;
    //console.log("Inserted academy course ID:", academyCourseId);

    // 2. Insertar precios del curso
    for (const pricing of coursePricingList) {
      const pricingData = {
        ...pricing,
        academyCourseId,
      };
      await coursePricingService.createCoursePricingTransaction(pricingData, tx);
    }


    const startDate = startOfDay(new Date(academyCourse.startDate));
    const endDate = startOfDay(new Date(academyCourse.endDate));

    // 2. Procesar cada slot de horario
    for (const slot of timeSlots) {
      const dow = getDayOfWeekNumber(slot.day);
      //console.log(`Processing slot for ${slot.day} (dow=${dow})`);

      let date = getFirstDateForDayOfWeek(startDate, dow);

      while (!isAfter(date, endDate)) {
        const dateStr = date.toISOString().split("T")[0];
        if (!dateStr) throw new Error("Reservation date is undefined");

        const reservationData = {
          ...slot.reservation,
          date: dateStr,
          startHour: slot.reservation.startHour,
          endHour: slot.reservation.endHour,
        };

        //console.log(`Creating reservation on ${dateStr}`);
        try {
          const reservation = await reservationService.createReservationWithTransaction(reservationData, tx);

          if (!reservation) {
            throw new Error(`Failed to create reservation for ${dateStr}`);
          }

          await tx.insert(courseTimeSlotTable).values({
            day: slot.day,
            startHour: reservation.startHour,
            endHour: reservation.endHour,
            spaceUsed: slot.spaceUsed,
            academyCourseId,
            reservationId: reservation.id,
          });
        } catch (err: any) {
          console.error(`Error creating reservation on ${dateStr}:`, err.message);
          throw {
            status: 409,
            message: `No se pudo crear la reserva el ${dateStr}: ${err.message}`,
          };
        }
        date = addDays(date, 7); // salta a la próxima semana para el mismo día
      }
    }
    return academyCourseId;
  });

  return courseId;
};






export const deleteCourseWithReservations = async (academyCourseId: number) => {
  try {
    await db.transaction(async (tx) => {
      // 1. Obtener los timeSlots vinculados al curso
      const timeSlots = await tx
        .select()
        .from(courseTimeSlotTable)
        .where(eq(courseTimeSlotTable.academyCourseId, academyCourseId));

      // 2. Eliminar reservas relacionadas
      for (const slot of timeSlots) {
        const result = await tx.delete(reservationTable).where(
          eq(reservationTable.id, slot.reservationId)
        );
        //console.log("Deleted reservation", result);
      }

      //console.log("Deleted reservations for course ID:", academyCourseId);
      // 3. Eliminar los timeSlots
      await tx.delete(courseTimeSlotTable).where(
        eq(courseTimeSlotTable.academyCourseId, academyCourseId)
      );

      // 4. Eliminar los precios del curso
      await tx.delete(coursepricicingTable).where(
        eq(coursepricicingTable.academyCourseId, academyCourseId)
      );

      // 5. Eliminar el curso
      await tx.delete(academyCourseTable).where(
        eq(academyCourseTable.id, academyCourseId)
      );
    });
  } catch (error: any) {
    console.error(`Error deleting course with ID ${academyCourseId}:`, error.message);
    throw {
      status: 500,
      message: `Error al eliminar el curso con ID ${academyCourseId}: ${error.message}`,
    };
  }
};





export const updateCourseWithReservations = async (
  academyCourseId: number,
  input: z.infer<typeof createCourseWithTimeSlotsSchema>
) => {
  const { academyCourse, timeSlots, coursePricingList } = input;

  try {
    // Primera transacción: actualizar curso, eliminar precios, eliminar reservas y timeSlots antiguos
    await db.transaction(async (tx) => {
      // 1. Actualizar datos básicos del curso
      await tx
        .update(academyCourseTable)
        .set({
          ...academyCourse,
          startDate: new Date(academyCourse.startDate),
          endDate: new Date(academyCourse.endDate),
          isActive:
            academyCourse.isActive !== undefined
              ? academyCourse.isActive ? 1 : 0
              : 1,
        })
        .where(eq(academyCourseTable.id, academyCourseId));

      // 2. Eliminar precios antiguos
      await tx.delete(coursepricicingTable).where(eq(coursepricicingTable.academyCourseId, academyCourseId));

      // 3. Obtener timeSlots antiguos para eliminar sus reservas
      const existingSlots = await tx
        .select()
        .from(courseTimeSlotTable)
        .where(eq(courseTimeSlotTable.academyCourseId, academyCourseId));

      // Eliminar reservas vinculadas a los timeSlots antiguos
      for (const slot of existingSlots) {
        if (!slot.reservationId) {
          console.warn(`No reservationId found for slot ID ${slot.id}, se omite eliminación.`);
          continue;
        }
        try {
          await tx
            .delete(reservationTable)
            .where(eq(reservationTable.id, slot.reservationId));
        } catch (err) {
          console.error(`Error eliminando reserva con ID ${slot.reservationId}:`, err);
          const errorMessage = err instanceof Error ? err.message : String(err);
          throw {
            status: 409,
            message: `Error al eliminar reserva con ID ${slot.reservationId}: ${errorMessage}`,
          };
        }
      }

      // 4. Eliminar timeSlots antiguos
      await tx.delete(courseTimeSlotTable).where(eq(courseTimeSlotTable.academyCourseId, academyCourseId));
    });

    // Segunda transacción: insertar nuevos precios, reservas y timeSlots
    await db.transaction(async (tx) => {
      // Insertar nuevos precios
      for (const pricing of coursePricingList) {
        const pricingData = {
          ...pricing,
          academyCourseId,
        };
        await coursePricingService.createCoursePricingTransaction(pricingData, tx);
      }

      // Insertar nuevos timeSlots y reservas
      const startDate = startOfDay(new Date(academyCourse.startDate));
      const endDate = startOfDay(new Date(academyCourse.endDate));

      for (const slot of timeSlots) {
        const dow = getDayOfWeekNumber(slot.day);
        let date = getFirstDateForDayOfWeek(startDate, dow);

        while (!isAfter(date, endDate)) {
          try {
            const dateStr = date.toISOString().split("T")[0];
            if (!dateStr) throw new Error("Reservation date is undefined");

            const reservationData = {
              ...slot.reservation,
              date: dateStr,
              startHour: slot.reservation.startHour,
              endHour: slot.reservation.endHour,
              capacity: academyCourse.capacity,
            };

            const reservation = await reservationService.createReservationWithTransaction(reservationData, tx);

            if (!reservation) {
              throw new Error(`Failed to create reservation for ${date.toISOString()}`);
            }

            await tx.insert(courseTimeSlotTable).values({
              day: slot.day,
              startHour: reservation.startHour,
              endHour: reservation.endHour,
              spaceUsed: slot.spaceUsed,
              academyCourseId,
              reservationId: reservation.id,
            });
          } catch (err: any) {
            console.error(`Error creating reservation on ${date.toISOString()}:`, err.message);
            throw {
              status: 409,
              message: `No se pudo crear la reserva el ${date.toISOString().split("T")[0]}: ${err.message}`,
            };
          }

          date = addDays(date, 7);
        }
      }
    });

    return academyCourseId;

  } catch (error: any) {
    console.error(`Error updating course with ID ${academyCourseId}:`, error.message || error);
    throw {
      status: error.status || 500,
      message: error.message || `Error al actualizar el curso con ID ${academyCourseId}`,
    };
  }
};





export const getCourseWithDetailsSimple = async (academyCourseId: number) => {
  return await db.transaction(async (tx) => {
    // 1. Obtener datos básicos del curso
    const academyCourseRaw = await tx
      .select({
        name: academyCourseTable.name,
        startDate: academyCourseTable.startDate,
        endDate: academyCourseTable.endDate,
        description: academyCourseTable.description,
        academyId: academyCourseTable.academyId,
        capacity: academyCourseTable.capacity,
        allowOutsiders: academyCourseTable.allowOutsiders,
        isActive: academyCourseTable.isActive,
        courseType: academyCourseTable.courseType,
      })
      .from(academyCourseTable)
      .where(eq(academyCourseTable.id, academyCourseId))
      .limit(1)
      .then(rows => rows[0]);

    if (!academyCourseRaw) {
      throw new Error(`Curso con id ${academyCourseId} no existe`);
    }

    // 2. Obtener precios del curso
    const coursePricingListRaw = await tx
      .select({
        numberDays: coursepricicingTable.numberDays,
        inscriptionPriceMember: coursepricicingTable.inscriptionPriceMember,
        inscriptionPriceGuest: coursepricicingTable.inscriptionPriceGuest,
        isActive: coursepricicingTable.isActive,
      })
      .from(coursepricicingTable)
      .where(eq(coursepricicingTable.academyCourseId, academyCourseId));

    // 3. Obtener timeSlots (sin reservar o traer reservas)
    const timeSlotsRaw = await tx
      .select({
        day: courseTimeSlotTable.day,
        startHour: courseTimeSlotTable.startHour,
        endHour: courseTimeSlotTable.endHour,
        spaceUsed: courseTimeSlotTable.spaceUsed,
        spaceId: reservationTable.spaceId,
        reservationId: courseTimeSlotTable.reservationId, // si quieres solo el ID
      })
      .from(courseTimeSlotTable)
      .innerJoin(reservationTable, eq(reservationTable.id, courseTimeSlotTable.reservationId))
      .where(eq(courseTimeSlotTable.academyCourseId, academyCourseId));

    // Si la reserva se crea automáticamente, entonces aquí puedes poner reservation = null o un objeto vacío
    const timeSlots = timeSlotsRaw.map(ts => ({
      day: ts.day,
      startHour: ts.startHour,
      endHour: ts.endHour,
      spaceUsed: ts.spaceUsed,
      spaceId: ts.spaceId,
      reservation: null, // o { id: ts.reservationId } si quieres solo el ID
    }));

    return {
      academyCourse: academyCourseRaw,
      timeSlots,
      coursePricingList: coursePricingListRaw,
    };
  });
};







export const createAcademyCourse = async (data: typeof academyCourseInsertSchema._input) => {

  const insertId = await db
    .insert(academyCourseTable)
    .values({
      ...data,
      startDate: new Date(data.startDate), // Convierte la fecha de string a Date
      endDate: new Date(data.endDate), // Convierte la fecha de string a Date
      isActive: data.isActive !== undefined ? (data.isActive ? 1 : 0) : 1, // Convierte boolean a number
    })
    .$returningId()
    .then((res) => res[0]);

  if (!insertId?.id) {
    throw new Error("Failed to retrieve the inserted academy course ID.");
  }
  const [createdAcademyCourse] = await db
    .select()
    .from(academyCourseTable)
    .where(eq(academyCourseTable.id, insertId.id));
  return createdAcademyCourse;
};

export const updateAcademyCourse = async (
  id: number,
  data: Partial<typeof academyCourseInsertSchema._input>
) => {

  await db
    .update(academyCourseTable)
    .set({
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : undefined, // Convierte la fecha de string a Date
      endDate: data.endDate ? new Date(data.endDate) : undefined, // Convierte la fecha de string a Date
      isActive: data.isActive !== undefined ? (data.isActive ? 1 : 0) : undefined, // Convierte boolean a number solo si está definido
    }) // Asegura que 'date' sea del tipo correcto
    .where(eq(academyCourseTable.id, id));

  const updatedAcademyCourse = await db
    .select()
    .from(academyCourseTable)
    .where(eq(academyCourseTable.id, id));
  if (!updatedAcademyCourse.length) {
    throw new Error("Failed to update the academy course.");
  }

  return updatedAcademyCourse[0];
};

export const deleteAcademyCourse = (id: number) =>
  db.delete(academyCourseTable).where(eq(academyCourseTable.id, id));





export const getCoursePricing = (id: number) =>
  db
    .select({
      id: coursepricicingTable.id,
      numberDays: coursepricicingTable.numberDays,
      inscriptionPriceMember: coursepricicingTable.inscriptionPriceMember,
      inscriptionPriceGuest: coursepricicingTable.inscriptionPriceGuest,
    })
    .from(coursepricicingTable)
    .innerJoin(academyCourseTable, eq(academyCourseTable.id, coursepricicingTable.academyCourseId))
    .where(eq(academyCourseTable.id, id));


export const getTimeSlotsByCourseId = (id: number) =>
  db
    .select({
      id: courseTimeSlotTable.id,
      day: courseTimeSlotTable.day,
      startHour: courseTimeSlotTable.startHour,
      endHour: courseTimeSlotTable.endHour,
      spaceUsed: courseTimeSlotTable.spaceUsed,
      reservationId: courseTimeSlotTable.reservationId,
    })
    .from(courseTimeSlotTable)
    .innerJoin(academyCourseTable, eq(academyCourseTable.id, courseTimeSlotTable.academyCourseId))
    .where(eq(courseTimeSlotTable.academyCourseId, id));




export const countsByDay = async (
  courseId: number
): Promise<{ day: DayOfTheWeek; count: number }[]> => {
  const results = await db
    .select({
      day: selectDayAcademyInscriptionTable.daySelection, // números 1-7
      count: sql<number>`COUNT(*)`.as('count')
    })
    .from(selectDayAcademyInscriptionTable)
    .innerJoin(
      academyInscriptionTable,
      eq(selectDayAcademyInscriptionTable.academyInscriptionId, academyInscriptionTable.id)
    )
    .innerJoin(inscriptionXUserTable, eq(academyInscriptionTable.inscriptionXUserId, inscriptionXUserTable.id))
    .where(and(
      eq(academyInscriptionTable.academyCourseId, courseId),
      eq(inscriptionXUserTable.isCancelled, false)
    ))
    .groupBy(selectDayAcademyInscriptionTable.daySelection);

  // Mapeamos el número al texto (1 → MONDAY, etc.)
  return results
    .map((row) => ({
      day: dayOfTheWeek[row.day - 1],
      count: row.count
    }))
    .filter((row): row is { day: DayOfTheWeek; count: number } => row.day !== undefined);
};






















































// services/event_service.ts
import { academy as academyTable, academyInsertSchema, academy } from "../../../db/schema/Academy";
import { inscriptionXUser as inscriptionXUserTable } from "../../../db/schema/InscriptionXUser";
import { user as userTable } from "../../../db/schema/User";
import { academyInscription as academyInscriptionTable } from "../../../db/schema/AcademyInscription";
import { auth as authTable } from "../../../db/schema/Auth";
import { space as spaceTable } from "../../../db/schema/Space";
import { spaceDayTimeSlotForMember as spaceDayTimeSlotForMemberTable, spaceDayTimeSlotForMemberInsertSchema } from "../../../db/schema/SpaceDayTimeSlotForMember";
import { url } from "inspector";
import { coursePricicingInsertSchema } from "../../../db/schema/CoursePricing";
import { courseTimeSlotInsertSchema } from "../../../db/schema/CourseTimeSlot";
import { parseISO } from "date-fns";
import { AppError } from "../../../shared/utils/AppError";
import  { dayOfTheWeek ,type DayOfTheWeek } from "../../../shared/enums/DayOfTheWeek";

type AcademyCoursePayload = Omit<typeof academyCourseInsertSchema._input, "academyId"> & {
  dataCourseTimeSlot: Omit<typeof courseTimeSlotInsertSchema._input, "academyCourseId" | "reservationId">[];
  dataCoursePrices: typeof coursePricicingInsertSchema._input[];
};

export const addCoursesByAcademyId = async (
  academyId: number,
  course: AcademyCoursePayload) => {

  return await db.transaction(async (tx) => {

    /**
     * Inserto el AcademyCourse como arreglo
     */

    const [academy] = await tx
      .select()
      .from(academyTable)
      .where(and(
        eq(academyTable.id, academyId),
        eq(academyTable.isActive, true)
      ));

    if (!academy) {
      throw new AppError("Academy not found or inactive", 404);
    }


    const linkUrl = course.urlImage
      ? `${process.env.BACKEND_URL}/files/download/${course.urlImage}`
      : `${process.env.BACKEND_URL}/files/download/Placeholder.png`;

    const { dataCourseTimeSlot, dataCoursePrices, ...dataAcademyCourse } = course;

    const fullDataAcademyCourse = academyCourseInsertSchema.parse({
      ...dataAcademyCourse,
      academyId: academyId, // Asegúrate de que academyId esté definido
    })


    //console.log("fullDataAcademyCourse", fullDataAcademyCourse);
    //console.log("dataCoursePrices", dataCoursePrices);
    //console.log("dataCourseTimeSlot", dataCourseTimeSlot);


    const existingCourse = await tx
      .select()
      .from(academyCourseTable)
      .where(
        and(
          eq(academyCourseTable.academyId, academyId),
          eq(academyCourseTable.name, fullDataAcademyCourse.name),
          eq(academyCourseTable.isActive, 1)
        )
      )
      .then(res => res[0]);


    if (existingCourse) {
      throw new AppError(
        `Ya existe un curso con el nombre "${fullDataAcademyCourse.name}" en esta academia.`,
        400
      );
    }


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
        registerCount: 0,
        urlImage: linkUrl,
      })
      .$returningId()
      .then((res) => res[0]);

    if (!insertAcademyCourseId?.id) {
      throw new AppError("Failed to retrieve the inserted AcademyCourse.", 500);
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
        throw new AppError("Failed to retrieve the inserted CoursePrice.", 500);
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
            throw new AppError("startHour o endHour están vacíos", 500);
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
            throw new AppError("Formato inválido en startHour o endHour", 500);
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
            throw new AppError(`No se encontró un espacio con el nombre: ${slot.spaceUsed!}`, 500);
          }


          const reservationInsertId = await tx
            .insert(reservationTable)
            .values({
              name: `Reserva de espacio para academia ${academy.name}`,
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
            throw new AppError("Failed to retrieve the inserted reservation.", 500);
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
            throw new AppError("Failed to retrieve the inserted CourseTimeSlot.", 500);
          }








          const startOfDay = new Date(startDateTime);
          startOfDay.setUTCHours(0, 0, 0, 0);

          const endOfDay = new Date(startDateTime);
          endOfDay.setUTCHours(23, 59, 59, 999);


          const start = new Date(startDateTime);
          const end = new Date(endDateTime);

          start.setSeconds(0, 0);
          end.setSeconds(0, 0);

          const overlappingSlots = await tx
            .select()
            .from(spaceDayTimeSlotForMemberTable)
            .where(
              and(
                between(spaceDayTimeSlotForMemberTable.day, startOfDay, endOfDay),
                eq(spaceDayTimeSlotForMemberTable.spaceUsed, space.id),
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
              `Conflicto con una reserva existente del espacio '${space.name}': ${current.toDateString()} : ${start} - ${end}.`,
              501
            );
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
            throw new AppError("Failed to retrieve the inserted space time slot... ID.", 500);
          }

        }
        current = addDays(current, 1);
      }
    }

  });
};




export type CourseWithSchedules = {
  name?: string;
  capacity?: number;
  allowOutsiders?: boolean;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  courseType?: string;
  schedules: Schedule[];
  prices: PriceEntry[];
  registerCount?: number;
  urlImage?: string;
};

export type Schedule = {
  day: string;
  startHour: string;
  endHour: string;
  spaceUsed: string;
};

export type PriceEntry = {
  numberDays: number;
  inscriptionPriceMember: string;
  inscriptionPriceGuest: string;
};

export const getCoursesByAcademyId = async (academyId: number): Promise<CourseWithSchedules[]> => {
  const courses = await db.select().from(academyCourseTable).where(and(eq(academyCourseTable.academyId, academyId), eq(academyCourseTable.isActive, 1)));

  const result: CourseWithSchedules[] = [];

  for (const course of courses) {
    const prices = await db.select().from(coursepricicingTable).where(and(eq(coursepricicingTable.academyCourseId, course.id), eq(coursepricicingTable.isActive, true)));
    const courseSchedules = await db.select().from(courseTimeSlotTable).where(eq(courseTimeSlotTable.academyCourseId, course.id));


    const uniqueSchedules: Schedule[] = Array.from(
      new Map(
        courseSchedules.map((slot) => {
          const start = slot.startHour.toTimeString().slice(0, 5); // HH:MM
          const end = slot.endHour.toTimeString().slice(0, 5);     // HH:MM
          const key = `${slot.day}-${start}-${end}-${slot.spaceUsed}`;
          return [key, slot];
        })
      ).values()
    ).map((slot) => ({
      day: slot.day,
      startHour: slot.startHour.toTimeString().slice(0, 5),
      endHour: slot.endHour.toTimeString().slice(0, 5),
      spaceUsed: slot.spaceUsed ?? "Desconocido",
    }));


    result.push({
      name: course.name,
      capacity: course.capacity,
      allowOutsiders: course.allowOutsiders,
      description: course.description || "",
      startDate: course.startDate,
      endDate: course.endDate,
      courseType: course.courseType || "UNKNOWN",
      schedules: uniqueSchedules,
      registerCount: course.registerCount,
      urlImage: course.urlImage || "UNKNOWN",
      prices: prices.map((p) => ({
        numberDays: Number(p.numberDays),
        inscriptionPriceMember: p.inscriptionPriceMember,
        inscriptionPriceGuest: p.inscriptionPriceGuest,
      })),
    });
  }

  return result;
};

const getUserEmailsByInscriptionXUserIds = async (ids: number[]) => {
  return db
    .select({
      email: authTable.email,
      name: userTable.name,
      lastname: userTable.lastname,
    })
    .from(inscriptionXUserTable)
    .innerJoin(userTable, eq(userTable.id, inscriptionXUserTable.userId))
    .innerJoin(authTable, eq(userTable.accountID, authTable.id))
    .where(inArray(inscriptionXUserTable.id, ids));
};


export const removeCourse = async (
  idAcademy: number,
  courseName: string
) => {

  let inscriptionXUserIds: number[] = [];

  await db.transaction(async (tx) => {
    // Paso 1: Buscar el curso activo por nombre y academia
    const course = await tx
      .select({ id: academyCourseTable.id })
      .from(academyCourseTable)
      .where(
        and(
          eq(academyCourseTable.academyId, idAcademy),
          eq(academyCourseTable.name, courseName),
          eq(academyCourseTable.isActive, 1)
        )
      )
      .then((res) => res[0]);

    if (!course) {
      throw new AppError("Curso no encontrado o ya fue eliminado", 404);
    }

    const courseId = course.id;

    // Paso 2: Obtener los time slots del curso
    const slots = await tx
      .select({
        startHour: courseTimeSlotTable.startHour,
        endHour: courseTimeSlotTable.endHour,
        spaceName: courseTimeSlotTable.spaceUsed,
      })
      .from(courseTimeSlotTable)
      .where(eq(courseTimeSlotTable.academyCourseId, courseId));

    if (slots.length > 0) {
      const uniqueSpaceNames = [...new Set(slots.map((s) => s.spaceName))];
      const validSpaceNames = uniqueSpaceNames.filter(
        (name): name is string => name !== null && name !== undefined
      );

      const spaces = await tx
        .select({ id: spaceTable.id, name: spaceTable.name })
        .from(spaceTable)
        .where(inArray(spaceTable.name, validSpaceNames));

      const nameToIdMap = new Map(spaces.map((s) => [s.name, s.id]));

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

      // Eliminar los time slots del curso
      await tx
        .delete(courseTimeSlotTable)
        .where(eq(courseTimeSlotTable.academyCourseId, courseId));
    }

    // Paso 3: Cancelar inscripciones relacionadas
    const inscriptions = await tx
      .select({
        id: academyInscriptionTable.id,
        inscriptionXUserId: academyInscriptionTable.inscriptionXUserId,
      })
      .from(academyInscriptionTable)
      .where(and(eq(academyInscriptionTable.academyCourseId, courseId), eq(academyInscriptionTable.isCancelled, false)));

    const inscriptionIds = inscriptions.map((i) => i.id);
    inscriptionXUserIds = inscriptions.map((i) => i.inscriptionXUserId);

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

    // Paso 4: Desactivar el curso
    await tx
      .update(academyCourseTable)
      .set({ isActive: 0 })
      .where(eq(academyCourseTable.id, courseId));
  });
  // ✉️ Paso 5: Obtener emails y enviar notificaciones
  if (inscriptionXUserIds.length > 0) {
    const users = await getUserEmailsByInscriptionXUserIds(inscriptionXUserIds);

    for (const user of users) {
      if (!user.email) continue;

      await notificationService.enviarCorreo({
        to: user.email,
        subject: "Cancelación de curso",
        message: `Estimado/a ${user.name} ${user.lastname},

Le informamos que su inscripción al curso "${courseName}" ha sido cancelada debido a una desactivación del curso.

De ser necesario, podrá inscribirse en una nueva edición o contactar al equipo académico.

Saludos cordiales,
Equipo de la Academia`
      });
    }
  }
};







































export const editCourseById = async (
  academyId: number,
  courseName: string,
  course: AcademyCoursePayload
) => {

  let usersToNotify: { nombre: string; email: string | null }[] = [];

  await db.transaction(async (tx) => {
    // 1. Buscar el curso activo por nombre y academia
    const courseRecord = await tx
      .select({ id: academyCourseTable.id })
      .from(academyCourseTable)
      .where(
        and(
          eq(academyCourseTable.academyId, academyId),
          eq(academyCourseTable.name, courseName),
          eq(academyCourseTable.isActive, 1)
        )
      )
      .then((res) => res[0]);

    if (!courseRecord) {
      throw new AppError("Curso no encontrado o inactivo", 404);
    }

    const courseId = courseRecord.id;

    // 2. Obtener todos los time slots del curso
    const slots = await tx
      .select({
        startHour: courseTimeSlotTable.startHour,
        endHour: courseTimeSlotTable.endHour,
        spaceName: courseTimeSlotTable.spaceUsed,
      })
      .from(courseTimeSlotTable)
      .where(eq(courseTimeSlotTable.academyCourseId, courseId));

    // 3. Eliminar coincidencias en space_day_time_slot_for_member
    if (slots.length > 0) {
      const uniqueSpaces = [...new Set(slots.map((s) => s.spaceName))];
      const validSpaces = uniqueSpaces.filter((s): s is string => !!s);

      const spaceMap = await tx
        .select({ id: spaceTable.id, name: spaceTable.name })
        .from(spaceTable)
        .where(inArray(spaceTable.name, validSpaces));

      const nameToIdMap = new Map(spaceMap.map((s) => [s.name, s.id]));

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

    // 4. Cancelar inscripciones del curso
    const inscriptions = await tx
      .select({
        id: academyInscriptionTable.id,
        inscriptionXUserId: academyInscriptionTable.inscriptionXUserId,
      })
      .from(academyInscriptionTable)
      .where(and(eq(academyInscriptionTable.academyCourseId, courseId), eq(academyInscriptionTable.isCancelled, false)));

    const inscriptionIds = inscriptions.map((i) => i.id);
    const inscriptionXUserIds = inscriptions.map((i) => i.inscriptionXUserId);

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

    // 5. Eliminar todos los courseTimeSlots de este curso
    await tx
      .delete(courseTimeSlotTable)
      .where(eq(courseTimeSlotTable.academyCourseId, courseId));

    // 6. Marcar como inactivo el curso HAGO COMO QUE ESTA MUERTO
    await tx
      .update(academyCourseTable)
      .set({ isActive: 0 })
      .where(eq(academyCourseTable.id, courseId));

    await tx
      .delete(coursepricicingTable)
      .where(eq(coursepricicingTable.academyCourseId, courseId));










    if (inscriptionXUserIds.length > 0) {
      usersToNotify = await tx
        .select({
          nombre: userTable.name,
          email: authTable.email,
        })
        .from(inscriptionXUserTable)
        .innerJoin(userTable, eq(inscriptionXUserTable.userId, userTable.id))
        .innerJoin(authTable, eq(userTable.accountID, authTable.id))
        .where(
          inArray(inscriptionXUserTable.id, inscriptionXUserIds)
        )
    }

































    /**
       * Inserto el AcademyCourse como arreglo
       */

    const [academy] = await tx
      .select()
      .from(academyTable)
      .where(and(
        eq(academyTable.id, academyId),
        eq(academyTable.isActive, true)
      ));

    if (!academy) {
      throw new AppError("Academy not found or inactive", 404);
    }


    const linkUrl = course.urlImage
      ? `${process.env.BACKEND_URL}/files/download/${course.urlImage}`
      : `${process.env.BACKEND_URL}/files/download/Placeholder.png`;

    const { dataCourseTimeSlot, dataCoursePrices, ...dataAcademyCourse } = course;

    const fullDataAcademyCourse = academyCourseInsertSchema.parse({
      ...dataAcademyCourse,
      academyId: academyId, // Asegúrate de que academyId esté definido
    })


    //console.log("fullDataAcademyCourse", fullDataAcademyCourse);
    //console.log("dataCoursePrices", dataCoursePrices);
    //console.log("dataCourseTimeSlot", dataCourseTimeSlot);


    const existingCourse = await tx
      .select()
      .from(academyCourseTable)
      .where(
        and(
          eq(academyCourseTable.academyId, academyId),
          eq(academyCourseTable.name, fullDataAcademyCourse.name),
          eq(academyCourseTable.isActive, 1)
        )
      )
      .then(res => res[0]);


    if (existingCourse) {
      throw new AppError(
        `Ya existe un curso con el nombre "${fullDataAcademyCourse.name}" en esta academia.`,
        400
      );
    }


    await tx
      .update(academyCourseTable)
      .set({
        name: fullDataAcademyCourse.name,
        startDate: new Date(fullDataAcademyCourse.startDate),
        endDate: new Date(fullDataAcademyCourse.endDate),
        capacity: fullDataAcademyCourse.capacity,
        description: fullDataAcademyCourse.description,
        academyId: fullDataAcademyCourse.academyId,
        allowOutsiders: fullDataAcademyCourse.allowOutsiders,
        courseType: fullDataAcademyCourse.courseType,
        registerCount: 0,
        urlImage: linkUrl,
        isActive: 1,
      })
      .where(eq(academyCourseTable.id, courseId))

    /**
     * Un for interno, para ingresar todos los CoursePricing
     */

    //console.log("insertAcademyCourseId.id", courseId);
    //console.log("dataCoursePrices", dataCoursePrices);

    for (const dataCoursePrice of dataCoursePrices) {
      //console.log(courseId, dataCoursePrice)

      const fullDataCoursePrice = coursePricicingInsertSchema.parse({
        ...dataCoursePrice,
        academyCourseId: Number(courseId),
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
        throw new AppError("Failed to retrieve the inserted CoursePrice.", 500);
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
            throw new AppError("startHour o endHour están vacíos", 500);
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
            throw new AppError("Formato inválido en startHour o endHour", 500);
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
            throw new AppError(`No se encontró un espacio con el nombre: ${slot.spaceUsed!}`, 500);
          }


          const reservationInsertId = await tx
            .insert(reservationTable)
            .values({
              name: `Reserva de espacio para academia ${academy.name}`,
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
            throw new AppError("Failed to retrieve the inserted reservation.", 500);
          }


          const fullDataCourseTimeSlot = courseTimeSlotInsertSchema.parse({
            ...slot,
            day: slot.day.toUpperCase(),
            academyCourseId: courseId,
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
            throw new AppError("Failed to retrieve the inserted CourseTimeSlot.", 500);
          }








          const startOfDay = new Date(startDateTime);
          startOfDay.setUTCHours(0, 0, 0, 0);

          const endOfDay = new Date(startDateTime);
          endOfDay.setUTCHours(23, 59, 59, 999);


          const start = new Date(startDateTime);
          const end = new Date(endDateTime);

          start.setSeconds(0, 0);
          end.setSeconds(0, 0);

          const overlappingSlots = await tx
            .select()
            .from(spaceDayTimeSlotForMemberTable)
            .where(
              and(
                between(spaceDayTimeSlotForMemberTable.day, startOfDay, endOfDay),
                eq(spaceDayTimeSlotForMemberTable.spaceUsed, space.id),
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
              `Conflicto con una reserva existente del espacio '${space.name}': ${current.toDateString()} : ${start} - ${end}.`,
              501
            );
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
            throw new AppError("Failed to retrieve the inserted space time slot... ID.", 500);
          }

        }
        current = addDays(current, 1);
      }
    }



  })
  for (const user of usersToNotify) {
    if (!user.email) continue;

    try {
      await notificationService.enviarCorreo({
        to: user.email,
        subject: "Cancelación de inscripción al curso",
        message: `Estimado/a ${user.nombre},

Le informamos que su inscripción al curso "${courseName}" ha sido cancelada debido a una reprogramación de horarios.

El monto abonado será reembolsado en su totalidad. Si desea volver a inscribirse en otra edición del curso, puede hacerlo libremente.

Lamentamos los inconvenientes ocasionados. Para cualquier consulta adicional, no dude en comunicarse con el área de deportes.`,
      });
    } catch (err) {
      console.error(`Error al enviar correo a ${user.email}:`, err);
    }
  }

};

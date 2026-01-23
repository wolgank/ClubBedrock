// services/event_service.ts
import { db } from "../../../db";
import {
  academyInscription as academyInscriptionTable,
  academyInscriptionInsertSchema,
  academyInscription,
} from "../../../db/schema/AcademyInscription";
import {
  bill as billTable,
  billInsertSchema,
  bill,
} from "../../../db/schema/Bill";
import {
  billDetail as billDetailTable,
  billDetailInsertSchema,
  billDetailStringInsertSchema,
  billDetail,
} from "../../../db/schema/BillDetail";
import {
  inscriptionXUser as inscriptionXUserTable,
  inscriptionXUserInsertSchema,
} from "../../../db/schema/InscriptionXUser";
import {
  selectDayAcademyInscription as selectDayAcademyInscriptionTable,
  selectDayAcademyInscriptionInsertSchema,
} from "../../../db/schema/SelectDayAcademyInscription"; // Asegúrate de que la ruta es correcta
import { academyCourse as academyCourseTable } from "../../../db/schema/AcademyCourse";
import { courseTimeSlot as courseTimeSlotTable } from "../../../db/schema/CourseTimeSlot";
import { coursepricicing as coursePricingTable } from "../../../db/schema/CoursePricing";
import { user as userTable } from "../../../db/schema/User";
import { membershipXMember as membershipXMemberTable } from "../../../db/schema/MembershipXMember";
import { member as memberTable } from "../../../db/schema/Member";
import { memberType as memberTypeTable } from "../../../db/schema/MemberType";
import { eq, sql, and, inArray, or } from "drizzle-orm";
import * as academyCourseService from '../application/academy_course_service';
import { alias } from "drizzle-orm/mysql-core";
import { AppError } from "../../../shared/utils/AppError";
import type { Result } from "drizzle-orm/sqlite-core";
import { academy } from "../../../db/schema/Academy";
import { dayOfTheWeek } from '../../../shared/enums/DayOfTheWeek';
export const getAllAcademyInscription = () =>
  db.select().from(academyInscriptionTable);

export const getAcademyInscriptionById = (id: number) =>
  db
    .select()
    .from(academyInscriptionTable)
    .where(eq(academyInscriptionTable.id, id))
    .then((res) => res[0]);

export const createAcademyInscription = async (
  data: typeof academyInscriptionInsertSchema._input
) => {
  const insertId = await db
    .insert(academyInscriptionTable)
    .values({
      ...data,
    })
    .$returningId()
    .then((res) => res[0]);

  if (!insertId?.id) {
    throw new Error("Failed to retrieve the inserted academy Inscription ID.");
  }
  const [createdAcademyInscription] = await db
    .select()
    .from(academyInscriptionTable)
    .where(eq(academyInscriptionTable.id, insertId.id));
  return createAcademyInscription;
};

export const updateAcademyInscription = async (
  id: number,
  data: Partial<typeof academyInscriptionInsertSchema._input>
) => {
  await db
    .update(academyInscriptionTable)
    .set({
      ...data,
    }) // Asegura que 'date' sea del tipo correcto
    .where(eq(academyInscriptionTable.id, id));

  const updatedAcademyInscription = await db
    .select()
    .from(academyInscriptionTable)
    .where(eq(academyInscriptionTable.id, id));
  if (!updateAcademyInscription.length) {
    throw new Error("Failed to update the academy Inscription.");
  }

  return updatedAcademyInscription[0];
};

export const deleteAcademyInscriptionsByCourseAndUsers = async (
  courseId: number,
  userIds: number[]
): Promise<{
  length: number;
  rowCount: number;
  deletedCount: number;
}> => {
  // Paso 1: buscar los IDs de inscripciones válidas (no canceladas)
  const inscriptionsToDelete = await db
    .select({ id: inscriptionXUserTable.id })
    .from(academyInscriptionTable)
    .innerJoin(
      inscriptionXUserTable,
      eq(academyInscriptionTable.inscriptionXUserId, inscriptionXUserTable.id)
    )
    .where(
      and(
        eq(academyInscriptionTable.academyCourseId, courseId),
        inArray(inscriptionXUserTable.userId, userIds),
        eq(inscriptionXUserTable.isCancelled, false) // Solo inscripciones activas
      )
    );

  const ids = inscriptionsToDelete.map((r) => r.id);
  //console.log("IDs to delete:", ids);

  // Paso 2: Si no hay inscripciones válidas, lanzar error
  if (ids.length === 0) {
    throw new AppError(
      "Ninguno de los usuarios está inscrito activamente en este curso.",
      400
    );
  }

  // Paso 3: marcar como canceladas
  const deleteResult = await db
    .update(inscriptionXUserTable)
    .set({
      isCancelled: true,
    })
    .where(inArray(inscriptionXUserTable.id, ids))
    .execute();

  // Paso 4: actualizar contador del curso
  await db
    .update(academyCourseTable)
    .set({
      registerCount: sql`${academyCourseTable.registerCount} - ${ids.length}`,
    })
    .where(eq(academyCourseTable.id, courseId));

  // Paso 5: retornar resultado
  return {
    length: ids.length,
    rowCount: ids.length,
    deletedCount: ids.length,
  };
};

export const createInscription = async (
  data: typeof billInsertSchema._input,
  dataBillDetails: Omit<typeof billDetailInsertSchema._input, "billId">[],
  dataInscriptions: Omit<typeof inscriptionXUserInsertSchema._input, "id">[],
  dataAcademyCourseInscriptions: Omit<
    typeof academyInscriptionInsertSchema._input,
    "inscriptionXUserId" | "id"
  >[],
  dataDaySelections: number[][] | undefined
): Promise<{
  billId: number;
  details: { billDetailId: number; academyCourseInscriptionId: number }[];
}> => {
  return await db.transaction(async (tx) => {
    // 1. Validaciones básicas
    if (
      dataBillDetails.length === 0 ||
      dataInscriptions.length === 0 ||
      dataAcademyCourseInscriptions.length === 0
    ) {
      throw new AppError("No se recibieron datos para la inscripción.", 400);
    }

    if (
      dataBillDetails.length !== dataInscriptions.length ||
      dataBillDetails.length !== dataAcademyCourseInscriptions.length
    ) {
      throw new AppError("Los arrays deben tener la misma longitud.", 400);
    }
    //console.log("dataDaySelections  en el controller", dataDaySelections);
    // 2. Insertar la factura
    const { id: billId } = await tx
      .insert(billTable)
      .values({
        ...data,
        finalAmount: data.finalAmount.toString(),
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      })
      .$returningId()
      .then((r) => r[0]!);

    const details: {
      billDetailId: number;
      academyCourseInscriptionId: number;
    }[] = [];

    // 3. Procesar cada inscripción
    for (let i = 0; i < dataBillDetails.length; i++) {
      const billDetailItem = dataBillDetails[i];
      const inscriptionItem = dataInscriptions[i];
      const academyInscriptionItem = dataAcademyCourseInscriptions[i];

      if (!billDetailItem || !inscriptionItem || !academyInscriptionItem) {
        throw new AppError(`Faltan datos en el índice ${i}`, 400);
      }

      // 3.1 Insertar detalle de factura
      const billDetailInput = billDetailStringInsertSchema.parse({
        ...billDetailItem,
        billId,
        price: String(billDetailItem.price),
        finalPrice: String(billDetailItem.finalPrice),
        discount:
          billDetailItem.discount !== undefined
            ? String(billDetailItem.discount)
            : undefined,
      });

      const { id: billDetailId } = await tx
        .insert(billDetailTable)
        .values(billDetailInput)
        .$returningId()
        .then((r) => r[0]!);

      // 3.2 Insertar inscripción del usuario
      const inscriptionInput = inscriptionXUserInsertSchema.parse({
        ...inscriptionItem,
        id: billDetailId,
      });

      await tx
        .insert(inscriptionXUserTable)
        .values({ ...inscriptionInput, id: billDetailId })
        .execute();

      // 3.3 Insertar inscripción a curso académico
      const parsedAcademyInscription = academyInscriptionInsertSchema.parse({
        ...academyInscriptionItem,
        inscriptionXUserId: billDetailId,
      });

      const { id: academyCourseInscriptionId } = await tx
        .insert(academyInscriptionTable)
        .values(parsedAcademyInscription)
        .$returningId()
        .then((r) => r[0]!);

      const courseId = academyInscriptionItem.academyCourseId;
      if (!courseId) {
        throw new AppError(`El curso en la inscripción ${academyInscriptionItem.academyCourseId} no tiene ID.`, 400);
      }

      // 3.4 Validar si el curso es flexible y procesar días seleccionados
      const courseData = await tx
        .select({
          courseType: academyCourseTable.courseType,
          registerCount: academyCourseTable.registerCount,
          capacity: academyCourseTable.capacity,
        })
        .from(academyCourseTable)
        .where(eq(academyCourseTable.id, courseId))
        .then((rows) => rows[0]);

      if (!courseData) {
        throw new AppError(`Curso con ID ${courseId} no encontrado.`, 404);
      }

      const isFlexible = courseData.courseType === "FLEXIBLE";

      try {
        if (isFlexible) {
          const days = dataDaySelections?.[i];

          if (!days || days.length === 0) {
            throw new AppError(
              `Debe seleccionar días para el curso flexible en el índice ${inscriptionItem.userId}.`,
              400
            );
          }

          for (const day of days) {
            if (day < 1 || day > 7) {
              throw new AppError(
                `Día inválido (${day}) en el índice ${inscriptionItem.userId}.`,
                400
              );
            }

            const countForDay = await tx
              .select({ count: sql<number>`COUNT(*)` })
              .from(selectDayAcademyInscriptionTable)
              .innerJoin(
                academyInscriptionTable,
                eq(selectDayAcademyInscriptionTable.academyInscriptionId, academyInscriptionTable.id)
              )
              .innerJoin(
                inscriptionXUserTable,
                eq(academyInscriptionTable.inscriptionXUserId, inscriptionXUserTable.id)
              )
              .where(
                and(
                  eq(academyInscriptionTable.academyCourseId, courseId),
                  eq(selectDayAcademyInscriptionTable.daySelection, day),
                  eq(inscriptionXUserTable.isCancelled, false) // Solo inscripciones activas
                )
              )
              .then((rows) => rows[0]?.count ?? 0);


            if (countForDay + 1 > courseData.capacity) {
              throw new AppError(
                `El curso flexible ya alcanzó su capacidad para el día ${dayOfTheWeek[day-1]} (usuario ${inscriptionItem.userId}).`,
                409
              );
            }

            const parsedDay = selectDayAcademyInscriptionInsertSchema.parse({
              academyInscriptionId: academyCourseInscriptionId,
              daySelection: day,
            });

            await tx.insert(selectDayAcademyInscriptionTable).values(parsedDay);
          }
        } else {
          const days = dataDaySelections?.[i];
          if (days && days.length > 0) {
            throw new AppError(
              `No debe seleccionar días para el curso fijo en el índice ${inscriptionItem.userId}.`,
              400
            );
          }
        }
      } catch (error) {
        throw new AppError(
          `Error al procesar los días seleccionados en el usuario ${inscriptionItem.userId}: ${error instanceof Error ? error.message : String(error)
          }`,
          400
        );
      }

      // 3.6 Validar capacidad del curso

      const academyCourseData = await tx
        .select({ registerCount: academyCourseTable.registerCount, capacity: academyCourseTable.capacity })
        .from(academyCourseTable)
        .where(eq(academyCourseTable.id, courseId))
        .then((rows) => rows[0]);

      if (!academyCourseData) throw new AppError(`Curso con id ${courseId} no encontrado`, 404);

      if (!isFlexible) {
        if (academyCourseData.registerCount + 1 > academyCourseData.capacity) {
          throw new AppError(`El curso fijo ya alcanzó su capacidad máxima`, 409);
        }
      }

      // 3.6 Actualizar contador de inscritos en el curso
      await tx
        .update(academyCourseTable)
        .set({
          registerCount: sql`${academyCourseTable.registerCount} + 1`,
        })
        .where(eq(academyCourseTable.id, courseId));

      details.push({ billDetailId, academyCourseInscriptionId });
    }

    return { billId, details };
  });
};

export const areUsersInscribedInAcademyCourse2 = async (
  userIds: number[],
  academyCourseId: number
) => {
  const results = await db
    .select({ userId: inscriptionXUserTable.userId })
    .from(academyInscriptionTable)
    .innerJoin(
      inscriptionXUserTable,
      eq(academyInscriptionTable.inscriptionXUserId, inscriptionXUserTable.id)
    )
    .where(
      and(
        eq(academyInscriptionTable.academyCourseId, academyCourseId),
        inArray(inscriptionXUserTable.userId, userIds)
      )
    );

  // Convertimos el array de resultados a un objeto tipo { [userId]: true/false }
  const resultMap: Record<number, boolean> = {};
  for (const id of userIds) {
    resultMap[id] = results.some((r) => r.userId === id);
  }

  return resultMap;
};

export const areUsersInscribedInAcademyCourse = async (
  memberId: number,
  academyCourseId: number
) => {
  // Subconsulta: usuarios con membresía en común
  const commonUserIds = await db
    .select({ id: userTable.id })
    .from(userTable)
    .innerJoin(
      membershipXMemberTable,
      eq(userTable.id, membershipXMemberTable.memberId)
    )
    .innerJoin(memberTable, eq(userTable.id, memberTable.id))
    .innerJoin(
      memberTypeTable,
      eq(memberTable.memberTypeId, memberTypeTable.id)
    )
    .where(
      inArray(
        membershipXMemberTable.membershipId,
        db
          .select({ membershipId: membershipXMemberTable.membershipId })
          .from(membershipXMemberTable)
          .where(eq(membershipXMemberTable.memberId, memberId))
      )
    );

  const userIds = commonUserIds.map((u) => u.id);

  // Consulta principal: ver quiénes están inscritos al curso
  const results = await db
    .select({ userId: inscriptionXUserTable.userId })
    .from(academyInscriptionTable)
    .innerJoin(
      inscriptionXUserTable,
      eq(academyInscriptionTable.inscriptionXUserId, inscriptionXUserTable.id) // `inscriptionXUser` es la FK
    )
    .where(
      and(
        eq(academyInscriptionTable.academyCourseId, academyCourseId),
        inArray(inscriptionXUserTable.userId, userIds),
        eq(inscriptionXUserTable.isCancelled, false) // Solo inscripciones activas
      )
    );

  const resultMap: Record<number, boolean> = {};
  for (const id of userIds) {
    resultMap[id] = results.some((r) => r.userId === id);
  }

  return resultMap;
};

/*export const getInscriptionDetailsForUsers = async (
  userIds: number[],
  academyCourseId: number
) => {
  // Subconsulta: cuenta los días seleccionados por inscripción
  const sda = db
    .select({
      acInsId: selectDayAcademyInscriptionTable.academyInscriptionId,
      selectedDays: sql<number>`COUNT(*)`.as('selectedDays'),
    })
    .from(selectDayAcademyInscriptionTable)
    .groupBy(selectDayAcademyInscriptionTable.academyInscriptionId)
    .as('sda');

  // Alias de tabla para usar en JOIN y condiciones
  const sdai = alias(selectDayAcademyInscriptionTable, 'sdai');

  const results = await db
    .selectDistinct({
      userId: inscriptionXUserTable.userId,
      day: courseTimeSlotTable.day,
      startHour: sql`CAST(${courseTimeSlotTable.startHour} AS TIME)`.as('start_hour'),
      endHour: sql`CAST(${courseTimeSlotTable.endHour} AS TIME)`.as('end_hour'),
      priceMember: coursePricingTable.inscriptionPriceMember,
      priceGuest: coursePricingTable.inscriptionPriceGuest,
      academyInscriptionId: academyInscriptionTable.id,
    })
    .from(academyInscriptionTable)
    .innerJoin(
      inscriptionXUserTable,
      eq(academyInscriptionTable.inscriptionXUserId, inscriptionXUserTable.id)
    )
    .innerJoin(
      courseTimeSlotTable,
      eq(academyInscriptionTable.academyCourseId, courseTimeSlotTable.academyCourseId)
    )
    .innerJoin(
      coursePricingTable,
      eq(academyInscriptionTable.academyCourseId, coursePricingTable.academyCourseId)
    )
    .leftJoin(
      sda,
      eq(sda.acInsId, academyInscriptionTable.id)
    )
    .leftJoin(
      sdai,
      and(
        eq(sdai.academyInscriptionId, academyInscriptionTable.id),
        eq(sdai.daySelection, courseTimeSlotTable.day)
      )
    )
    .where(
      and(
        eq(academyInscriptionTable.academyCourseId, academyCourseId),
        inArray(inscriptionXUserTable.userId, userIds),
        eq(inscriptionXUserTable.isCancelled, false),
        or(
          and(
            eq(coursePricingTable.numberDays, "0"),
            sql`sda.selectedDays IS NULL`
          ),
          and(
            sql`${coursePricingTable.numberDays} > 0`,
            sql`sda.selectedDays = ${coursePricingTable.numberDays}`,
            sql`${sdai.daySelection} = ${courseTimeSlotTable.day}`
          )
        )
      )
    )
    .limit(1000);

  return results;
};*/

export const getInscriptionDetailsForUsers = async (
  userIds: number[],
  academyCourseId: number
): Promise<{ id: number; userId: number; selectedDays: number[] }[]> => {
  const rows = await db
    .select({
      id: academyInscriptionTable.id,
      userId: inscriptionXUserTable.userId,
      daySelection: selectDayAcademyInscriptionTable.daySelection,
    })
    .from(academyInscriptionTable)
    .innerJoin(
      inscriptionXUserTable,
      eq(academyInscriptionTable.inscriptionXUserId, inscriptionXUserTable.id)
    )
    .leftJoin(
      selectDayAcademyInscriptionTable,
      eq(
        academyInscriptionTable.id,
        selectDayAcademyInscriptionTable.academyInscriptionId
      )
    )
    .where(
      and(
        and(
          eq(academyInscriptionTable.academyCourseId, academyCourseId),
          eq(inscriptionXUserTable.isCancelled, false)
        ),
        inArray(inscriptionXUserTable.userId, userIds)
      )
    );

  // Agrupar por id y construir selectedDays
  const grouped = new Map<
    number,
    { id: number; userId: number; selectedDays: number[] }
  >();

  for (const row of rows) {
    if (!grouped.has(row.id)) {
      grouped.set(row.id, {
        id: row.id,
        userId: row.userId,
        selectedDays: [],
      });
    }

    if (row.daySelection !== null && row.daySelection !== undefined) {
      grouped.get(row.id)!.selectedDays.push(row.daySelection);
    }
  }

  return Array.from(grouped.values());
};

export const getHistoricUserId = async (id: number) => {
  try {
    if (!id || typeof id !== "number" || id <= 0) {
      throw new AppError("ID de usuario inválido", 400);
    }

    const results = await db
      .select({
        academyInscriptionID: academyInscriptionTable.id,
        id: academyCourseTable.id,
        academyId: academyCourseTable.academyId,
        name: academyCourseTable.name,
        courseType: academyCourseTable.courseType,
        startDate: academyCourseTable.startDate,
        endDate: academyCourseTable.endDate,
        capacity: academyCourseTable.capacity,
        description: academyCourseTable.description,
        allowOutsiders: academyCourseTable.allowOutsiders,
        isActive: academyCourseTable.isActive,
        urlImage: academyCourseTable.urlImage,
        daySelection: selectDayAcademyInscriptionTable.daySelection,
        numSelect: sql<number>`IFNULL(sd.num_select, 0)`.as("num_select"),
        inscriptionPriceMember: coursePricingTable.inscriptionPriceMember,
        inscriptionPriceGuest: coursePricingTable.inscriptionPriceGuest,
        registerCount: academyCourseTable.registerCount,
      })
      .from(academyInscriptionTable)
      .innerJoin(
        academyCourseTable,
        eq(academyInscriptionTable.academyCourseId, academyCourseTable.id)
      )
      .innerJoin(
        inscriptionXUserTable,
        eq(academyInscriptionTable.inscriptionXUserId, inscriptionXUserTable.id)
      )
      .leftJoin(
        selectDayAcademyInscriptionTable,
        eq(
          selectDayAcademyInscriptionTable.academyInscriptionId,
          academyInscriptionTable.id
        )
      )
      .leftJoin(
        sql`
      (
        SELECT ac_ins_id, COUNT(*) AS num_select
        FROM select_day_a_i
        GROUP BY ac_ins_id
      ) AS sd`,
        sql`sd.ac_ins_id =${academyInscriptionTable.id}`
      )
      .leftJoin(
        coursePricingTable,
        and(
          eq(
            coursePricingTable.academyCourseId,
            academyInscriptionTable.academyCourseId
          ),
          eq(coursePricingTable.numberDays, sql`IFNULL(sd.num_select, 0)`)
        )
      )
      .where(
        and(
          eq(inscriptionXUserTable.userId, id),
          eq(inscriptionXUserTable.isCancelled, false)
        )
      );

    const agrupados = new Map<number, any>();
    const timeSlotsCache = new Map<number, any[]>();
    const pricingCache = new Map<number, any[]>();

    for (const item of results) {
      const key = item.academyInscriptionID;

      // Si no existe aún en el Map, lo agregamos con estructura base
      if (!agrupados.has(key)) {
        agrupados.set(key, {
          ...item,
          daySelection: item.daySelection !== null ? [item.daySelection] : [],
          timeSlot: [],
          pricing: [],
        });
      }

      const actual = agrupados.get(key);

      // Si hay más daySelection en otros ítems con el mismo ID, los vamos agregando
      if (
        item.daySelection !== null &&
        !actual.daySelection.includes(item.daySelection)
      ) {
        actual.daySelection.push(item.daySelection);
      }

      // Obtener timeSlots (con cache)
      let timeSlots = timeSlotsCache.get(item.id);
      if (!timeSlots) {
        timeSlots = await academyCourseService.getTimeSlotsByCourseId(item.id);
        timeSlotsCache.set(item.id, timeSlots);
      }

      for (const slot of timeSlots) {
        const exists = actual.timeSlot.some((s: { day: any }) => s.day === slot.day);
        if (!exists) {
          actual.timeSlot.push(slot);
        }
      }

      // Obtener pricing (con cache)
      let pricings = pricingCache.get(item.id);
      if (!pricings) {
        pricings = await academyCourseService.getCoursePricing(item.id);
        pricingCache.set(item.id, pricings);
      }

      for (const pricing of pricings) {
        const exists = actual.pricing.some((p: { id: any }) => p.id === pricing.id);
        if (!exists) {
          actual.pricing.push(pricing);
        }
      }
    }



    // Para obtener la lista final:
    const resultadoFinal = Array.from(agrupados.values());
    //console.log(resultadoFinal);

    if (!Array.isArray(resultadoFinal)) {
      throw new AppError("Error inesperado al obtener los eventos", 500);
    }

    // if (resultadoFinal.length === 0) {
    //   throw new AppError("El usuario no tiene inscripciones activas", 404);
    // }

    return resultadoFinal;

  } catch (err) {
    if (err instanceof AppError) {
      throw err; // Repropaga si ya es un AppError conocido
    }

    console.error("Error inesperado en getHistoricUserId:", err);
    throw new AppError(
      "Ocurrió un error al consultar el historial de inscripcion a academias",
      500
    );
  }
};

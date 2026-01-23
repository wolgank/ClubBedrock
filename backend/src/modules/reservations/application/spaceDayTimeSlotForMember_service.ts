import { db } from "../../../db";
import { spaceDayTimeSlotForMember as spaceDayTimeSlotForMemberTable, spaceDayTimeSlotForMemberInsertSchema } from "../../../db/schema/SpaceDayTimeSlotForMember";
import { eq, and, sql, inArray } from "drizzle-orm";

export const getAllSpaceDayTimeSlotForMember = () => db.select().from(spaceDayTimeSlotForMemberTable);

export const getAllSpaceDayTimeSlotForMemberById = (id: number) =>
  db
    .select()
    .from(spaceDayTimeSlotForMemberTable)
    .where(
      and(
        eq(spaceDayTimeSlotForMemberTable.spaceUsed, id),
        eq(spaceDayTimeSlotForMemberTable.isUsed, true)
      )
    )

export const createAllSpaceDayTimeSlotForMember = async (data: typeof spaceDayTimeSlotForMemberInsertSchema._input) => {

  const insertId = await db
    .insert(spaceDayTimeSlotForMemberTable)
    .values(
      {
        ...data,
        day: new Date(data.day), // Convierte la fecha de string a Date
        startHour: new Date(data.startHour), // Convierte la fecha de string a Date
        endHour: new Date(data.endHour), // Convierte la fecha de string a Date
        isUsed: true
      })
    .$returningId()
    .then((res) => res[0]);

  if (!insertId?.id) {
    throw new Error("Failed to retrieve the inserted space time slot... ID.");
  }
  const [createdSpaceDayTimeSlotForMember] = await db
    .select()
    .from(spaceDayTimeSlotForMemberTable)
    .where(eq(spaceDayTimeSlotForMemberTable.id, insertId.id));
  return createdSpaceDayTimeSlotForMember;
};




export const createAllSpaceDayTimeSlotForMemberTwo = async (data: typeof spaceDayTimeSlotForMemberInsertSchema._input) => {

  const insertId = await db
    .insert(spaceDayTimeSlotForMemberTable)
    .values(
      {
        ...data,
        day: new Date(data.day), // Convierte la fecha de string a Date
        startHour: new Date(data.startHour), // Convierte la fecha de string a Date
        endHour: new Date(data.endHour), // Convierte la fecha de string a Date
        isUsed: false
      })
    .$returningId()
    .then((res) => res[0]);

  if (!insertId?.id) {
    throw new Error("Failed to retrieve the inserted space time slot... ID.");
  }
  const [createdSpaceDayTimeSlotForMember] = await db
    .select()
    .from(spaceDayTimeSlotForMemberTable)
    .where(eq(spaceDayTimeSlotForMemberTable.id, insertId.id));
  return createdSpaceDayTimeSlotForMember;
};



export const updateSpaceDayTimeSlotForMember = async (
  id: number,
  data: Partial<typeof spaceDayTimeSlotForMemberInsertSchema._input>
) => {

  await db
    .update(spaceDayTimeSlotForMemberTable)
    .set({
      ...data,
      day: data.day ? new Date(data.day) : undefined, // Convierte la fecha de string a Date
      startHour: data.startHour ? new Date(data.startHour) : undefined, // Convierte la fecha de string a Date
      endHour: data.endHour ? new Date(data.endHour) : undefined, // Convierte la fecha de string a Date
    })
    .where(eq(spaceDayTimeSlotForMemberTable.id, id));

  const updatedSpaceDayTimeSlotForMember = await db
    .select()
    .from(spaceDayTimeSlotForMemberTable)
    .where(eq(spaceDayTimeSlotForMemberTable.id, id));
  if (!updatedSpaceDayTimeSlotForMember.length) {
    throw new Error("Failed to update the space time slot....");
  }

  return updatedSpaceDayTimeSlotForMember[0];
};

export const deleteSpaceDayTimeSlotForMember = (id: number) =>
  db.delete(spaceDayTimeSlotForMemberTable).where(eq(spaceDayTimeSlotForMemberTable.id, id));


const weekdayNames = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export const getAvailableTimeSlotsByDay = async (idSpace: number, isoDate: string) => {
  const inputDate = new Date(isoDate);
  if (isNaN(inputDate.getTime())) {
    throw new Error("Fecha inválida");
  }
  const targetWeekdayIndex = inputDate.getUTCDay(); // 0 = Sunday, ..., 6 = Saturday
  //console.log('isoDate:', isoDate);
  //console.log('inputDate:', inputDate);
  //console.log('targetWeekdayIndex:', targetWeekdayIndex);

  // Obtener solo el nombre del día (para comparar)
  const weekdayName = weekdayNames[targetWeekdayIndex];

  // Buscar todos los días con ese mismo weekdayName
  const results = await db
    .select()
    .from(spaceDayTimeSlotForMemberTable)
    .where(
      and(
        eq(spaceDayTimeSlotForMemberTable.spaceUsed, idSpace),
        sql`DAYOFWEEK(${spaceDayTimeSlotForMemberTable.day}) = ${(targetWeekdayIndex + 1)}`,
        eq(spaceDayTimeSlotForMemberTable.isUsed, false)
      )
    );

  // Formatear resultados: HH:MM - HH:MM
  const formatted = results.map(slot => {
    const start = new Date(slot.startHour);
    const end = new Date(slot.endHour);
    const formatTime = (d: Date) =>
      `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

    return `${formatTime(start)} - ${formatTime(end)}`;
  });

  return formatted;
};


export const getNoAvailableTimeSlotsByDay = async (idSpace: number, isoDate: string) => {
  const inputDate = new Date(isoDate);
  if (isNaN(inputDate.getTime())) {
    throw new Error("Fecha inválida");
  }
  inputDate.setUTCHours(0, 0, 0, 0);
  const targetWeekdayIndex = inputDate.getUTCDay(); // 0 = Sunday, ..., 6 = Saturday
  //console.log('isoDate:', isoDate);
  //console.log('inputDate:', inputDate);
  //console.log('targetWeekdayIndex:', targetWeekdayIndex);

  // Obtener solo el nombre del día (para comparar)
  const weekdayName = weekdayNames[targetWeekdayIndex];

  // Buscar todos los días con ese mismo weekdayName
  const results = await db
    .select()
    .from(spaceDayTimeSlotForMemberTable)
    .where(
      and(
        eq(spaceDayTimeSlotForMemberTable.spaceUsed, idSpace),
        eq(spaceDayTimeSlotForMemberTable.day, inputDate),
        eq(spaceDayTimeSlotForMemberTable.isUsed, true)
      )
    );

  // Formatear resultados: HH:MM - HH:MM
  const formatted = results.map(slot => {
    const start = new Date(slot.startHour);
    const end = new Date(slot.endHour);
    const formatTime = (d: Date) =>
      `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

    return `${formatTime(start)} - ${formatTime(end)}`;
  });

  return formatted;
};



export const getAvailableTimeSlotsByDayDouble = async (idSpace: number) => {
  const results = await db
    .select()
    .from(spaceDayTimeSlotForMemberTable)
    .where(
      and(
        eq(spaceDayTimeSlotForMemberTable.spaceUsed, idSpace),
        eq(spaceDayTimeSlotForMemberTable.isUsed, false)
      )
    );

  const formatted = results.map(slot => ({
    pricePerBlock: slot.pricePerBlock,
    startHour: new Date(slot.startHour).toISOString(),
    endHour: new Date(slot.endHour).toISOString(),
  }));

  return formatted;
};






export const createAllSpaceDayTimeSlotForMemberArray = async (
  dataArray: typeof spaceDayTimeSlotForMemberInsertSchema._input[]
) => {
  // Prepara todos los valores con los campos convertidos a Date y isUsed en true
  const preparedData = dataArray.map((data) => ({
    ...data,
    day: new Date(data.day),
    startHour: new Date(data.startHour),
    endHour: new Date(data.endHour),
    isUsed: true,
  }));

  // Inserta todos los registros
  const insertIds = await db
    .insert(spaceDayTimeSlotForMemberTable)
    .values(preparedData)
    .$returningId();

  if (!insertIds || insertIds.length === 0) {
    throw new Error("No se pudo insertar ningún espacio horario.");
  }

  // Obtiene todos los registros recién insertados
  const created = await db
    .select()
    .from(spaceDayTimeSlotForMemberTable)
    .where(
      // Filtra todos los nuevos registros por sus IDs
      inArray(spaceDayTimeSlotForMemberTable.id, insertIds.map((r) => r.id))
    );

  return created;
};

export const getAvailableTimeSlotsALL = async (idSpace: number) => {

  // Buscar todos los días con ese mismo weekdayName
  const results = await db
    .select()
    .from(spaceDayTimeSlotForMemberTable)
    .where(
      and(
        eq(spaceDayTimeSlotForMemberTable.spaceUsed, idSpace),
        eq(spaceDayTimeSlotForMemberTable.isUsed, false)
      )
    );

  return results;
};


export const crearHorariosDisnponibles = async (
  data: typeof spaceDayTimeSlotForMemberInsertSchema._input & { duracion_bloque: number }
) => {

  const { duracion_bloque, ...dataSinDuracion } = data;

  const bloquesCreados: any[] = [];

  await db.transaction(async (tx) => {
    let bloqueInicio = new Date(data.startHour);
    const end = new Date(data.endHour);
    const day = new Date(data.day);

    while (bloqueInicio < end) {
      const bloqueFin = new Date(bloqueInicio);
      bloqueFin.setHours(bloqueFin.getHours() + duracion_bloque);
      const bloqueFinal = bloqueFin > end ? end : bloqueFin;

      const [res] = await tx
        .insert(spaceDayTimeSlotForMemberTable)
        .values({
          ...dataSinDuracion,
          day,
          startHour: new Date(bloqueInicio),
          endHour: new Date(bloqueFinal),
          isUsed: false,
        })
        .$returningId();

      if (!res) {
        throw new Error("Error")
      }

      const [bloqueInsertado] = await tx
        .select()
        .from(spaceDayTimeSlotForMemberTable)
        .where(eq(spaceDayTimeSlotForMemberTable.id, res.id));

      bloquesCreados.push(bloqueInsertado);

      if (bloqueFin >= end) break;
      bloqueInicio = new Date(bloqueFinal);
    }
  });

  return bloquesCreados;
};


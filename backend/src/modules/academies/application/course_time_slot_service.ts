// services/event_service.ts
import { db } from "../../../db";
import type { academyCourseInsertSchema } from "../../../db/schema/AcademyCourse";
import { courseTimeSlot as courseTimeSlotTable, courseTimeSlotInsertSchema } from "../../../db/schema/CourseTimeSlot";
import { eq } from "drizzle-orm";

export const getAllCourseTimeSlot = () => db.select().from(courseTimeSlotTable);

export const getCourseTimeSlotById = (id: number) =>
  db
    .select()
    .from(courseTimeSlotTable)
    .where(eq(courseTimeSlotTable.id, id))
    .then((res) => res[0]);

export const createCourseTimeSlot = async (data: typeof courseTimeSlotInsertSchema._input) => {

  const insertId = await db
    .insert(courseTimeSlotTable)
    .values({
      ...data,
        startHour: new Date(data.startHour), // Convierte la fecha de string a Date
        endHour: new Date(data.endHour), // Convierte la fecha de string a Date
    })
    .$returningId()
    .then((res) => res[0]);

  if (!insertId?.id) {
    throw new Error("Failed to retrieve the inserted Course time slot ID.");
  }
  const [createdCourseTimeSlot] = await db
    .select()
    .from(courseTimeSlotTable)
    .where(eq(courseTimeSlotTable.id, insertId.id));
  return createdCourseTimeSlot;
};

export const updateCourseTimeSlot = async (
  id: number,
  data: Partial<typeof courseTimeSlotInsertSchema._input>
) => {
  
  await db
    .update(courseTimeSlotTable)
    .set({
      ...data,
        startHour: data.startHour ? new Date(data.startHour) : undefined, // Convierte la fecha de string a Date
        endHour: data.endHour ? new Date(data.endHour) : undefined, // Convierte la fecha de string a Date
    }).where(eq(courseTimeSlotTable.id, id));    
  
    const updateCourseTimeSlot = await db
    .select()
    .from(courseTimeSlotTable)
    .where(eq(courseTimeSlotTable.id, id));
  if (!updateCourseTimeSlot.length) {
    throw new Error("Failed to update the CourseTimeSlot.");
  }

  return updateCourseTimeSlot[0]; 
};

export const deleteCourseTimeSlot = (id: number) =>
  db.delete(courseTimeSlotTable).where(eq(courseTimeSlotTable.id, id));

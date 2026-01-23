import type { Context } from 'hono';
import * as courseTimeSlotService from '../../application/course_time_slot_service';
import { courseTimeSlotInsertSchema } from '../../../../db/schema/CourseTimeSlot';
export const getAll = async (c: Context) => {
    const reservations = await courseTimeSlotService.getAllCourseTimeSlot();
    return c.json(reservations);
  };
  export const getOne= async (c: Context) => {
    const id = Number(c.req.param('id'));
    const reservation = await courseTimeSlotService.getCourseTimeSlotById(id);
    if (!reservation) return c.notFound();
    return c.json(reservation);
  };
  export const create = async (c: Context) => {
    const body = await c.req.json();
    const parsed = courseTimeSlotInsertSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.flatten() }, 400);
    }
  
    const result = await courseTimeSlotService.createCourseTimeSlot(parsed.data);
    return c.json(result, 201);
  };
  export const update = async (c: Context) => {
    const id = Number(c.req.param('id'));
    const body = await c.req.json();
    const parsed = courseTimeSlotInsertSchema.partial().safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.flatten() }, 400);
    }
  
    await courseTimeSlotService.updateCourseTimeSlot(id, parsed.data);
    return c.body(null, 204);
  };
  export const remove = async (c: Context) => {
    const id = Number(c.req.param('id'));
    await courseTimeSlotService.deleteCourseTimeSlot(id);
    return c.body(null, 204);
  };
          
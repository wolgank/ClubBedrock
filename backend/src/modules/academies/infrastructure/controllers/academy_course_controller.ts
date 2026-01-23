import type { Context } from 'hono';
import * as academyCourseService from '../../application/academy_course_service';
import { academyCourseInsertSchema } from '../../../../db/schema/AcademyCourse';
import { academyCourseSelectSchema } from '../../../../db/schema/AcademyCourse';
import { parse } from 'hono/utils/cookie';
import { createCourseWithTimeSlotsSchema } from '../../domain/courseWithTimeSlots';
import { formatHourFromISO, formatDateToYMD } from '../../../../shared/utils/formatsTime';
const parseAcademyCourse = (academyCourse: any) => {
  //console.log("Parsing academy course:", academyCourse);
  const parsed = academyCourseSelectSchema.safeParse(academyCourse);
  //console.log("Parsed academy course:", parsed.error);
  if (!parsed.success) {
    console.error("Validation error:", parsed.error.flatten());
    return null;
  }
  return parsed.data;
};

const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString("es-PE", {
    //weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const processAcademyCourse = (academyCourse: any) => {
  //console.log("Processing academy course:", academyCourse);
  const data = parseAcademyCourse(academyCourse);
  if (!data) return null;

  return {
    ...data,
    startDate: formatDate(typeof data.startDate === "string" ? data.startDate : data.startDate.toISOString()),
    endDate: formatDate(typeof data.endDate === "string" ? data.endDate : data.endDate.toISOString()),
  };
};




export const getAll = async (c: Context) => {
  const courses = await academyCourseService.getAllAcademyCourse();
  const parsed = courses.map(processAcademyCourse).filter(Boolean);
  return c.json(parsed);
};
export const getOne = async (c: Context) => {
  const id = Number(c.req.param('id'));
  const courses = await academyCourseService.getAcademyCourseById(id);
  const parsed = processAcademyCourse(courses);
  if (!parsed) return c.notFound();
  return c.json(parsed);
};
export const create = async (c: Context) => {
  const body = await c.req.json();
  const parsed = academyCourseInsertSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const result = await academyCourseService.createAcademyCourse(parsed.data);
  return c.json(result, 201);
};
export const update = async (c: Context) => {
  const id = Number(c.req.param('id'));
  const body = await c.req.json();
  const parsed = academyCourseInsertSchema.partial().safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  await academyCourseService.updateAcademyCourse(id, parsed.data);
  return c.body(null, 204);
};
export const remove = async (c: Context) => {
  const id = Number(c.req.param('id'));
  await academyCourseService.deleteAcademyCourse(id);
  return c.body(null, 204);
};

export const createCourseTimeSlot = async (c: Context) => {
  const body = await c.req.json();
  //console.log('createCourseTimeSlot body', body);
  const parsed = createCourseWithTimeSlotsSchema.safeParse(body);
  //console.log('createCourseTimeSlot parsed', parsed);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }
  const { academyCourse, timeSlots, coursePricingList } = parsed.data;
  try {
    const result = await academyCourseService.createCourseWithReservations({
      academyCourse,
      timeSlots,
      coursePricingList
    });
    return c.json(result, 201);
  } catch (err: any) {
    console.error("Error creating course with reservations:", err);

    const status = err.status ?? 500;
    const message = err.message ?? "Internal server error";

    return c.json({ error: message }, status);
  }
}

export const deleteCourseWithReservations = async (c: Context) => {
  const id = Number(c.req.param('id'));
  try {
    await academyCourseService.deleteCourseWithReservations(id);
    return c.body(null, 204);
  } catch (err: any) {
    console.error("Error deleting course with reservations:", err);

    const status = err.status ?? 500;
    const message = err.message ?? "Internal server error";

    return c.json({ error: message }, status);
  }
}

export const updateCourseWithReservations = async (c: Context) => {
  const id = Number(c.req.param('id'));
  try {
    const body = await c.req.json();
    //console.log("updateCourseWithReservations body:", body);
    const parsed = createCourseWithTimeSlotsSchema.partial().safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.flatten() }, 400);
    }
    const { academyCourse, timeSlots, coursePricingList } = parsed.data;

    if (!academyCourse || !timeSlots || !coursePricingList) {
      return c.json({ error: "academyCourse is required" }, 400);
    }

    const result = await academyCourseService.updateCourseWithReservations(id, {
      academyCourse,
      timeSlots,
      coursePricingList
    });
    return c.json(result, 200);
  }
  catch (err: any) {
    console.error("Error updating course with reservations:", err);

    const status = err.status ?? 500;
    const message = err.message ?? "Internal server error";

    return c.json({ error: message }, status);
  }
}

export const getCourseWithDetailsSimple = async (c: Context) => {
  const id = Number(c.req.param('id'));
  try {
    const course = await academyCourseService.getCourseWithDetailsSimple(id);
    //console.log("Course with details:", course);
    const parse = course.timeSlots.map((slot: any) => ({
      ...slot,
      startHour: formatHourFromISO(slot.startHour.toISOString()),
      endHour: formatHourFromISO(slot.endHour.toISOString()),
    }));
    const map = new Map<string, { count: number } & typeof parse[0]>();

    for (const entry of parse) {
      const key = `${entry.day}|${entry.startHour}|${entry.endHour}|${entry.spaceId}`;
      if (map.has(key)) {
        map.get(key)!.count++;
      } else {
        map.set(key, { ...entry, count: 1 });
      }
    }
    course.timeSlots = Array.from(map.values());

    if (!parse) {
      return c.notFound();
    }
    return c.json(course);
  } catch (err: any) {
    console.error("Error getting parse with details:", err);

    const status = err.status ?? 500;
    const message = err.message ?? "Internal server error";

    return c.json({ error: message }, status);
  }
}

export const getCoursePricing = async (c: Context) => {
  const id = Number(c.req.param('id'));
  try {
    const pricing = await academyCourseService.getCoursePricing(id);
    return c.json(pricing);
  } catch (err: any) {
    console.error("Error getting course pricing:", err);

    const status = err.status ?? 500;
    const message = err.message ?? "Internal server error";

    return c.json({ error: message }, status);
  }
}

export const getTimeSlotsByCourseId = async (c: Context) => {
  const id = Number(c.req.param('id'));
  try {
    const timeSlots = await academyCourseService.getTimeSlotsByCourseId(id);
    return c.json(timeSlots);
  } catch (err: any) {
    console.error("Error getting time slots by course ID:", err);

    const status = err.status ?? 500;
    const message = err.message ?? "Internal server error";

    return c.json({ error: message }, status);
  }
}
























import { AppError } from '../../../../shared/utils/AppError';
import { courseTimeSlotInsertSchema } from '../../../../db/schema/CourseTimeSlot';
import { coursePricicingInsertSchema } from '../../../../db/schema/CoursePricing';


export const addCoursesByAcademyId = async (c: Context) => {
  const body = await c.req.json();

  const omitIds = <T extends Record<string, any>>(obj: T, keys: string[] = ["id", "academyId", "academyCourseId", "reservationId"]) => {
    const clean = { ...obj };
    for (const key of keys) {
      if (key in clean) delete clean[key];
    }
    return clean;
  };

  const academyId = body.academyId;
  const rawCourse = body.academyCourse;

  if (!rawCourse) {
    return c.json({ error: "academyCourse is required" }, 400);
  }

  const courseClean = omitIds(rawCourse, ["id"]);
  courseClean.academyId = academyId;

  const pricesClean = (courseClean.prices ?? []).map((p: any) => {
    const clean = omitIds(p, ["id"]);
    clean.academyCourseId = 1;
    clean.isActive = true;
    return clean;
  });

  const schedulesClean = (courseClean.schedules ?? []).map((s: any) => {
    const clean = omitIds(s, ["id"]);
    clean.academyCourseId = 1;
    clean.reservationId = 1;
    return clean;
  });

  // Validaciones
  const courseParse = academyCourseInsertSchema.safeParse(courseClean);
  if (!courseParse.success) {
    return c.json({ error: { course: courseParse.error.flatten() } }, 400);
  }

  for (const price of pricesClean) {
    const priceParse = coursePricicingInsertSchema.safeParse(price);
    if (!priceParse.success) {
      return c.json({ error: { price: priceParse.error.flatten() } }, 400);
    }
  }

  for (const slot of schedulesClean) {
    const slotParse = courseTimeSlotInsertSchema.safeParse(slot);
    if (!slotParse.success) {
      return c.json({ error: { slot: slotParse.error.flatten() } }, 400);
    }
  }

  try {
    const result = await academyCourseService.addCoursesByAcademyId(
      academyId,
      {
        ...omitIds(courseClean, ["academyId"]),
        dataCoursePrices: pricesClean,
        dataCourseTimeSlot: schedulesClean,
      }
    );
    return c.json({ message: "Curso registrado exitosamente" }, 201);
  } catch (error: any) {
    console.error("Error al crear el curso:", error);
    if (error instanceof AppError) {
      console.error("AppError details:", error.message, "Status:", error.status);
      return c.json({ message: error.message }, { status: error.status as any });
    }
    return c.json(
      { message: "Error al crear el curso", details: error instanceof Error ? error.message : error },
      501
    );
  }
};



export const getCoursesByAcademyId = async (c: Context) => {
  const academyId = Number(c.req.param('id'));
  //console.log("Getting courses for academy ID:", academyId);
  try {
    const courses = await academyCourseService.getCoursesByAcademyId(academyId);
    if (!courses || courses.length === 0) {
      return c.json({ message: "No courses found for this academy" }, 404);
    }
    return c.json(courses);
  } catch (err: any) {
    console.error("Error getting courses by academy ID:", err);

    const status = err.status ?? 500;
    const message = err.message ?? "Internal server error";

    return c.json({ error: message }, status);
  }
};


export const removeCourse = async (c: Context) => {
  const idAcademy = Number(c.req.param('id')); // Se asume que viene como parámetro de URL
  const body = await c.req.json();
  const { courseName } = body;

  try {
    await academyCourseService.removeCourse(idAcademy, courseName);
    return c.json({ message: "Curso eliminado correctamente." }, 200);
  } catch (error: any) {
    console.error("Error al eliminar el curso:", error);
    if (error instanceof AppError) {
      console.error("AppError details:", error.message, "Status:", error.status);
      return c.json({ message: error.message }, { status: error.status as any });
    }
    return c.json(
      { message: "Error al eliminar el curso", details: error instanceof Error ? error.message : error },
      501
    );
  }
};

export const getCourseContDay = async (c: Context) => {
  const id = Number(c.req.param('id'));
  try {
    const course = await academyCourseService.countsByDay(id);
    if (!course) {
      return c.notFound();
    }
    return c.json(course);
  } catch (err: any) {
    console.error("Error getting course by ID:", err);

    const status = err.status ?? 500;
    const message = err.message ?? "Internal server error";

    return c.json({ error: message }, status);
  }
}














export const editCourseById = async (c: Context) => {
  const body = await c.req.json();

  const omitIds = <T extends Record<string, any>>(obj: T, keys: string[] = ["id", "academyId", "academyCourseId", "reservationId"]) => {
    const clean = { ...obj };
    for (const key of keys) {
      if (key in clean) delete clean[key];
    }
    return clean;
  };

  const courseName = body.courseName;
  const academyId = body.academyId;
  const rawCourse = body.academyCourse;

  if (!rawCourse) {
    return c.json({ error: "academyCourse is required" }, 400);
  }

  const courseClean = omitIds(rawCourse, ["id"]);
  courseClean.academyId = academyId;
  courseClean.courseName = courseName;


  const pricesClean = (courseClean.prices ?? []).map((p: any) => {
    const clean = omitIds(p, ["id"]);
    clean.academyCourseId = 1;
    clean.isActive = true;
    return clean;
  });

  const schedulesClean = (courseClean.schedules ?? []).map((s: any) => {
    const clean = omitIds(s, ["id"]);
    clean.academyCourseId = 1;
    clean.reservationId = 1;
    return clean;
  });

  // Validaciones
  const courseParse = academyCourseInsertSchema.safeParse(courseClean);
  if (!courseParse.success) {
    return c.json({ error: { course: courseParse.error.flatten() } }, 400);
  }

  for (const price of pricesClean) {
    const priceParse = coursePricicingInsertSchema.safeParse(price);
    if (!priceParse.success) {
      return c.json({ error: { price: priceParse.error.flatten() } }, 400);
    }
  }

  for (const slot of schedulesClean) {
    const slotParse = courseTimeSlotInsertSchema.safeParse(slot);
    if (!slotParse.success) {
      return c.json({ error: { slot: slotParse.error.flatten() } }, 400);
    }
  }

  try {
    const result = await academyCourseService.editCourseById(
      academyId,
      courseName,
      {
        ...omitIds(courseClean, ["academyId", "courseName"]),
        dataCoursePrices: pricesClean,
        dataCourseTimeSlot: schedulesClean,
      }
    );
    return c.json({ message: "Curso editato correctamente" }, 201);
  } catch (error: any) {
    console.error("Error al editar el curso:", error);
    if (error instanceof AppError) {
      console.error("AppError details:", error.message, "Status:", error.status);
      return c.json({ message: error.message }, { status: error.status as any });
    }
    return c.json(
      { message: "Error al editar el curso", details: error instanceof Error ? error.message : error },
      501
    );
  }
};


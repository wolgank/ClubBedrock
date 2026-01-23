import type { Context } from 'hono';
import * as academyService from '../../application/academy_service';
import { academyInsertSchema } from '../../../../db/schema/Academy';
import { academyCourseGrupSelectSchema } from '../../../../db/schema/AcademyCourse';
import type { CourseWithSchedule } from '../../domain/courseWithSchedule';
import * as academyCourseService from '../../application/academy_course_service';
import { z } from 'zod';

/* -------------------- Utilidades -------------------- */

const parseAcademyCourse = (academyCourse: any) => {
  const parsed = academyCourseGrupSelectSchema.safeParse(academyCourse);
  if (!parsed.success) {
    console.error("Validation error:", parsed.error.format());
    return null;
  }
  return parsed.data;
};

const formatDate = (date: string | Date): string =>
  new Date(date).toLocaleDateString("es-PE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const processAcademyCourse = (academyCourse: any) => {
  const processedData = {
    ...academyCourse,
    isActive: Boolean(academyCourse.isActive),
  };

  const data = parseAcademyCourse(processedData);
  if (!data) return null;

  const formatDateInput = (date: string | Date) =>
    typeof date === "string"
      ? formatDate(date)
      : date instanceof Date
        ? formatDate(date.toISOString())
        : null;

  return {
    ...data,
    startDate: formatDateInput(data.startDate),
    endDate: formatDateInput(data.endDate),
  };
};

const buildCourseBase = (row: any): CourseWithSchedule => ({
  id: row.id,
  name: row.name,
  startDate: typeof row.startDate === "string" ? row.startDate : row.startDate.toISOString(),
  endDate: typeof row.endDate === "string" ? row.endDate : row.endDate.toISOString(),
  description: row.description ?? '',
  capacity: row.capacity,
  urlImage: row.urlImage ?? '',
  allowOutsiders: row.allowOutsiders,
  isActive: !!row.isActive,
  courseType: row.courseType,
  academyName: row.academyName,
  schedule: [],
  pricing: [],
});

const addScheduleIfNotExists = (course: CourseWithSchedule, row: any) => {
  const isDuplicate = course.schedule.some(
    (s) =>
      s.day === row.day &&
      s.startTime === String(row.startTime) &&
      s.endTime === String(row.endTime)
  );

  if (!isDuplicate) {
    course.schedule.push({
      day: row.day,
      startTime: String(row.startTime),
      endTime: String(row.endTime),
    });
  }
};

/* -------------------- Controladores -------------------- */

export const getAll = async (c: Context) => {
  const academies = await academyService.getAllAcademies();
  return c.json(academies);
};


export const CancelInscription = async (c: Context) => {
  const id = Number(c.req.param('id'));
  await academyService.CancelInscription(id);
  return c.body(null, 204);
}


export const getAllAcademies = async (c: Context) => {
  const academies = await academyService.getAcademies();
  return c.json(academies);
};

export const getAllBasicAcademyInfo = async (c: Context) => {
  const academies = await academyService.getAllBasicAcademyInfo();
  return c.json(academies);
}

export const getOne = async (c: Context) => {
  const id = Number(c.req.param('id'));
  const academy = await academyService.getAcademyById(id);
  if (!academy) return c.notFound();
  return c.json(academy);
};


export const getOneSpecial = async (c: Context) => {
  const id = Number(c.req.param('id'));
  const academy = await academyService.getAcademySpecialById(id);
  if (!academy) return c.notFound();
  return c.json(academy);
};



export const getAcademyInscriptionById = async (c: Context) => {
  const id = Number(c.req.param('id'));
  const academy = await academyService.getAcademyInscriptionById(id);
  if (!academy) return c.notFound();
  return c.json(academy);
};


export const create = async (c: Context) => {
  const body = await c.req.json();
  const parsed = academyInsertSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const result = await academyService.createAcademy(parsed.data);
  return c.json(result, 201);
};

export const update = async (c: Context) => {
  const id = Number(c.req.param('id'));
  const body = await c.req.json();
  const parsed = academyInsertSchema.partial().safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  await academyService.updateAcademy(id, parsed.data);
  return c.body(null, 204);
};

export const remove = async (c: Context) => {
  const id = Number(c.req.param('id'));
  await academyService.deleteAcademy(id);
  return c.body(null, 204);
};

export const getContactInfo = async (c: Context) => {
  const id = Number(c.req.param('id'));
  const contactInfo = await academyService.getContactInfo(id);
  if (!contactInfo) {
    return c.json({ error: 'Información de contacto no encontrada.' }, 404);
  }
  return c.json(contactInfo);
}

export const getAllCourses = async (c: Context) => {
  const academyId = Number(c.req.param('id'));

  if (isNaN(academyId)) {
    return c.json({ error: 'ID de academia inválido.' }, 400);
  }

  try {
    const rows = await academyService.getAllCoursesByAcademy(academyId);
    const coursesMap = new Map<number, CourseWithSchedule>();

    for (const row of rows) {
      if (!coursesMap.has(row.id)) {
        coursesMap.set(row.id, buildCourseBase(row));
      }

      const course = coursesMap.get(row.id)!;
      addScheduleIfNotExists(course, row);
    }

    const courses = Array.from(coursesMap.values());

    if (courses.length === 0) return c.json([]);

    // Agregar precios a cada curso
    for (const course of courses) {
      try {
        course.pricing = await academyCourseService.getCoursePricing(course.id);
      } catch (error) {
        console.error(`Error al obtener precios para el curso con ID ${course.id}:`, error);
        course.pricing = []; // O puedes dejarlo como undefined si prefieres
      }
    }

    return c.json(courses);
  } catch (error) {
    console.error('Error al obtener los cursos:', error);
    return c.json({ error: 'No se pudieron obtener los cursos.' }, 500);
  }
};


import { academyCourseInsertSchema } from '../../../../db/schema/AcademyCourse';
import { courseTimeSlotInsertSchema } from '../../../../db/schema/CourseTimeSlot';
import { coursePricicingInsertSchema } from '../../../../db/schema/CoursePricing';


export const createNew = async (c: Context) => {
  const body = await c.req.json();

  // Función para eliminar propiedades id y otros IDs no deseados
  const omitIds = <T extends Record<string, any>>(obj: T, keys: string[] = ["id", "academyId", "academyCourseId", "reservationId"]) => {
    const clean = { ...obj };
    for (const key of keys) {
      if (key in clean) {
        delete clean[key];
      }
    }
    return clean;
  };

  // Limpiar y validar academia
  const academyClean = omitIds(body.academy);
  const academyParse = academyInsertSchema.safeParse(academyClean);

  if (!academyParse.success) {
    return c.json({ error: { academy: academyParse.error.flatten() } }, 400);
  }

  // Validar arreglo de cursos (usar body.academyCourses para mantener consistencia con el servicio)
  if (!Array.isArray(body.academyCourses)) {
    return c.json({ error: { academyCourses: "Debe ser un arreglo" } }, 400);
  }

  const coursesParsed = [];
  const academyId = academyParse.data.id;

  for (const course of body.academyCourses) {
    // Limpiar IDs en curso, precios y horarios
    const courseClean = omitIds(course, ["id"]);
    courseClean.academyId = 1;

    // Limpiar precios
    const pricesClean = (courseClean.prices ?? []).map((p: any) => omitIds(p, ["id"]));
    pricesClean.academyCourseId = 1;
    pricesClean.isActive = 1;

    // Limpiar horarios
    const schedulesClean = (courseClean.schedules ?? []).map((s: any) => omitIds(s, ["id"]));
    schedulesClean.academyCourseId = 1;
    schedulesClean.reservationId = 1;


    // Validar curso
    const courseParse = academyCourseInsertSchema.safeParse(courseClean);
    if (!courseParse.success) {
      return c.json({ error: { course: courseParse.error.flatten() } }, 400);
    }

    // Validar precios
    for (const price of pricesClean) {
      const priceParse = coursePricicingInsertSchema.safeParse(price);
      if (!priceParse.success) {
        return c.json({ error: { price: priceParse.error.flatten() } }, 400);
      }
    }

    // Validar horarios
    for (const slot of schedulesClean) {
      const slotParse = courseTimeSlotInsertSchema.safeParse(slot);
      if (!slotParse.success) {
        return c.json({ error: { slot: slotParse.error.flatten() } }, 400);
      }
    }

    coursesParsed.push({
      ...omitIds(courseClean, ["academyId"]),
      dataCoursePrices: pricesClean,
      dataCourseTimeSlot: schedulesClean,
    });
  }

  try {
    const result = await academyService.createNewAcademy(academyParse.data, coursesParsed);
    return c.json({ message: "Academia creada exitosamente" }, 201);
  } catch (error: any) {
    return c.json({ error: error.message || 'Error interno del servidor' }, 500);
  }
};

export const createAcademySolo = async (c: Context) => {
  const body = await c.req.json();
  const parsed = academyInsertSchema.safeParse(body.academy);

  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  try {
    await academyService.createAcademySolo(parsed.data);
    return c.json({ message: "Academia creada exitosamente" }, 201);
  } catch (error: any) {
    console.error("Error al crear la academia:", error);
    if (error instanceof AppError) {
      console.error("AppError details:", error.message, "Status:", error.status);
      return c.json({ message: error.message }, { status: error.status as any });
    }
    return c.json(
      { message: "Error al crear la academia", details: error instanceof Error ? error.message : error },
      501
    );
  }
}




import { AppError } from '../../../../shared/utils/AppError';

export const deleteAcademyById = async (c: Context) => {
  const id = Number(c.req.param('id'));
  try {
    await academyService.deleteAcademyById(id);
    return c.json({ message: "Academia eliminada exitosamente" }, 200);
  } catch (error: any) {
    console.error("Error al eliminar la academia:", error);
    if (error instanceof AppError) {
      console.error("AppError details:", error.message, "Status:", error.status);
      return c.json({ message: error.message }, { status: error.status as any });
    }
    return c.json(
      { message: "Error al eliminar la academia", details: error instanceof Error ? error.message : error },
      501
    );
  }
}

export const editAcademyById = async (c: Context) => {
  const id = Number(c.req.param('id'));
  const body = await c.req.json();
  const { values, urlImage } = body;

  // Mapeamos solo los campos permitidos y con los nombres correctos
  const updateData = {
    name: values.name,
    description: values.description,
    sport: values.deporte, // <- aquí haces el mapeo correcto
    ...(urlImage && { urlImage }),
  };


  try {
    await academyService.editAcademyById(id, updateData);
    return c.json({ message: "Academia actualizada exitosamente" }, 200);
  } catch (error: any) {
    console.error("Error al actualizar la academia:", error);
    if (error instanceof AppError) {
      console.error("AppError details:", error.message, "Status:", error.status);
      return c.json({ message: error.message }, { status: error.status as any });
    }
    return c.json(
      { message: "Error al actualizar la academia", details: error instanceof Error ? error.message : error },
      501
    );
  }
};

export const reporteAcademias = async (c: Context) => {
  const res = await academyService.reporteAcademias();
  return c.json(res)
};
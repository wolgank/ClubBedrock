import type { Context } from "hono";
import * as eventService from "../../application/event_service";
import { eventSelectSchema } from "../../../../db/schema/Event";
import { eventInsertSchema } from "../../../../db/schema/Event"; // (no se usa, podrías eliminarlo)
import { createEventSchema } from "../../domain/event";
import type { EventFilter } from "../../domain/event";

// Utilidades reutilizable

const parseEvent = (event: any) => {
  const parsed = eventSelectSchema.safeParse(event);
  if (!parsed.success) {
    console.error("Validation error:", parsed.error.flatten());
    return null;
  }
  return parsed.data;
};

const processEvent = (event: any) => {
  const data = parseEvent(event);
  if (!data) return null;

  return {
    ...data,
    date: typeof data.date === "string" ? data.date : data.date.toISOString(),
    startHour: typeof data.startHour === "string" ? data.startHour : data.startHour.toISOString(),
    endHour: typeof data.endHour === "string" ? data.endHour : data.endHour.toISOString(),
  };
};

// Endpoints
export const getAll = async (c: Context) => {
  const events = await eventService.getAllEvents();
  const parsedEvents = events.map(processEvent).filter(Boolean);
  return c.json(parsedEvents);
};


export const getOne = async (c: Context) => {
  const id = Number(c.req.param("id"));
  const event = await eventService.getEventById(id);

  // Validamos pero NO formateamos
  const parsed = eventSelectSchema.safeParse(event);
  if (!parsed.success) {
    console.error("Validation error:", parsed.error.flatten());
    return c.notFound();
  }

  // Devolvemos los datos tal cual, con las fechas en formato original (ISO)
  return c.json(parsed.data);
};

export const create = async (c: Context) => {
  const body = await c.req.json();
  body.urlImage = body.urlImage
    ? `${process.env.BACKEND_URL}/files/download/${body.urlImage}`
    : `${process.env.BACKEND_URL}/files/download/Placeholder.png`;
  const parsed = createEventSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const result = await eventService.createEvent(parsed.data);
  return c.json(result, 201);
};

export const update = async (c: Context) => {
  const id = Number(c.req.param("id"));
  const body = await c.req.json();
  //console.log("Body:", body);
  body.urlImage = `${process.env.BACKEND_URL}/files/download/${body.urlImage}`;
  //console.log("Body:", body);
  const parsed = createEventSchema.safeParse(body);

  if (!parsed.success) {
    console.error("❌ Error de validación:", parsed.error.format());
    return c.json({ error: "Datos inválidos", detalles: parsed.error.format() }, 400);
  }

  await eventService.updateEvent(id, parsed.data);
  return c.body(null, 204);
};

export const remove = async (c: Context) => {
  const id = Number(c.req.param("id"));
  await eventService.deleteEventInscription(id);
  return c.body(null, 204);
};

export const getFilterPaginated = async (c: Context) => {
  const query = c.req.query();
  //console.log("Query params:", query);
  const filter: EventFilter = {
    page: Number(query.page) || 1,
    size: Number(query.size) || 10,
    orden: query.orden === "antiguo" ? "antiguo" : "reciente",
    isActive: query.isActive === "true",
    startDate: query.startDate || null,
    endDate: query.endDate || null,
    startHour: query.startHour || null,
    endHour: query.endHour || null,
    allowOutsiders: query.allowOutsiders === "true",
  };

  if (filter.page < 1 || filter.size < 1) {
    return c.json({ error: "Parámetros inválidos: page y size deben ser mayores a 0" }, 400);
  }

  try {
    const events = await eventService.getFilteredPaginated(filter);
    //console.log("Eventos obtenidos:", events);
    const parsedEvents = events.eventos.map(processEvent).filter(Boolean);
    //console.log("Eventos procesados:", parsedEvents);
    return c.json({ eventos: parsedEvents, totalPages: events.totalPages });
  } catch (error) {
    console.error("Error al obtener eventos filtrados y paginados:", error);
    return c.json({ error: "Error interno del servidor" }, 500);
  }
};























import {
  eventInsertSchemaM
} from '../../../../db/schema/Event';
import {
  reservationInsertSchema
} from '../../../../db/schema/Reservation'
import { AppError } from "../../../../shared/utils/AppError";


export const createNewEvent = async (c: Context) => {
  try {
    const body = await c.req.json();

    const reservationParse = reservationInsertSchema.safeParse(body.reservation)
    const eventParse = eventInsertSchemaM.safeParse(body.event)

    if (!reservationParse.success || !eventParse.success) {
      return c.json({
        error: {
          reservation: reservationParse.success ? null : reservationParse.error.flatten(),
          event: eventParse.success ? null : eventParse.error.flatten(),
        }
      }, 400);
    }

    const result = await eventService.createNewEvent(
      reservationParse.data,
      eventParse.data,
    );
    c.set("newRowId", result.eventInsertId);
    return c.json(result, 201);
  }
  catch (error) {
    console.error("Error al crear el evento:", error);
    if (error instanceof AppError) {
      console.error("AppError details:", error.message, "Status:", error.status);
      return c.json({ message: error.message }, { status: error.status as any });
    }
    return c.json(
      { message: "Error al crear evento", details: error instanceof Error ? error.message : error },
      501
    );

  }
};



export const getAllEventSpace = async (c: Context) => {
  const events = await eventService.getAllEventsSpace();
  if (!events) return c.notFound()
  return c.json(events);
};


export const getAllInscriptions = async (c: Context) => {
  const id = Number(c.req.param("id"));
  const res = await eventService.getAllInscriptions(id);
  return c.json(res);
};





export const removeEvent = async (c: Context) => {
  try {
    const id = Number(c.req.param('id'));
    await eventService.deleteEvent(id);
    return c.json({ message: "Eliminacion exitosa" }, 200);
  }
  catch (error) {
    console.error("Error al eliminar el evento:", error);
    if (error instanceof AppError) {
      console.error("AppError details:", error.message, "Status:", error.status);
      return c.json({ message: error.message }, { status: error.status as any });
    }
    return c.json(
      { message: "Error al eliminar evento", details: error instanceof Error ? error.message : error },
      501
    );

  }
};


export const getInfoEventInscription = async (c: Context) => {
  const id = Number(c.req.param("id"));
  const event = await eventService.getInfoEventInscription(id);
  if (!event) return c.notFound();
  return c.json(event);
};


export const editEvent = async (c: Context) => {
  try {
    const id = Number(c.req.param("id"));
    const body = await c.req.json();

    const reservationParse = reservationInsertSchema.safeParse(body.reservation)
    const eventParse = eventInsertSchemaM.safeParse(body.event)

    if (!reservationParse.success || !eventParse.success) {
      return c.json({
        error: {
          reservation: reservationParse.success ? null : reservationParse.error.flatten(),
          event: eventParse.success ? null : eventParse.error.flatten(),
        }
      }, 400);
    }

    const result = await eventService.editEvent(
      id,
      reservationParse.data,
      eventParse.data,
    );

    return c.json(result, 201);
  }
  catch (error) {
    console.error("Error al editar el evento:", error);
    if (error instanceof AppError) {
      console.error("AppError details:", error.message, "Status:", error.status);
      return c.json({ message: error.message }, { status: error.status as any });
    }
    return c.json(
      { message: "Error al editar evento", details: error instanceof Error ? error.message : error },
      501
    );

  }

}


export const reporteEventos  = async (c: Context) => {
    const data = await eventService.reporteEventos();
    return c.json(data)
  }

import type { Context } from 'hono';
import * as academyInscriptionService from '../../application/academy_inscription_service';
import { academyInscriptionInsertSchema } from '../../../../db/schema/AcademyInscription';
import { billInsertSchema } from '../../../../db/schema/Bill';
import { billDetailInsertSchema } from '../../../../db/schema/BillDetail';
import { inscriptionXUserInsertSchema } from '../../../../db/schema/InscriptionXUser';
import { eventInscriptionInsertSchema } from '../../../../db/schema/EventInscription';
import { z } from 'zod';
import * as eventInscriptionService from '../../../events/application/event_inscription_service';
import { formatDateToYMD } from '../../../../shared/utils/formatsTime';
import { getHistoricUserIdResponseSchema, mapHistoricToResponse } from '../../domain/histoiInscritionUserId';
import { AppError } from '../../../../shared/utils/AppError';
import { ZodError } from 'zod';
export const getAll = async (c: Context) => {
  const reservations = await academyInscriptionService.getAllAcademyInscription();
  return c.json(reservations);
};
export const getOne = async (c: Context) => {
  const id = Number(c.req.param('id'));
  const reservation = await academyInscriptionService.getAcademyInscriptionById(id);
  if (!reservation) return c.notFound();
  return c.json(reservation);
};
export const create = async (c: Context) => {
  const body = await c.req.json();
  const parsed = academyInscriptionInsertSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const result = await academyInscriptionService.createAcademyInscription(parsed.data);
  return c.json(result, 201);
};
export const update = async (c: Context) => {
  const id = Number(c.req.param('id'));
  const body = await c.req.json();
  const parsed = academyInscriptionInsertSchema.partial().safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  await academyInscriptionService.updateAcademyInscription(id, parsed.data);
  return c.body(null, 204);
};


export const removeInscription = async (c: Context) => {
  try {
    const body = await c.req.json();
    //console.log("Body received in removeInscription:", body);
    const parsed = z.object({
      userIds: z.array(z.number()),
      academyCourseId: z.number(),
    }).safeParse(body);
    if (!parsed.success) {
      throw new AppError("Debe proporcionar un ID de curso y al menos un usuario.", 400);
    }

    const result = await academyInscriptionService.deleteAcademyInscriptionsByCourseAndUsers(parsed.data.academyCourseId, parsed.data.userIds);

    const deletedCount = result?.rowCount ?? result?.length ?? 0;

    return c.json(
      {
        message: "Inscripciones eliminadas correctamente.",
        deletedCount,
      },
      200
    );
  } catch (error) {
    if (error instanceof AppError) {
      return c.json({ error: error.message }, { status: error.status as any }); // <- hack para status numérico
    }
    console.error("Unexpected error:", error);
    return c.json({ error: "Error interno del servidor." }, 500);
  }
};

export const createInscription = async (c: Context) => {
  try {
    const body = await c.req.json();

    // Validar la factura
    const billParse = billInsertSchema.safeParse(body.bill);
    //console.log("Parsed bill:", billParse);
    const billDetailsParse = z
      .array(billDetailInsertSchema.omit({ billId: true }))
      .safeParse(body.billDetails);
    //console.log("Parsed bill details:", billDetailsParse);
    // Validar inscripciones
    const inscriptionsParse = z
      .array(inscriptionXUserInsertSchema)
      .safeParse(body.inscriptions);
    //console.log("Parsed inscriptions:", inscriptionsParse);
    // Validar inscripciones a cursos académicos
    const academyInscriptionsParse = z
      .array(academyInscriptionInsertSchema.omit({ inscriptionXUserId: true, id: true }))
      .safeParse(body.academyCourseInscriptions);
    //console.log("Parsed academy course inscriptions:", academyInscriptionsParse);
    // Validar días seleccionados solo si se enviaron (para cursos flexibles)
    const hasDaySelections = Array.isArray(body.dataDaySelections);
    const daySelectionsParse = hasDaySelections
      ? z.array(z.array(z.number())).safeParse(body.dataDaySelections)
      : { success: true, data: undefined };
    //console.log("Has day selections:", hasDaySelections);
    //console.log("Parsed day selections:", daySelectionsParse);
    // Si alguna validación falla, responder con errores detallados
    if (
      !billParse.success ||
      !billDetailsParse.success ||
      !inscriptionsParse.success ||
      !academyInscriptionsParse.success ||
      !daySelectionsParse.success
    ) {
      console.error("Errores de validación:", {
        bill: billParse.success ? null : billParse.error.flatten(),
        billDetails: billDetailsParse.success ? null : billDetailsParse.error.flatten(),
        inscriptions: inscriptionsParse.success ? null : inscriptionsParse.error.flatten(),
        academyCourseInscriptions: academyInscriptionsParse.success
          ? null
          : academyInscriptionsParse.error.flatten(),
        daySelections: daySelectionsParse.success
          ? null
          : (hasDaySelections && 'error' in daySelectionsParse ? daySelectionsParse.error.flatten() : null),
      });

      return c.json(
        {
          error: {
            bill: billParse.success ? null : billParse.error.flatten(),
            billDetails: billDetailsParse.success ? null : billDetailsParse.error.flatten(),
            inscriptions: inscriptionsParse.success ? null : inscriptionsParse.error.flatten(),
            academyCourseInscriptions: academyInscriptionsParse.success
              ? null
              : academyInscriptionsParse.error.flatten(),
            daySelections: daySelectionsParse.success
              ? null
              : (hasDaySelections && 'error' in daySelectionsParse ? daySelectionsParse.error.flatten() : null),
          },
        },
        400
      );
    }

    // Llamar a la función de servicio con datos validados
    const result = await academyInscriptionService.createInscription(
      billParse.data,
      billDetailsParse.data,
      inscriptionsParse.data,
      academyInscriptionsParse.data,
      daySelectionsParse.data ? daySelectionsParse.data : undefined // si no hay, pasa undefined
    );

    return c.json(result, 201);
  } catch (error) {
    console.error("Error al crear la inscripción:", error);
    return c.json(
      {
        error: "Error al crear la inscripción",
        details: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
};



export const check = async (c: Context) => {
  const body = await c.req.json();
  const parsed = z.object({
    userId: z.number(),
    academyCourseId: z.number(),
  }).safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  try {
    // Si userIds es un array, llamar para cada usuario y devolver los resultados
    const results = await academyInscriptionService.areUsersInscribedInAcademyCourse(
      parsed.data.userId,
      parsed.data.academyCourseId
    );
    return c.json(results, 200);
  } catch (error) {
    console.error("Error checking inscriptions:", error);
    return c.json(
      { error: "Error checking inscriptions", details: error instanceof Error ? error.message : error },
      500
    );
  }
}

export const inscriptions = async (c: Context) => {
  const body = await c.req.json();
  const parsed = z.object({
    userIds: z.array(z.number()),
    academyCourseId: z.number(),
  }).safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  try {
    const result = await academyInscriptionService.getInscriptionDetailsForUsers(
      parsed.data.userIds,
      parsed.data.academyCourseId
    );
    return c.json(result, 200);
  } catch (error) {
    console.error("Error fetching inscription details:", error);
    return c.json(
      { error: "Error fetching inscription details", details: error instanceof Error ? error.message : error },
      500
    );
  }
};

export const getHistoricUserId = async (c: Context) => {
  const id = Number(c.req.param('id'));
  try {
    const rawHistoric = await academyInscriptionService.getHistoricUserId(id);
    //console.log("rawHistoric", rawHistoric);
    const response = mapHistoricToResponse(rawHistoric);
    //console.log("response", response)
    const parsed = getHistoricUserIdResponseSchema.parse(response);
    //console.log("parsed", parsed)
    return c.json(response);
  } catch (error) {
    if (error instanceof AppError) {
      return c.json({ error: error.message }, { status: error.status as any });
    }
    if (error instanceof ZodError) {
      console.error('❌ Error de validación al parsear historial de inscripción:');
      console.error(error.errors); // Lista de errores con path y mensaje
      return c.json(
        {
          success: false,
          error: 'Error de validación: ' + error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ')
        },
        400 // Código de estado HTTP opcional (Bad Request)
      );
    }
    return c.json(
      { error: "Ocurrió un error al consultar el historial de inscripcion a academias", details: error instanceof Error ? error.message : error },
      500
    );
  }
}
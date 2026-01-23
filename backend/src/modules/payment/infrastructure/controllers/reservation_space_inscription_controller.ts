import type { Context } from 'hono';
import * as eventService from '../../application/reservation_space_inscription_service';
import {
  billInsertSchema
} from '../../../../db/schema/Bill';
import {
  billDetailInsertSchema
} from '../../../../db/schema/BillDetail';
import {
  inscriptionXUserInsertSchema
} from '../../../../db/schema/InscriptionXUser';
import {
  reservationInscriptionInsertSchema
} from '../../../../db/schema/ReservationInscription';
import {
  reservationInsertSchema
} from '../../../../db/schema/Reservation'
import { AppError } from "../../../../shared/utils/AppError";

export const createInscription = async (c: Context) => {
  try {
    const body = await c.req.json();
    const nombre = body.nombre;
    const correo = body.correo;
    const espacio = body.espacio;
    
    const billParse = billInsertSchema.safeParse(body.bill);
    const detailParse = billDetailInsertSchema.omit({ billId: true }).safeParse(body.billDetail); // Omitimos billId
    const inscriptionParse = inscriptionXUserInsertSchema.safeParse(body.inscription); // Omitimos id
    const reservationInscriptionParse = reservationInscriptionInsertSchema.safeParse(body.reservationInscription);
    const reservationParse = reservationInsertSchema.safeParse(body.reservation)
    if (!billParse.success || !reservationParse.success || !detailParse.success || !inscriptionParse.success || !inscriptionParse.success || !reservationInscriptionParse.success) {
      return c.json({
        error: {
          bill: billParse.success ? null : billParse.error.flatten(),
          billDetail: detailParse.success ? null : detailParse.error.flatten(),
          inscription: inscriptionParse.success ? null : inscriptionParse.error.flatten(),
          // reservationInscription: reservationInscriptionParse.success ? null : reservationInscriptionParse.error.flatten(),
          reservation: reservationParse.success ? null : reservationParse.error.flatten(),
        }
      }, 400);
    }

    const result = await eventService.createInscription(
      nombre,
      correo,
      espacio,
      billParse.data,
      detailParse.data,
      inscriptionParse.data,
      reservationInscriptionParse.data,
      reservationParse.data,
    );

    return c.json(result, 201);
  } catch (error) {
    console.error("Error al eliminar el espacio:", error);
    if (error instanceof AppError) {
      console.error("AppError details:", error.message, "Status:", error.status);
      return c.json({ message: error.message }, { status: error.status as any });
    }
    return c.json(
      { message: "Error al eliminar espacio", details: error instanceof Error ? error.message : error },
      501
    );

  }

};

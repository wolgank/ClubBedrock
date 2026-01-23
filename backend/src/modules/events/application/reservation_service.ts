import { db } from "../../../db";
import { reservation} from "../../../db/schema/Reservation";
import { createReservationSchema} from "../../reservations/domain/reservation"
import type { CreateReservation } from "../../reservations/domain/reservation";
import { eq } from "drizzle-orm";


export const getAllReservations = () => db.select().from(reservation);

export const getReservationById = (id: number) =>
    db
      .select()
      .from(reservation)
      .where(eq(reservation.id, id))
      .then((res) => res[0]);
  
  export const createReservation = async (data: unknown) => {
    // Validar con Zod
    const parsedData = createReservationSchema.parse(data);
  
    // Convertir la fecha de string a Date
    const convertedData = {
      ...parsedData,
      date: new Date(parsedData.date), // Asegúrate de convertir 'date' a un objeto Date
      startHour: new Date(parsedData.startHour), // Convertir 'startHour' a Date también
      endHour: new Date(parsedData.endHour), // Si 'endHour' también es una fecha, conviértela a Date
    };
    // Insertar en la base de datos
    const insertId = await db
      .insert(reservation)
      .values(convertedData)
      .$returningId()
      .then((res) => res[0]);
  
    if (!insertId) {
      throw new Error("No se pudo obtener el ID de la reserva creada.");
    }
  
    const [createdReservation] = await db
      .select()
      .from(reservation)
      .where(eq(reservation.id, insertId.id));
  
    return createdReservation;
  };
export const updateReservation = async (
    id: number,
    data: Partial<Omit<CreateReservation, 'date'>> & { date?: string | Date }
  ) => {
    if (data.date) {
      data.date = new Date(data.date);
    }
  
    await db
      .update(reservation)
      .set(data as { date?: Date })
      .where(eq(reservation.id, id));
  
    const updated = await db
      .select()
      .from(reservation)
      .where(eq(reservation.id, id));
  
    if (!updated.length) {
      throw new Error("Reserva no encontrada para actualizar.");
    }
  
    return updated[0];
  };
  
  export const deleteReservation = (id: number) =>
    db.delete(reservation).where(eq(reservation.id, id));
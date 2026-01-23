import { db } from "../../../db";
import { bill as billTable, billInsertSchema } from "../../../db/schema/Bill";
import { billDetail as billDetailTable, billDetailInsertSchema } from "../../../db/schema/BillDetail"
import { inscriptionXUser as inscriptionXUserTable, inscriptionXUserInsertSchema } from "../../../db/schema/InscriptionXUser"
import { reservationInscription as reservationInscriptionTable, reservationInscriptionInsertSchema } from "../../../db/schema/ReservationInscription"
import { reservation as reservationTable, reservationInsertSchema } from "../../../db/schema/Reservation";
import { eq, and, lt, gt, between } from "drizzle-orm";
import { spaceDayTimeSlotForMember as spaceDayTimeSlotForMemberTable } from "../../../db/schema/SpaceDayTimeSlotForMember";
import { AppError } from "../../../shared/utils/AppError";
import * as notificationService from "../../notifications/application/notifications_service"
import * as eventController from "../../notifications/infrastructure/controllers/notifications_controller";

export const createInscription = async (
    nombre: string,
    correo: string,
    espacio: string,
    data: typeof billInsertSchema._input,
    dataBillDetail: Omit<typeof billDetailInsertSchema._input, "billId">,
    dataInscription: typeof inscriptionXUserInsertSchema._input,
    dataReservationInscription: typeof reservationInscriptionInsertSchema._input,
    dataReservation: typeof reservationInsertSchema._input,
) => {

    return await db.transaction(async (tx) => {
        const insertId = await tx
            .insert(billTable)
            .values({
                ...data,
                finalAmount: data.finalAmount.toString(),
                createdAt: new Date(data.createdAt),
                dueDate: new Date(data.dueDate),
            })
            .$returningId()
            .then((res) => res[0]);

        if (!insertId?.id) {
            throw new Error("Failed to retrieve the inserted billTable ID.");
        }
        const fullBillDetail = billDetailInsertSchema.parse({
            ...dataBillDetail,
            billId: insertId.id,
        });


        const billDetailInsertId = await tx
            .insert(billDetailTable)
            .values({
                billId: fullBillDetail.billId,
                price: String(fullBillDetail.price),
                finalPrice: String(fullBillDetail.finalPrice),
                discount: fullBillDetail.discount !== undefined ? String(fullBillDetail.discount) : undefined,
                description: fullBillDetail.description,
            })
            .$returningId()
            .then((res) => res[0]);


        if (!billDetailInsertId?.id) {
            throw new Error("Error insertando BillDetail");
        }

        await tx.insert(inscriptionXUserTable)
            .values({
                ...dataInscription,
                id: billDetailInsertId.id,
            })
            .execute();

        const reservationInsertId = await tx
            .insert(reservationTable)
            .values({
                ...dataReservation,
                date: new Date(dataReservation.date), // Convierte la fecha de string a Date
                startHour: new Date(dataReservation.startHour), // Convierte la fecha de string a Date
                endHour: new Date(dataReservation.endHour), // Convierte la fecha de string a Date
            })
            .$returningId()
            .then((res) => res[0]);

        if (!reservationInsertId?.id) {
            throw new Error("Failed to retrieve the inserted reservation ID.");
        }

        const reservationInscriptionId = await tx
            .insert(reservationInscriptionTable)
            .values({
                ...dataReservationInscription,
                inscriptionXUser: billDetailInsertId.id,
                reservationId: reservationInsertId.id,
            })
            .$returningId()
            .then((res) => res[0]);

        if (!reservationInscriptionId?.id) {
            throw new Error("Error insertando reservationInscription");
        }



        const startOfDay = new Date(dataReservation.date);
        startOfDay.setUTCHours(0, 0, 0, 0);

        const endOfDay = new Date(dataReservation.date);
        endOfDay.setUTCHours(23, 59, 59, 999);


        const start = new Date(dataReservation.startHour);
        const end = new Date(dataReservation.endHour);

        start.setSeconds(0, 0);
        end.setSeconds(0, 0);

        const overlappingSlots = await tx
            .select()
            .from(spaceDayTimeSlotForMemberTable)
            .where(
                and(
                    between(spaceDayTimeSlotForMemberTable.day, startOfDay, endOfDay),
                    eq(spaceDayTimeSlotForMemberTable.spaceUsed, dataReservation.spaceId),
                    eq(spaceDayTimeSlotForMemberTable.isUsed, true),
                    lt(spaceDayTimeSlotForMemberTable.startHour, end),
                    gt(spaceDayTimeSlotForMemberTable.endHour, start)
                )
            );
        console.log("overlappingSlots", overlappingSlots);
        console.log(start, end);

        if (overlappingSlots.length > 0) {
            const slot = overlappingSlots[0];
            const start = new Date(slot!.startHour).toLocaleTimeString("es-PE", { hour: '2-digit', minute: '2-digit' });
            const end = new Date(slot!.endHour).toLocaleTimeString("es-PE", { hour: '2-digit', minute: '2-digit' });
            throw new AppError(
                `Conflicto con una reserva existente: ${start} - ${end}.`,
                501
            );
        }

        
        try {
            await tx.insert(spaceDayTimeSlotForMemberTable).values({
                day: new Date(dataReservation.date),
                startHour: new Date(dataReservation.startHour),
                endHour: new Date(dataReservation.endHour),
                spaceUsed: dataReservation.spaceId,
                isUsed: true,
                pricePerBlock: 0,
            });
        } catch (error: any) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new AppError("Ya existe una reserva para este bloque de tiempo.", 409);
            }
            throw error; // Relanza si es otro error
        }







        const reservationDate = new Date(dataReservation.date);
        const targetDayOfWeek = reservationDate.getDay(); // 0 = domingo, ..., 6 = sábado

        const reservationStart = new Date(dataReservation.startHour);
        const reservationEnd = new Date(dataReservation.endHour);

        const targetStartTime = `${reservationStart.getHours()}:${reservationStart.getMinutes()}`;
        const targetEndTime = `${reservationEnd.getHours()}:${reservationEnd.getMinutes()}`;

        const availableSlots = await tx
            .select()
            .from(spaceDayTimeSlotForMemberTable)
            .where(
                and(
                    eq(spaceDayTimeSlotForMemberTable.spaceUsed, dataReservation.spaceId),
                    eq(spaceDayTimeSlotForMemberTable.isUsed, false)
                )
            );

        const matchingSlot = availableSlots.find(slot => {
            const slotDay = new Date(slot.day).getDay();
            const slotStart = new Date(slot.startHour);
            const slotEnd = new Date(slot.endHour);

            const slotStartTime = `${slotStart.getHours()}:${slotStart.getMinutes()}`;
            const slotEndTime = `${slotEnd.getHours()}:${slotEnd.getMinutes()}`;

            return (
                slotDay === targetDayOfWeek &&
                slotStartTime === targetStartTime &&
                slotEndTime === targetEndTime
            );
        });

        if (!matchingSlot) {
            throw new AppError(
                "El bloque de tiempo del espacio ya no se encuentra disponible para reserva.",
                409
            );
        }





        const startCORREO = new Date(dataReservation.startHour).toLocaleTimeString("es-PE", { hour: '2-digit', minute: '2-digit' });
        const endCORREO = new Date(dataReservation.endHour).toLocaleTimeString("es-PE", { hour: '2-digit', minute: '2-digit' });

        const message = `Estimado ${nombre},

Le confirmamos que su reserva del espacio "${espacio}" ha sido registrada exitosamente para el día ${new Date(dataReservation.date).toDateString()}, en el horario de ${startCORREO} a ${endCORREO}.

Por favor, asegúrese de asistir puntualmente y cumplir con las normas de uso del espacio.

Gracias por utilizar nuestro sistema de reservas.`

        await notificationService.enviarCorreo({
            to: correo,
            subject: 'Confirmación de reserva de espacio',
            message: message
        });



        // Todo bien, retorna si deseas
        return {
            billId: insertId.id,
            billDetailId: billDetailInsertId.id,
            reservationInscriptionId: reservationInscriptionId.id,
        };
    });
};

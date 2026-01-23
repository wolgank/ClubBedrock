import { EventInfo } from "@/shared/types/Activities";
import { Member } from "@/shared/types/Person";
import { sendEmailNotification } from "@/shared/utils/utils";
import { toast } from "sonner";

type CancellationResponseData = {
    message: string
}

export async function processCancellations(event: EventInfo, cancelledInscriptions: Member[], userFullname: string, userEmail: string) {
    //console.log(event);
    //console.log(cancelledInscriptions);

    //console.log("Anulaciones a realizar:", cancelledInscriptions);

    const cancellationReq = {
        "eventId": event.id,
        "userIds": cancelledInscriptions.map(newMember => newMember.id)
    }

    const cancellationRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/eventInscription/removeInscription`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(cancellationReq)
    })

    if(!cancellationRes.ok) {
        const data = await cancellationRes.json().catch(() => ({}));
        throw new Error(data.message || data.error || `Error ${cancellationRes.status}: No se pudo anular las inscripciones`);
    }

    const cancellationResData = await cancellationRes.json() as CancellationResponseData;
    toast.success("Anulaciones realizadas correctamente");

    //console.log("Respuesta de anulación:", cancellationResData);

    const emailReq = {
        email: userEmail,
        nombre: userFullname,
        tipo: 'eliminacionInscripcion',
        extra: {
            evento: event.name
        }
    }

    sendEmailNotification(emailReq);
    toast.success("Notificación de anulación enviada al correo");
}

/* -------------------------------------------------------------- */

type InscriptionResponseData = {
    billId: number,
    details: {
        billDetailId: number,
        eventInscriptionId: number
    }[]
}

export async function processNewInscriptions(event: EventInfo, newInscriptions: Member[], newInscriptionsTotalCost: number, userId: number, inscriptionDescription: string, userFullname: string, userEmail: string) {
    //console.log("Inscripciones a realizar", newInscriptions);    
    
    const now = new Date().toISOString();
    const description = inscriptionDescription
    const finalAmount = newInscriptionsTotalCost;
    const status = "PAID";

    const bill = {
        finalAmount,
        status,
        description,
        createdAt: now,
        dueDate: now,
        userId,
    }

    const billDetails = newInscriptions.map(() => {
        const priceMember =  event.ticketPriceMember;
        return {
            price: priceMember,
            finalPrice: priceMember,
            discount: 0
        };
    });
    const inscriptions = newInscriptions.map(member => {
        return {
            isCancelled: false,
            userId: member.id,
        };
    });

    const eventInscriptions = newInscriptions.map(() => {
        return {
            eventId: event.id,
            isCancelled: false,
            assisted: true
        }
    });

    const inscriptionReq = {
        bill,
        billDetails,
        inscriptions,
        eventInscriptions,
    }

    const inscriptionRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/eventInscription`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(inscriptionReq),
    });

    if (!inscriptionRes.ok) {
        const data = await inscriptionRes.json().catch(() => ({}));
        throw new Error(data.message || data.error || `Error ${inscriptionRes.status}: No se pudo registrar la inscripción al curso`);
    }

    const inscriptionResData = await inscriptionRes.json() as InscriptionResponseData;
    if(inscriptionResData.details.length === newInscriptions.length) {
        toast.success("Inscripciones realizadas exitosamente");
    } else {
        throw new Error(`Solo se inscribieron ${inscriptionResData.details.length} socios.`);
    }

    //console.log("Inscripción realizada:", inscriptionResData);

    const emailReq = {
        email: userEmail,
        nombre: userFullname,
        tipo: 'inscripcionExitosa',
        extra: {
            evento: event.name,
            fecha: now.slice(0, 10)
        }
    }

    sendEmailNotification(emailReq);
    toast.success("Notificación de inscripción enviada al correo");
}
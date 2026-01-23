import { toast } from "sonner";
import { AcademyCourseInscription } from "../../../utils/Academies";
import { AcademyCourse } from "@/shared/types/Activities";
import { weekDayNumber } from "../../../utils/utils";
import { sendEmailNotification } from "@/shared/utils/utils";

type CancellationResponseData = {
    message: string,
    deletedCount: number
}

// Los errores se capturan afuera
export async function processCancellations(
    course: AcademyCourse,
    cancelledInscriptions: AcademyCourseInscription[],
    userFullname: string,
    userEmail: string
) {
    //console.log("Anulaciones a realizar:", cancelledInscriptions);

    const cancellationReq = {
        "academyCourseId": course.id,
        "userIds": cancelledInscriptions.map(ins => ins.member.id)
    }

    const cancellationRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/academyInscription/removeInscription`, {
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
    if(cancellationResData.deletedCount === cancelledInscriptions.length) {
        toast.success(cancellationResData.message);
    } else {
        throw new Error(`Solo se eliminaron ${cancellationResData.deletedCount} inscripciones.`);
    }

    //console.log("Respuesta de anulación:",cancellationResData);

    // debería ser curso, pero sirve
    const emailReq = {
        email: userEmail,
        nombre: userFullname,
        tipo: 'eliminarInscripcionAcademiaCurso',
        extra: {
            curso: course.name
        }
    }

    sendEmailNotification(emailReq);
    toast.success("Notificación de anulación enviada al correo");
}

/* ---------------------------------------------------------- */

type InscriptionResponseData = {
    billId: number,
    details: {
        billDetailId: number,
        academyCourseInscriptionId: number
    }[]
}

export async function processNewInscriptions(
    course: AcademyCourse,
    newInscriptions: AcademyCourseInscription[],
    newInscriptionsTotalCost: number,
    userId: number,
    inscriptionDescription: string,
    userFullname: string,
    userEmail: string
) {
    //console.log("Inscripciones a realizar:", newInscriptions);

    const now = new Date().toISOString();
    
    const finalAmount = newInscriptionsTotalCost;
    const status = "PAID";
    const description = inscriptionDescription;

    const bill = {
        finalAmount,
        status,
        description,
        createdAt: now,
        dueDate: now,
        userId
    };

    const billDetails = newInscriptions.map(ins => {
        const priceXMember = Number(ins.pricingToApply.inscriptionPriceMember);
        return {
            price: priceXMember,
            finalPrice: priceXMember,
            discount: 0,
            description: `Inscripción del ${ins.member.memberType}`
        };
    });
    
    const inscriptions = newInscriptions.map(ins => {
        return {
            userId: ins.member.id,
            isCancelled: false
        };
    });

    const academyCourseInscriptions = newInscriptions.map(() => {
        return {
            academyCourseId: course.id,
            isCancelled: false
        }
    });

    const dataDaySelections = course.courseType === 'FIXED' ? null : newInscriptions.map(ins => {
        return ins.timeSlotsSelected.map(
            timeSlot => weekDayNumber[timeSlot.day]
        );
    });

    const inscriptionReq = {
        bill,
        billDetails,
        inscriptions,
        academyCourseInscriptions,
        dataDaySelections
    }
    
    const inscriptionRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/academyInscription`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(inscriptionReq)
    });

    if (!inscriptionRes.ok) {
        const data = await inscriptionRes.json().catch(() => ({}));
        throw new Error(data.message || data.details || data.error || `Error ${inscriptionRes.status}: No se pudo registrar la inscripción`);
    }

    const inscriptionResData = await inscriptionRes.json() as InscriptionResponseData;

    if(inscriptionResData.details.length === newInscriptions.length) {
        toast.success("Inscripciones realizadas exitosamente");
    } else {
        throw new Error(`Solo se inscribieron ${inscriptionResData.details.length} socios.`);
    }

    //console.log("Respuesta de inscripción:", inscriptionResData);

    // debería ser curso, pero sirve
    const emailReq = {
        email: userEmail,
        nombre: userFullname,
        tipo: 'confirmarInscripcionAcademiaCurso',
        extra: {
            curso: course.name,
            fechaInicio: course.startDate
        }
    }

    sendEmailNotification(emailReq);
    toast.success("Notificación de inscripción enviada al correo");
}

export function getInscriptionDescription(activityName: string, newInscriptionsLength: number) {
    return `${activityName} (${newInscriptionsLength} inscripci${newInscriptionsLength> 1 ? "ones" : "ón"}) - Club Bedrock`;
}
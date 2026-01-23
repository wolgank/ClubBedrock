import { Evento } from "../../modules/employee/event/pages/detalleEvent"
import { MiembrosInscritos } from "../../modules/employee/event/components/Participantssection"
import { EventoSpace } from "../../modules/employee/event/components/EventsSection"
import { AcademyType } from "../../modules/employee/sports/components/AcademiesSection"
import { InscriptionEVent } from "../../modules/employee/sports/components/ParticipantsSection"
import { RawCourse } from "../../modules/employee/sports/components/AcademyInfoSection"
import { AcademiaItem } from "../../modules/employee/sports/components/FormAssignAcademyCourse"

export async function getAllAcademies() {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/academy/all`, {credentials: "include",});
    const data = await res.json();
    return data as AcademyType[];
}

export async function getInfo(id: string) {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/academy/getInfo/${id}`, {credentials: "include",});
    const data = await res.json();
    return data;
}

export async function getOneAcademy(id: string) {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/academy/special/${id}`, {credentials: "include",});
    const data = await res.json();
    return data as AcademyType;
}

export async function getAcademyInscriptionById(id: string) {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/academy/inscription/${id}`, {credentials: "include",});
    const data = await res.json();
    return data as InscriptionEVent[];
}

export async function cancelAcademynscriptionById(id: string) {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/academy/cancelInscription/${id}`, {
        method: 'PUT',
        credentials: "include"
    });

    if (!res.ok) {
        try {
            const errorData = await res.json();
            const errorMessage = errorData?.message || 'Error al eliminar inscripción';
            throw new Error(errorMessage);
        } catch {
            throw new Error('Error al eliminar inscripción');
        }
    }

    if (res.status === 204) {
        return null;
    }

    return await res.json();
}

export async function getAllEventsByAcademy(id: string) {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/academy/course/${id}`, {credentials: "include",});
    const data = await res.json();
    return data as RawCourse[];
}

export async function getAllBasicAcademyInfo () {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/academy/allBasicInfo`, {credentials: "include",});
    const data = await res.json();
    return data as AcademiaItem[];
}

export async function deleteAcademyById(id: string) {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/academy/cancel/${id}`, {
        method: 'DELETE',
        credentials: "include"
    }); 
    if (!res.ok) {
        try {
            const errorData = await res.json();
            const errorMessage = errorData?.message || 'Error al eliminar la academia';
            throw new Error(errorMessage);
        } catch {
            throw new Error('Error al eliminar la academia');
        }
    }   
}

export async function reporteAcademias() {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/academy/reporteAcademias`, { credentials: "include", });
    const data = await res.json();
    return data;
}
import { Evento } from "../../modules/employee/event/pages/detalleEvent"
import { MiembrosInscritos } from "../../modules/employee/event/components/Participantssection"
import { EventoSpace } from "../../modules/employee/event/components/EventsSection"

export async function getEvent() {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/event`, {
        method: 'GET',
        credentials: 'include',
    });
    const data = await res.json();
    return data as Evento[];
}

export async function getAllInscription(id: string) {

    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/event/allInscription/${id}`, {credentials: "include",});

    if (!res.ok) {
        throw new Error("server error")
    }
    const data = await res.json();
    return data as MiembrosInscritos[];
}

export async function getEventSpace() {

    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/event/spaceInfo`, {credentials: "include",});

    const data = await res.json();
    return data as EventoSpace[];
}


export async function getEventById(id: string) {

    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/event/${id}`, {credentials: "include",});

    if (!res.ok) {
        throw new Error("server error")
    }
    const data = await res.json();
    return data as Evento;
}


export async function cancelEventInscriptionById(id: string) {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/eventInscription/cancelInscription/${id}`, {
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



export async function deleteEvent(id: string) {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/event/deleteEvent/${id}`, {
        method: 'DELETE',
        credentials: "include"
    });

    if (!res.ok) {
        try {
            const errorData = await res.json();
            const errorMessage = errorData?.message || 'Error al eliminar evento';
            throw new Error(errorMessage);
        } catch {
            throw new Error('Error al eliminar evento');
        }
    }

    if (res.status === 204) {
        return null;
    }

    return await res.json();
}



export async function getInfoEventInscription(id: string) {

    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/event/info/${id}`, {credentials: "include",});

    if (!res.ok) {
        throw new Error("server error")
    }
    const data = await res.json();
    return data;
}




export async function reporteEventos() {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/event/reporteEventos`, {credentials: "include",});
    const data = await res.json();
    return data;
}

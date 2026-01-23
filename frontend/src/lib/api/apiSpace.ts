import { Space } from '../../modules/member/reservation/pages/NuevaReserva'
import { ReservationInfo } from '@/modules/employee/sports/components/ReservationSpacesSection';

export async function getSpaceByType(type: 'LEISURE' | 'SPORTS') {

    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/space/type/${type}`, {credentials: "include",});

    const data = await res.json();
    return data as Space[];
}

export async function getSpace() {

    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/space`, {credentials: "include",});

    const data = await res.json();
    return data as Space[];
}


export async function getSpaceById(id: string) {

    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/space/${id}`, {credentials: "include",});

    const data = await res.json();
    return data as Space;
}

export async function getReservationsBySpaceId(id: string) {

    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/space/spaceReservation/${id}`, {credentials: "include",});

    const data = await res.json();
    return data as ReservationInfo[];
}


export async function disableSpaceById(id: string) {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/space/${id}`, {
        method: 'DELETE',
        credentials: "include"
    });

    if (!res.ok) {
        try {
            const errorData = await res.json();
            const errorMessage = errorData?.message || 'Error al eliminar espacio';
            throw new Error(errorMessage);
        } catch {
            throw new Error('Error al eliminar espacio');
        }
    }

    if (res.status === 204) {
        return null;
    }

    return await res.json();
}

export async function getSpaceLeisure() {

    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/space/getLeisureSpaces`, {credentials: "include",});

    const data = await res.json();
    return data as Space[];
}



export async function getSpaceSports() {

    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/space/getSportsSpaces`, {credentials: "include",});

    const data = await res.json();
    return data as Space[];
}
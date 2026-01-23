import { ReservationInscription } from '../../modules/member/reservation/pages/Reservas'


export async function deleteReservation({ id }: { id: number }) {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/reservationInscription/${id}`, {
        method: 'DELETE',
        credentials: "include"
    });
    if (!res.ok) {
        throw new Error("server error");
    }
}


export async function getReservationInscription(id: string) {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/reservationInscription/${id}`, { credentials: "include", });
    if (!res.ok) {
        throw new Error("server error")
    }
    const data = await res.json();
    return data as ReservationInscription[];
}


export async function getInfoSpace(id: string) {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/reservationInscription/getInfo/${id}`, { credentials: "include", });
    if (!res.ok) {
        throw new Error("server error")
    }
    const data = await res.json();
    return data;
}

export async function reporteEspacioDeportivo() {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/reservationInscription/reporteEspacioDeportivo`, { credentials: "include", });
    const data = await res.json();
    return data;
}



export async function reporteEspacioLeisure() {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/reservationInscription/reporteEspacioLeisure`, { credentials: "include", });
    const data = await res.json();
    return data;
}

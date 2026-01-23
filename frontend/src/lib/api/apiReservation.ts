export async function getSpecialReservationsBySpaceId(id: string) {

    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/reservation/getSpecialReservations/${id}`, {credentials: "include",});

    if (!res.ok) {
        throw new Error("server error")
    }
    const data = await res.json();
    return data;
}


export async function deleteReservationById({ id }: { id: number }) {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/reservation/${id}`, {
        method: 'DELETE',
        credentials: "include"
    });
    if (!res.ok) {
        throw new Error("server error");
    }
}

export async function getCorreoByUserId (id: string) {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/reservation/getCorreoByUserId/${id}`, {credentials: "include",});
        if (!res.ok) {
        throw new Error("server error")
    }
    const data = await res.json();
    return data;
}
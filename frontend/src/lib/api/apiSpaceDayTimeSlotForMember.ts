import { SpaceDayTimeSlotForMember } from '../../modules/member/reservation/pages/NuevaReserva'
import { SlotTime } from '../../modules/member/reservation/pages/NuevaReserva';
import { SpecialType } from '../../modules/member/reservation/pages/NuevaReserva';

export async function getTimeSlotById(id: string) {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/spaceDayTimeSlotForMember/${id}` , {
        credentials: "include",
    });
    const data = await res.json();
    return data as SpaceDayTimeSlotForMember[];
}


export async function getTimeSlotDaySpaceId(id: string, date: string) {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/spaceDayTimeSlotForMember/getSpaceTime?id=${id}&date=${date}`, {credentials: "include",});
    const data = await res.json();
    return data as string[];
}

export async function getNoTimeSlotDaySpaceId(id: string, date: string) {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/spaceDayTimeSlotForMember/noGetSpaceTimeById?id=${id}&date=${date}`, {credentials: "include",});
    const data = await res.json();
    return data as string[];
}

export async function getTimeSlotDaySpaceIdDouble(id: string) {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/spaceDayTimeSlotForMember/getSpaceTimeById?id=${id}`, {credentials: "include",});
    const data = await res.json();
    return data as SpecialType[];
}

export async function getTimeSlotDaySpaceIdALL(id: string) {

    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/spaceDayTimeSlotForMember/getSpaceTimeALL?id=${id}`, {credentials: "include",});

    const data = await res.json();
    return data as SpaceDayTimeSlotForMember[];
}

export async function deleteSpaceDayTimeSlotForMember({ id }: { id: number }) {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/spaceDayTimeSlotForMember/${id}`, {

        method: 'DELETE',
        credentials: "include",

    });
    if (!res.ok) {
        throw new Error("server error");
    }
}


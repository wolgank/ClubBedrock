import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import NavigationSection from "../components/NavigationSection";
import { useParams, useNavigate } from 'react-router-dom';
import DashboardEventsSection from "../components/SpacesEventsSection";
import EventInfoSection from "../components/EventInfoSection";
import { z } from "zod"
import * as React from "react"
import { useState } from "react";
import ConfirmDeleteModal from "../components/ConfirmDeleteModalSpace"
import { useQuery } from "@tanstack/react-query";
import { getEvent, getInfoEventInscription } from "@/lib/api/apiEvent";
import { Mutation } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { cancelEventInscriptionById } from "@/lib/api/apiEvent";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";


//--------------------------data--------------------------
// Schema definition
export const schema = z.object({
    id: z.number(),
    name: z.string(),
    date: z.string(),
    spaceUsed: z.string(),
    capacity: z.number(),
    allowOutsiders: z.boolean(),
    startHour: z.string(),
    endHour: z.string(),
    ticketPriceMember: z.number(),
    ticketPriceGuest: z.number(),
    description: z.string(),
    urlImage: z.string()
})

type EventItem = z.infer<typeof schema>


//--------------------------data fin--------------------------
export type Evento = {
    id: number,
    name: string,
    date: string,
    startHour: string,
    endHour: string,
    spaceUsed: string,
    ticketPriceMember: number,
    ticketPriceGuest: number,
    capacity: number,
    urlImage: string,
    isActive: boolean,
    description: string,
    allowOutsiders: boolean,
    numberOfAssistants: number,
    reservationId: number,
    spaceName: string,
    spaceId: number

}


// DataTable component

import { getEventById } from "@/lib/api/apiEvent";


export default function DetalleEvent() {
    const queryClient = useQueryClient();
    const { id } = useParams<{ id: string }>();

    const { isPending: cargandoDatos, error, data: dataEvento } = useQuery({
        queryKey: ['get-Event-id', id],
        queryFn: () => getEventById(id.toString()),
        enabled: !!id,
    });



    const evento: EventItem | undefined = React.useMemo(() => {
        if (!dataEvento) return undefined;

        return {
            id: dataEvento.id,
            name: dataEvento.name,
            date: dataEvento.date.split("T")[0],
            spaceUsed: dataEvento.spaceName,
            capacity: dataEvento.capacity,
            allowOutsiders: !dataEvento.allowOutsiders,
            startHour: dataEvento.startHour,
            endHour: dataEvento.endHour,
            ticketPriceMember: dataEvento.ticketPriceMember,
            ticketPriceGuest: dataEvento.ticketPriceGuest,
            description: dataEvento.description,
            urlImage: dataEvento.urlImage,
        };
    }, [dataEvento]);

    const navigate = useNavigate();
    const eventoId = Number(id)



    const [isModalOpen, setModalOpen] = useState(false);
    const [toDelete, setToDelete] = useState<{ id: number; name: string; eve: string, correo: string } | null>(null);

    const { data: dataInfo, refetch: refetchDataInfoInscription, } = useQuery({
        queryKey: ['get-info-event-inscription', id],
        queryFn: () => getInfoEventInscription(id.toString()),
        enabled: false, // No se ejecuta hasta que se llama a handleRequestDelete
    });

    const mutation = useMutation({
        mutationFn: cancelEventInscriptionById,

        onSuccess: () => {
            setModalOpen(false);
            setToDelete(null);
            //console.log("SE BOROOOOOOO")
            queryClient.invalidateQueries({ queryKey: ['get-all-inscriptions'] });

            toast.success(
                <>
                    <strong>Inscripción cancelada correctamente.</strong>
                </>
            );

        },
        onError: (error: any) => {
            console.error("Error en la mutación:", error.message || error);
            toast.error(
                <>
                    <strong>Error al eliminar inscripción.</strong>
                    <div>{error?.message || "Error desconocido"}</div>
                </>
            );

        },
    });



    const handleConfirmDelete = async () => {
        if (toDelete) {

            try {
                mutation.mutate(toDelete.id.toString());

                //console.log("Datos del evento a eliminar:", toDelete);

                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/notifications`, {
                    method: "POST",
                    credentials: "include",
                    body: JSON.stringify({
                        email: toDelete.correo,
                        nombre: toDelete.name,
                        tipo: "eliminacionInscripcion",
                        extra: {
                            evento: toDelete.eve,
                        },
                    }),
                });

                if (!response.ok) throw new Error("Error al enviar el correo");

                const result = await response.json();
                //console.log("Correo enviado correctamente:", result);
            } catch (error) {
                console.error("Error al enviar el correo:", error);
            }

        }

    };

    // Se invoca cuando el usuario hace click en “Eliminar” en la tabla
    const handleRequestDelete = (id: number, name: string, eve: string, correo: string) => {
        setToDelete({ id, name, eve, correo });
        setModalOpen(true);
    };

    if (!evento) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-semibold">Evento no encontrado</h2>
                <Button variant="link" onClick={() => navigate(-1)}>
                    Volver atrás
                </Button>
            </div>
        )
    }


    if (cargandoDatos) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-semibold">Cargando evento...</h2>
            </div>
        )
    }


    // Borrado real: llama a tu API, actualiza estado, etc.
    return (
        <div className="flex flex-col items-center justify-center gap-[35px] px-[34px] py-[57px] ">
            <div className="relative w-full max-w-[1343px]">
                <Button
                    onClick={() => navigate(-1)}
                    variant="ghost"
                    className="navigate-custom"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="font-normal text-base">Regresar</span>
                </Button>
            </div>

            <div className="relative w-full max-w-[1343px] text-center">
                <DashboardEventsSection />
            </div>

            <div className="relative w-full max-w-[1343px] text-center">
                <NavigationSection />
            </div>
            <div className="relative w-full max-w-[1343px] flex items-center justify-center text-center">
                <h1 className="font-bold text-5xl leading-[48px]">
                    {evento.name}
                </h1>

                {evento.allowOutsiders && (
                    <span className="ml-4 inline-block bg-[#318161] text-white text-2xl font-semibold px-3 py-1 rounded-full shadow-[0_0_5px_0px_rgba(0,0,0,0)] shadow-gray-500 ">
                        Solo socios
                    </span>
                )}
            </div>
            <main className="flex flex-wrap w-full max-w-[1339px] gap-10 p-[30px]  rounded-2xl overflow-hidden background-custom">
                <EventInfoSection evento={evento} onRequestDeleteParticipant={handleRequestDelete} />
            </main>
            {/* --- Modal --- */}
            {isModalOpen && (
                <div
                    // Backdrop: clic fuera cierra modal
                    className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
                    onClick={() => {
                        if (!mutation.isPending) {
                            setModalOpen(false);
                            setToDelete(null);
                        }
                    }}
                >
                    {/* Evitamos que el click en el modal “burbujee” al backdrop */}
                    <div onClick={e => e.stopPropagation()}>
                        <ConfirmDeleteModal
                            name={toDelete?.name || ""}
                            onAccept={handleConfirmDelete}
                            onCancel={() => {
                                if (!mutation.isPending) {
                                    setModalOpen(false);
                                    setToDelete(null);
                                }
                            }}
                            isLoading={mutation.isPending}
                        />
                    </div>
                </div>
            )}
        </div >

    );
}
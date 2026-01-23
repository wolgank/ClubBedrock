import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import NavigationSection from "../components/NavigationSpaces";
import { useParams, useNavigate } from 'react-router-dom';
import SpacesAcademiesSection from "../components/SpacesAcademiesSection";
import SpaceInfoSection from "../components/SpaceInfoSection";
import { z } from "zod"
import { useState } from "react";
import ConfirmDeleteModal from "../components/ConfirmDeleteModalSpace"
import { getSpaceById } from "@/lib/api/apiSpace";
import { useQuery } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { deleteReservation, getInfoSpace } from "@/lib/api/apiReservationInscription"
import { useEffect } from "react";
import { toast } from "sonner"

//--------------------------data--------------------------
// Schema definition
export const spaceSchema = z.object({
    id: z.number(),
    name: z.string(),
    description: z.string(),
    reference: z.string(),
    capacity: z.number(),
    costPerHour: z.string(),
    urlImage: z.string(),
    canBeReserved: z.boolean(),
    isAvailable: z.boolean(),
    type: z.enum(["SPORTS", "LEISURE"]),
})

export type SpaceItem = z.infer<typeof spaceSchema>

export default function DetailSpace() {

    useEffect(() => {
        async function fetchUser() {
            // setLoading(false);
            try {
                const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/me`, {
                    method: "GET",
                    credentials: "include", // importante para enviar cookies de sesión
                });
                if (!res.ok) {
                    // setError("No se encontró el usuario");
                    return;
                }
                const parsedUser = await res.json();
                //console.log("Parsed user:", parsedUser);
                // setUserID(String(parsedUser.user.id));
                // setFullName(String(parsedUser.user.name) + ' ' + String(parsedUser.user.lastname));
            } catch (e) {
                console.error("Error al obtener el usuario:", e);
                // setError("Error al obtener el usuario");
            }
        }
        fetchUser();
    }, []);

    const queryClient = useQueryClient();

    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { isLoading: cargandoDatos, error: errorTimeSlot, data } = useQuery({
        queryKey: ['get-space-id', id],
        queryFn: () => getSpaceById(id.toString()),
        enabled: !!id,
    });


    const [isModalOpen, setModalOpen] = useState(false);
    const [toDelete, setToDelete] = useState<{ id: number; name: string; espacio: string; correo: string } | null>(null);


    const mutation = useMutation({
        mutationFn: deleteReservation,

        onSuccess: () => {
            setModalOpen(false);
            setToDelete(null);
            //console.log("SE BOROOOOOOO")
            queryClient.invalidateQueries({ queryKey: ['get-space-reservations'] });

            toast.success(
                <>
                    <strong>Reserva eliminada correctamente.</strong>
                </>
            );

        },
        onError: (error: any) => {
            console.error("Error en la mutación:", error.message || error);
            toast.error("Error al eliminar reserva: " + (error.message || "Error desconocido"));
        },
    });



    // Borrado real: llama a tu API, actualiza estado, etc.
    const handleConfirmDelete = async () => {
        if (toDelete) {
            mutation.mutate({ id: toDelete.id });

            try {
                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/notifications`, {
                    method: "POST",
                    body: JSON.stringify({
                        email: toDelete.correo,
                        nombre: toDelete.name,
                        tipo: "eliminacionReserva",
                        extra: {
                            espacio: toDelete.espacio,
                        }
                    }),
                    credentials: "include",
                });

                if (!response.ok) throw new Error("Error al enviar el correo");
                const result = await response.json();
                //console.log("Archivo subido correctamente:", result);
            } catch (error) {
                console.error("Fallo en la subida:", error);
            }
        }
    };

    // Se invoca cuando el usuario hace click en “Eliminar” en la tabla
    const handleRequestDelete = (id: number, name: string, espacio: string, correo: string) => {
        setToDelete({ id, name, espacio, correo });
        //console.log("handleRequestDelete", id, name);
        setModalOpen(true);
    };
    if (cargandoDatos) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-semibold">Cargando espacio...</h2>
            </div>
        )
    }

    if (!data) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-semibold">Espacio no encontrado</h2>
                <Button variant="link" onClick={() => navigate(-1)}>
                    Volver atrás
                </Button>
            </div>
        )
    }

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
                <SpacesAcademiesSection />
            </div>

            <div className="relative w-full max-w-[1343px] text-center">
                <NavigationSection />
            </div>
            <div className="relative w-full max-w-[1343px] flex items-center justify-center text-center">
                <h1 className="font-bold text-5xl leading-[48px]">
                    {data.name}
                </h1>
            </div>
            <main className="flex flex-wrap w-full max-w-[1339px] gap-10 p-[30px]  rounded-2xl overflow-hidden background-custom">
                <SpaceInfoSection space={data} onRequestDeleteReservation={handleRequestDelete} />
            </main>
            {/* --- Modal --- */}
            {isModalOpen && (
                <div
                    // Backdrop: clic fuera cierra modal
                    className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
                    onClick={() => {
                        setModalOpen(false);
                        setToDelete(null);
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
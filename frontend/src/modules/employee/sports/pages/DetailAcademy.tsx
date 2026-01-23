import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import NavigationSection from "../components/NavigationAcademies";
import { useParams, useNavigate } from 'react-router-dom';
import SpacesAcademiesSection from "../components/SpacesAcademiesSection";
import AcademyInfoSection from "../components/AcademyInfoSection";
import { useState } from "react";
import ConfirmDeleteModal from "../components/ConfirmDeleteModalAcademy";
import { AcademyItem, AcademySchema } from "../components/AcademiesSection";
import { useQuery } from "@tanstack/react-query";
import { getOneAcademy } from "@/lib/api/apiAcademy";
import { AcademyType } from "../components/AcademiesSection";
import { useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useEffect } from "react";
import {
    cancelAcademynscriptionById, getInfo

} from "@/lib/api/apiAcademy";
import { toast } from "sonner";
export default function DetailAcademy() {
    const queryClient = useQueryClient();


    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [isModalOpen, setModalOpen] = useState(false);
    const [toDelete, setToDelete] = useState<{ id: number; name: string; curso: string; correo: string } | null>(null);
    const [academyName, setAcademyName] = useState<string>("");

    const { error: errorTimeSlot, data } = useQuery({
        queryKey: ['get-one-academy', id],
        queryFn: () => getOneAcademy(id.toString()),
        enabled: !!id,
    });


    const transformAcademy = (data: AcademyType): AcademyItem => {
        return {
            id: data.id,
            name: data.name,
            deporte: data.sport, // renombrado
            numeroCursos: data.numeroCursos,
            numeroInscritos: Number(data.numeroInscritos), // conversión
            description: data.description,
            urlImage: data.urlImage
        };
    }

    const AcademyId = Number(id);
    const selectAcademy = useMemo(() => {
        //console.log("ACADEMY ID", data);
        return data ? transformAcademy(data) : undefined;
    }, [data]);

    // Se invoca cuando el usuario hace click en “Eliminar” en la tabla
    const handleRequestDelete = (id: number, name: string, curso: string, correo: string) => {
        setToDelete({ id, name, curso, correo });
        setModalOpen(true);
    };




    const mutation = useMutation({
        mutationFn: cancelAcademynscriptionById,

        onSuccess: () => {
            setModalOpen(false);
            setToDelete(null);
            //console.log("SE BOROOOOOOO")
            queryClient.invalidateQueries({ queryKey: ['get-academy-inscriptions'] });

            toast.success(
                <>
                    <strong>Inscripción eliminada correctamente.</strong>
                </>
            );
        },
        onError: (error: any) => {
            console.error("Error en la mutación:", error.message || error);
            toast.error("Error al eliminar reserva: " + (error.message || "Error desconocido"));
        },
    });


    useEffect(() => {
        if (data) {
            const { name } = transformAcademy(data);
            setAcademyName(name);
        }
    }, [data]);
    // Borrado real: llama a tu API, actualiza estado, etc.
    const handleConfirmDelete = async () => {
        if (toDelete) {
            mutation.mutate(toDelete.id.toString());

            try {
                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/notifications`, {
                    method: "POST",
                    body: JSON.stringify({
                        email: toDelete.correo,
                        nombre: toDelete.name,
                        tipo: "eliminarInscripcionAcademiaCurso",
                        extra: {
                            curso: toDelete.curso,
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

    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <h2 className="text-2xl font-bold">Academia no encontrada</h2>
                <Button onClick={() => navigate(-1)}>Volver</Button>
            </div>
        );
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
                    {academyName}
                </h1>
            </div>
            <main className="flex flex-wrap w-full max-w-[1339px] gap-10 p-[30px]  rounded-2xl overflow-hidden background-custom">
                <AcademyInfoSection academy={selectAcademy} urlImage={selectAcademy.urlImage} idAcademy={selectAcademy.id} onRequestDeleteReservation={handleRequestDelete} onNameChange={setAcademyName} />
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
                                setModalOpen(false);
                                setToDelete(null);
                            }}
                            cargando={mutation.isPending}
                        />
                    </div>
                </div>
            )}
        </div >

    );
}
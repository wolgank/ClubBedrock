import { useUser } from "@/shared/context/UserContext";
import { AcademyCourse } from "@/shared/types/Activities";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function useCourseInscriptionCheck(course: AcademyCourse) {
    const [loadingInscribed, setLoadingInscribed] = useState(true);
    const [inscribedList, setInscribedList] = useState<Record<string, boolean> | null>(null);

    const { user } = useUser();

    useEffect(() => {
        const fetchInscribedList = async () => {
            setLoadingInscribed(true);
            setInscribedList(null);

            if(!course) return;
    
            try {
                if(!user?.id) throw new Error("No se pudo obtener el ID del usuario autenticado.");
                
                const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/academyInscription/check`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        "userId": user.id,
                        "academyCourseId": course.id
                    })
                });
                
                if(!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    throw new Error(data.message || `Error ${res.status}: No se pudo verificar las inscripciones del curso`);
                }
    
                const data = await res.json() as Record<string, boolean>;
                setInscribedList(data);
            }
            catch(err: unknown) {
                const msg = err instanceof Error ? err.message : 'Error desconocido';
                console.error("Error al verificar las inscripciones del curso: ", msg);
                toast.error(msg);
            } finally {
                setLoadingInscribed(false);
            }
        };

        fetchInscribedList();
    }, [course, user?.id]);

    return { inscribedList, loadingInscribed };
}
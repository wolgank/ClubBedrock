import { useUser } from "@/shared/context/UserContext";
import { type Academy, type AcademyCourse } from "@/shared/types/Activities";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function useAcademyCourses(academy: Academy) {
    const [courses, setCourses] = useState<AcademyCourse[]>([]);
    const [loadingCourses, setLoadingCourses] = useState(true);

    const { user } = useUser();

    useEffect(() => {
        const fetchCourses = async () => {
            setLoadingCourses(true);
            setCourses([]);
            if(!academy) return;
            
            try {
                if(!user?.id) throw new Error("No se pudo obtener el ID del usuario autenticado.");
                
                const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/academy/course/${academy.id}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                });
                
                if(!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    throw new Error(data.message || `Error ${res.status}: No se pudieron obtener los cursos de la academia`);
                }
    
                const data = await res.json() as AcademyCourse[];
                setCourses(data);
            }
            catch(err: unknown) {
                const msg = err instanceof Error ? err.message : 'Error desconocido';
                console.error("Error al obtener cursos de la academia: ", msg);
                toast.error(msg);
            } finally {
                setLoadingCourses(false);
            }
        }

        fetchCourses();
    }, [academy, user?.id]);

    return { courses, loadingCourses };
}
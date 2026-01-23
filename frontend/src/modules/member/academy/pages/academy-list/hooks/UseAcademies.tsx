import { useUser } from "@/shared/context/UserContext";
import { Academy } from "@/shared/types/Activities";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function useAcademies() {
    const [academies, setAcademies] = useState<Academy[] | null>(null);
    const [loadingAcademies, setLoadingAcademies] = useState(true);

    const { user } = useUser();

    useEffect(() => {
        const fetchAcademies = async () => {
            setLoadingAcademies(true);
            setAcademies(null);
        
            try {
                if(!user?.id) throw new Error("No se pudo obtener el ID del usuario autenticado.");
    
                const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/academy`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                })
    
                if(!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    throw new Error(data.message || `Error ${res.status}: No se pudieron obtener las academias`);
                }
    
                const data = await res.json() as Academy[];
                setAcademies(data);
            }
            catch(err: unknown) {
                const msg = err instanceof Error ? err.message : 'Error desconocido';
                console.error("Error al obtener academias: ", msg);
                toast.error(msg);
            }
            finally {
                setLoadingAcademies(false);
            }
        };

        fetchAcademies();
    }, [user?.id]);

    return { academies, loadingAcademies };
}
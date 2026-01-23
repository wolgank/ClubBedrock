import { useUser } from "@/shared/context/UserContext";
import { EventInfo } from "@/shared/types/Activities";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function useUserEvents() {
    const [userEvents, setUserEvents] = useState<EventInfo[]>([]);
    const [loadingUserEvents, setLoadingUserEvents] = useState(true);

    const { user } = useUser();

    useEffect(() => {
        const fetchUserEvents = async () => {
            setLoadingUserEvents(true);
            setUserEvents(null);

            try {
                if(!user?.id) throw new Error("No se pudo obtener el ID del usuario autenticado.");
    
                const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/eventInscription/historicUserId/${user.id}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include'
                })
                        
                if(!res.ok) {
                    const data = await res.json().catch(() => ({}))
                    throw new Error(data.message || `Error ${res.status}: No se pudo obtener el historial de eventos`)
                }
                
                const data = await res.json() as EventInfo[];
                //console.log("aver los eventos históricos", data);
                setUserEvents(data);
            }
            catch (err: unknown) {
                setUserEvents([]);
                const msg = err instanceof Error ? err.message : 'Error desconocido';
                console.error('Error al obtener el historial de eventos:', msg);
                toast.error(msg);
            } finally {
                setLoadingUserEvents(false);
            }
        };

        fetchUserEvents();
    }, [user?.id]);

    return { userEvents, loadingUserEvents };
}
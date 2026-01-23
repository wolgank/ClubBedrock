import { useUser } from "@/shared/context/UserContext";
import { EventInfo } from "@/shared/types/Activities";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type DataType = {
    result: Record<string, boolean>;
}

export default function useEventInscriptionCheck(event: EventInfo) {
    const [loadingInscribed, setLoadingInscribed] = useState(true);
    const [inscribedList, setInscribedList] = useState<Record<string, boolean> | null>(null);

    const { user } = useUser();

    useEffect(() => {
        const fetchInscribedList = async () => {
            setLoadingInscribed(true);
            setInscribedList(null);

            if(!event) return;
    
            try {
                if(!user?.id) throw new Error("No se pudo obtener el ID del usuario autenticado.");
                
                const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/eventInscription/check`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        "userId": user.id,
                        "eventId": event.id
                    })
                });
                
                if(!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    throw new Error(data.message || `Error ${res.status}: No se pudo verificar las inscripciones del evento`);
                }
    
                const data = await res.json() as DataType;
                //console.log("aver las inscripciones", data.result);
                setInscribedList(data.result);
            }
            catch(err: unknown) {
                const msg = err instanceof Error ? err.message : 'Error desconocido';
                console.error("Error al verificar las inscripciones del evento: ", msg);
                toast.error(msg);
            } finally {
                setLoadingInscribed(false);
            }
        };

        fetchInscribedList();
    }, [event, user?.id]);

    return { inscribedList, loadingInscribed };
}
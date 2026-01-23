import { useEffect, useState } from "react";
import { type MemberType } from "../types/Person";
import { useUser } from "../context/UserContext";
import { toast } from "sonner";

type MemberTypeData = {
    name: MemberType
}

export default function useMemberType() {
    const [memberType, setMemberType] = useState<MemberType | null>(null);
    const [loadingMemberType, setLoadingMemberType] = useState(true);

    const { user } = useUser();

    useEffect(() => {
        const fetchMemberType = async () => {
            setLoadingMemberType(true);
            setMemberType(null);

            try {
                if(!user?.id) throw new Error("No se pudo obtener el ID del usuario autenticado.");
    
                const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/members/myType/${user.id}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include'
                })
                        
                if(!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    throw new Error(data.message || `Error ${res.status}: No se pudo obtener el tipo de usuario.`);
                }
                
                const data = await res.json() as MemberTypeData[];
                //console.log("hook de memberType", data);
                setMemberType(data[0].name); // arreglen esto xd
            }
            catch (err: unknown) {
                const msg = err instanceof Error ? err.message : 'Error desconocido';
                console.error('Error al obtener miembros de membresía:', msg);
                toast.error(msg);
            } finally {
                setLoadingMemberType(false);
            }
        }

        fetchMemberType();
    }, [user?.id]);

    return { memberType, loadingMemberType };
}
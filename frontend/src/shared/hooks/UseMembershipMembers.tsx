import { type Member } from "../types/Person";
import { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";
import { toast } from "sonner";

export default function useMembershipMembers() {
  const [membershipMembers, setMembershipMembers] = useState<Member[] | null>(null);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const { user } = useUser();
  
  useEffect(() => {
    const fetchMembers = async () => {
        setLoadingMembers(true);
        setMembershipMembers(null);
            
        try {
            if(!user?.id) throw new Error("No se pudo obtener el ID del usuario autenticado.");

            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/membershipXMember/${user.id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            })
                    
            if(!res.ok) {
                const data = await res.json().catch(() => ({}))
                throw new Error(data.message || `Error ${res.status}: No se pudo obtener los miembros de la membresía`)
            }
            
            const data = await res.json() as Member[];
            if(data.length === 0) throw new Error("Se encontraron 0 miembros en la membresía");
            setMembershipMembers(data);
        }
        catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error desconocido';
            console.error('Error al obtener miembros de membresía:', msg);
            toast.error(msg);
        } finally {
            setLoadingMembers(false);
        }
    }
    
    fetchMembers();
  }, [user?.id]);

  return { membershipMembers, loadingMembers };
}
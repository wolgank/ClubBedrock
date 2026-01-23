// src/modules/user/membership/pages/GestionFamiliaresPage.tsx
import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import AddFamiliarModal from "../components/AddFamiliarModal";
import FamilyRequestsTable from "../components/FamilyRequestTable";
import FamilyGrid from "../components/FamilyGrid";
import { Familiar } from "../components/FamilyCard";
import { toast } from "sonner";
import { useMembershipStatus } from "@/shared/hooks/useMembershipStatus"; 
import { useUser } from "@/shared/context/UserContext";

export default function GestionFamiliaresPage() {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const { user } = useUser();
  const { readOnly, loading: statusLoading } = useMembershipStatus();
  /* ───── 2 estados separados ───── */
  const [members, setMembers] = useState<Familiar[]>([]);   // /api/members/familiars
  const [requests, setRequests] = useState<Familiar[]>([]); // /api/member-requests/family
  const [open, setOpen] = useState(false);

  /* ───────── carga ambos endpoints ───────── */
  const fetchFamily = useCallback(async () => {
    try {
      const [memRes, reqRes] = await Promise.all([
        fetch(`${backendUrl}/api/members/familiars`, { credentials: "include" }),
        fetch(`${backendUrl}/api/member-requests/family`, {
          credentials: "include",
        }),
      ]);
      if (!memRes.ok || !reqRes.ok)
        throw new Error("Alguna petición devolvió error");

      const [memData, reqData] = await Promise.all([
        memRes.json(),
        reqRes.json(),
      ]);

      setMembers(memData.map(mapMember));
      setRequests(reqData.map(mapRequest));
    } catch (err) {
      console.error(err);
      toast.error("No se pudo cargar la lista de familiares.");
    }
  }, [backendUrl]);

  /* primera carga + refrescos */
  useEffect(() => {
    fetchFamily();
  }, [fetchFamily]);

  /* ───── Render ───── */
  return (
    <>
      {/* Botón de alta solo cuando NO es solo-lectura */}
      {!readOnly && (                                 /* 2️⃣ */
        <Button
          onClick={() => setOpen(true)}
          className="button4-custom text-[var(--text-light)]"
        >
          Agregar familiar
        </Button>
      )}

      {/* Grid de familiares: pásale el flag para que oculte/elimine sus acciones internas */}
      <FamilyGrid
        items={members}
        refresh={fetchFamily}
        readOnly={readOnly}                           /* 3️⃣ */
      />

      {/* Tabla de solicitudes solo muestra información, la dejamos siempre */}
      <FamilyRequestsTable items={requests} />

      {/* Modal de alta / exclusión solo disponible con permisos */}
      {!readOnly && (                                 /* 2️⃣ */
        <AddFamiliarModal
          open={open}
          onClose={() => {
            fetchFamily();
            setOpen(false);
          }}
        />
      )}
    </>
  );
}

/* ────── mapeadores ────── */
function mapMember(api: any): Familiar {
  return {
    id: api.idUser.toString(), // se usará para excluir
    name: `${api.name} ${api.lastname ?? ""}`.trim(),
    relation: api.memberTypeName,
    state: "APPROVED",
    submissionDate: null,
    isForInclusion: false,
    photoUrl: api.profilePictureURL ?? "/images/default-avatar.png",
  };
}

function mapRequest(api: any): Familiar {
  return {
    id: api.requestId.toString(),
    name: api.referencedFullName,
    relation: api.memberTypeName,
    state: api.requestState,          // PENDING / APPROVED / REJECTED
    submissionDate: api.submissionDate,
    isForInclusion: api.isForInclusion,
    photoUrl: "/images/default-avatar.png",
  };
}

// src/modules/employee/membership/components/RequestsActionMenu.tsx
import React, { useState } from "react";
import { MoreVertical } from "lucide-react";
import { toast } from "sonner";                    // 👉 cambia si usas otra librería de toast
import MembershipDetailModal from "./MembershipDetailModal";
import ApproveModal from "./ApproveModal";
import RejectModal from "./RejectModal";

/* ---------- tipos ---------- */
type RequestRow = {
  id: number;
  fullName: string;
  createdAt: string;
  refs: string;   // ej. "1/2"
  status: "Pendiente" | "En revisión" | "Aprobada" | "Rechazada";
};

export default function RequestsActionMenu({ request }: { request: RequestRow }) {
  const [showDetail,  setShowDetail]  = useState(false);
  const [showApprove, setShowApprove] = useState(false);
  const [showReject,  setShowReject]  = useState(false);
  const [correo, setCorreo] = useState("");

  /* ---------- helpers ---------- */
  function handleAccept(correo: string) {
    // «refs» viene en formato "x/2" → nos quedamos con la x
    const valid = parseInt(request.refs.split("/")[0] ?? "0", 10);

    if (valid < 2) {
      toast.warning(
        `La solicitud tiene ${valid} referencia${valid === 1 ? "" : "s"} válida${valid === 1 ? "" : "s"}. Se necesitan 2 para continuar.`
      );
     // return;                // ⛔ abortar apertura del modal de aprobación
    }

    setShowDetail(false);
    setShowApprove(true);
    setCorreo(correo);
  }

  /* ---------- render ---------- */
  return (
    <>
      {/* botón de tres puntos */}
      <button onClick={() => setShowDetail(true)}>
        <MoreVertical className="h-4 w-4" />
      </button>

      {/* DETALLE */}
      {showDetail && (
        <MembershipDetailModal
          open     ={showDetail}
          request  ={request}
          onAccept ={handleAccept}                 // ✅ validación aquí
          onReject ={(correo) => { setShowDetail(false); setShowReject(true); setCorreo(correo); }}
          onClose  ={() => setShowDetail(false)}
        />
      )}

      {/* APROBAR */}
      {showApprove && (
        <ApproveModal
          id     ={request.id}
          name   ={request.fullName}
          correo ={correo}
          onClose={() => setShowApprove(false)}
        />
      )}

      {/* RECHAZAR */}
      {showReject && (
        <RejectModal
          id       ={request.id}
          name     ={request.fullName}
          correo   ={correo}
          onClose  ={() => setShowReject(false)}
          accountId={0}
        />
      )}
    </>
  );
}

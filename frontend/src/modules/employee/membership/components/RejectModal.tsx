// src/modules/employee/membership/components/RejectModal.tsx
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useUser } from "@/shared/context/UserContext";

export default function RejectModal({
  id,
  accountId,
  name,
  correo,
  onClose,
}: {
  id: number;
  accountId: number;
  name: string;
  correo: string;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const tipo = "solicitudMembresiaRechazada";

  const user = useUser();

  const handleReject = async () => {
    setLoading(true);
    try {
      /* 1. RECHAZA la solicitud de membresía */
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/membership-applications/${id}/reject`,
        {
          method: "POST",
          credentials: "include", // ← envía la cookie JWT
          headers: { "Content-Type": "application/json" },
        },
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      /* 2. ENVÍA la notificación por e-mail */
      await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/notifications`,
        {
          method: "POST",
          credentials: "include",        // idem, por si el middleware lo exige
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: correo, // correo del solicitante
            nombre: name,                            // nombre del solicitante
            tipo, 
            extra: { motivo: reason || "Sin especificar" },
          }),
        },
      );

      toast.success("Solicitud rechazada y notificación enviada.");
      // TODO: refresca tu tabla o notifica al componente padre aquí
    } catch (err) {
      console.error("Error rechazando:", err);
      const message =
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : String(err);
      toast.error("No se pudo completar la operación: " + message);
    } finally {
      setLoading(false);
      onClose();
      window.location.reload();
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-150 background-custom rounded-xl border-none">
        <CardContent className="p-6 flex flex-col gap-4 py-0">
          <h2 className="text-xl font-bold text-[#318161]">
            Estás a punto de rechazar la solicitud de
            <br /> {name}
          </h2>
          <Textarea
            placeholder="Motivo del rechazo (opcional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <div className="flex gap-4 justify-center">
            <Button
              className="button3-custom text-[var(--text-light)]"
              onClick={handleReject}
              disabled={loading}
            >
              {loading ? "Rechazando…" : "Rechazar Solicitud"}
            </Button>
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Regresar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

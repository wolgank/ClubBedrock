// src/modules/employee/membership/components/ApproveModal.tsx
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { fetchClubConfig } from "@/modules/admin/services/ClubConfigService";
import { useUser } from "@/shared/context/UserContext";


export default function ApproveModal({
  id,
  name,
  correo,
  onClose,
}: {
  id: number;
  name: string;
  correo: string;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const tipo = "solicitudMembresiaAprobada";
  const user = useUser();

  const handleApprove = async () => {
    setLoading(true);
      console.log(correo);
      console.log(name);
      console.log(tipo);
    try {
      /* 1. APRUEBA la solicitud en el backend */
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/membership-applications/${id}/approve`,
        {
          method: "POST",
          credentials: "include",          // envía la cookie JWT
          headers: { "Content-Type": "application/json" },
        },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      /* 2. ENVÍA la notificación por e-mail */

      
      const notificationRes = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/notifications`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: correo, // hard-coded temporal
            nombre: name,
            tipo,
            extra: {},                               // sin campos extra
          }),
        },
      );

      if (!notificationRes.ok) throw new Error(`HTTP ${notificationRes.status}`);

      toast.success("Solicitud aprobada y notificación enviada.");
      // TODO: refresca tu tabla o avisa al componente padre aquí
    } catch (err) {
      console.error("Error aprobando:", err);
      toast.error("No se pudo completar la aprobación.");
    } finally {
      setLoading(false);
      onClose();
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-150 background-custom rounded-xl border-none">
        <CardContent className="p-5 flex flex-col gap-4 py-0">
          <h2 className="text-xl font-bold text-[#318161]">
            Estás a punto de aprobar la solicitud de
            <br /> {name}
          </h2>
          <p className="text-sm">El usuario será activado como miembro.</p>
          <div className="flex gap-4 justify-center mt-2">
            <Button
              className="button3-custom text-[var(--text-light)]"
              onClick={handleApprove}
              disabled={loading}
            >
              {loading ? "Aprobando…" : "Aprobar Solicitud"}
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

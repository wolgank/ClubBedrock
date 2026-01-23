// src/modules/employee/membership/components/FamilyActionMenu.tsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { MoreVertical } from "lucide-react";
import { toast } from "sonner";
import FamilyInclusionDetail from "./FamilyInclusionDetail";

/* ─────────────────────────── Tipos ─────────────────────────── */
interface Props {
  family: {
    id: number;
    memberName: string;
    familyName: string;
    requestType: "Inclusión" | "Retiro";
    relationship: string;
    requestDate: string;
    status: "Pendiente" | "En revisión" | "Aprobada" | "Rechazada";
  };
  onResolved?: () => void;
}

export default function FamilyActionMenu({ family, onResolved }: Props) {
  /* ————— estados ————— */
  const [openDetail, setOpenDetail] = useState(false);
  const [openApprove, setOpenApprove] = useState(false);
  const [openReject, setOpenReject] = useState(false);
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const backendURL = import.meta.env.VITE_API_BASE_URL;

  /* ————— llamadas backend ————— */
  async function doRequest(
    action: "approve" | "reject",
    body?: Record<string, unknown>,
  ) {
    setLoading(action);
    try {
      const res = await fetch(
        `${backendURL}/member-requests/${family.id}/${action}`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: body ? JSON.stringify(body) : undefined,
        },
      );
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({}));
        throw new Error(error || `${res.status} ${res.statusText}`);
      }
      toast.success(
        `Solicitud ${
          action === "approve" ? "aprobada" : "rechazada"
        } correctamente.`,
      );

      if (onResolved) {
        await onResolved();          // ✅ refetch sin recargar la página
      } else {
         window.location.reload();
      }


    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(null);
      setOpenApprove(false);
      setOpenReject(false);
      setOpenDetail(false);
    }
  }

  /* ————— UI ————— */
  return (
    <>
      {/* Botón de acción */}
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={() => setOpenDetail(true)}
      >
        <MoreVertical className="h-4 w-4" />
      </Button>

      {/* —————————— Modal de DETALLE —————————— */}
      <Dialog open={openDetail} onOpenChange={setOpenDetail}>
        <DialogContent className="!max-w-3xl !w-full !max-h-5/6 !overflow-y-auto background-custom">
          <DialogHeader className="text-[var(--brand)]">
            <DialogTitle>Detalle de Solicitud</DialogTitle>
          </DialogHeader>

          <FamilyInclusionDetail requestId={family.id} />

          <DialogFooter>
            <Button
              className="button3-custom text-[var(--text-light)]"
              disabled={family.status !== "Pendiente"}
              onClick={() => setOpenApprove(true)}
            >
              Aprobar
            </Button>
            <Button
              className="button2-custom text-[var(--text-light)]"
              disabled={family.status !== "Pendiente"}
              onClick={() => setOpenReject(true)}
            >
              Rechazar
            </Button>
            <Button variant="outline" onClick={() => setOpenDetail(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* —————————— Modal CONFIRMAR APROBACIÓN —————————— */}
      <Dialog open={openApprove} onOpenChange={setOpenApprove}>
        <DialogContent className="dialog-narrow background-custom">
          <DialogHeader className="text-[var(--brand)]">
            <DialogTitle>Estás a punto de aprobar</DialogTitle>
          </DialogHeader>

          <p className="text-lg font-medium">
            Estás a punto de aprobar la solicitud de{" "}
            <span className="font-bold">
              {family.requestType} del familiar {family.familyName}
            </span>{" "}
            asociada al socio <span className="font-bold">{family.memberName}</span>.
          </p>

          <p className="mt-6">
            {family.requestType === "Inclusión" ? (
              <>
                El familiar será añadido a la membresía y podrá hacer uso de los
                beneficios establecidos.
              </>
            ) : (
              <>
                El familiar será removido de la membresía y perderá el acceso a
                los beneficios del club.
              </>
            )}
          </p>

          <DialogFooter>
            <Button
              className="button3-custom text-[var(--text-light)]"
              disabled={loading === "approve"}
              onClick={() => doRequest("approve")}
            >
              {loading === "approve" ? "Aprobando…" : "Aprobar Solicitud"}
            </Button>
            <Button variant="outline" onClick={() => setOpenApprove(false)}>
              Regresar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* —————————— Modal CONFIRMAR RECHAZO —————————— */}
      <Dialog open={openReject} onOpenChange={setOpenReject}>
        <DialogContent className="dialog-narrow background-custom">
          <DialogHeader className="text-[var(--brand)]">
            <DialogTitle>Estás a punto de rechazar</DialogTitle>
          </DialogHeader>

          <p className="text-lg font-medium">
            Estás a punto de rechazar la solicitud de Inclusión del familiar{" "}
            <span className="font-bold">{family.familyName}</span> asociada al
            socio <span className="font-bold">{family.memberName}</span>.
          </p>

          <div className="mt-6 space-y-2 w-full">
            <Label>Motivo del rechazo:</Label>
            <textarea
              className="w-full min-h-[120px] rounded-lg border border-[var(--border)] p-3"
              placeholder="Describa brevemente la razón del rechazo…"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>

          <p className="mt-4">
            El socio será notificado del rechazo de la solicitud junto con el
            motivo proporcionado.
          </p>

          <DialogFooter>
            <Button
              className="button4-custom text-[var(--text-light)]"
              disabled={loading === "reject"}
              onClick={() =>
                doRequest("reject", rejectReason ? { reason: rejectReason } : undefined)
              }
            >
              {loading === "reject" ? "Rechazando…" : "Rechazar Solicitud"}
            </Button>
            <Button variant="outline" onClick={() => setOpenReject(false)}>
              Regresar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* pequeño helper para labels dentro del modal */
const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="font-medium">{children}</label>
);

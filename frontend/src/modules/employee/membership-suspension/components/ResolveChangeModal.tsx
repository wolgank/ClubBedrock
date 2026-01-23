// src/modules/employee/membership-suspesion/components/ResolveChangeModal.tsx
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  data: {
    requestId: number;
    type: "SUSPENSION" | "DISAFFILIATION";
  };
  onResolved: () => void;   // callback para recargar tabla / cerrar modal
  onClose: () => void;      // cierra sin hacer nada
}

export default function ResolveChangeModal({
  data,
  onResolved,
  onClose,
}: Props) {
  const backendURL = import.meta.env.VITE_BACKEND_URL;
  const [managerNotes, setManagerNotes] = useState("");
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const call = async (action: "approve" | "reject") => {
    try {
      setLoading(action);
      setErrorMsg("");
      const res = await fetch(
        `${backendURL}/api/membership-change-requests/${data.requestId}/${action}`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ managerNotes }),
        },
      );
      if (!res.ok) {
        setErrorMsg((await res.text()) || `Error ${res.status}`);
        return;
      }
      onResolved();
    } catch (err: any) {
      setErrorMsg(err.message || "Error de red");
    } finally {
      setLoading(null);
    }
  };

  const niceType =
    data.type === "SUSPENSION" ? "suspensión" : "desafiliación";

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md background-custom">
        <DialogHeader>
          <DialogTitle>Resolver {niceType} #{data.requestId}</DialogTitle>
        </DialogHeader>

        <Textarea
          value={managerNotes}
          onChange={(e) => setManagerNotes(e.target.value)}
          rows={3}
          placeholder="Notas para el socio (opcional)…"
        />

        {errorMsg && (
          <p className="text-sm text-red-600 whitespace-pre-wrap mt-2">
            {errorMsg}
          </p>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={!!loading}>
            Cancelar
          </Button>
          <Button
            onClick={() => call("reject")}
            disabled={loading !== null}
            className="button4-custom text-[var(--text-light)]"
          >
            {loading === "reject" ? "Rechazando…" : "Rechazar"}
          </Button>
          <Button
            onClick={() => call("approve")}
            disabled={loading !== null}
            className="button3-custom text-[var(--text-light)]"
          >
            {loading === "approve" ? "Aprobando…" : "Aprobar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

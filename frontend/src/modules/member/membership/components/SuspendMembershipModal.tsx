// src/modules/user/membership/components/SuspendMembershipModal.tsx
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { getISOfromDate } from "@/shared/utils/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  membershipId: number;
}

export default function SuspendMembershipModal({
  open,
  onClose,
  membershipId,
}: Props) {
  const [reason, setReason] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const handleSubmit = async () => {
    setSubmitting(true);

    const today = getISOfromDate(new Date());

    // Verificaciones
    if(startDate < today) {
      toast.error("Ingrese una fecha de inicio igual o posterior a la de hoy.");
      setSubmitting(false);
      return;
    }

    if(endDate) {
      // si hay fecha de fin ...
      if(startDate >= endDate) {
        toast.error("Si se especifica una fecha de fin, esta debe ser posterior a la fecha de inicio indicada.");
        setSubmitting(false);
        return;
      }
    }

    // Operación

    try {
      const res = await fetch(
        `${backendUrl}/api/membership-change-requests/suspendByMember`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            // Authorization: `Bearer ${account?.token}`, ESTA MAL, NO HAY UN TOKEN EN ACCOUNT
          },
          body: JSON.stringify({
            membership: membershipId,
            memberReason: reason,
            changeStartDate: startDate,
            changeEndDate: endDate || undefined,
          }),
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success("Solicitud de suspensión enviada correctamente.");
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Error al solicitar suspensión");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      {/* Overlay transparente */}

      <DialogContent className="background-custom">
        <DialogHeader>
          <DialogTitle>Solicitud de suspensión</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="font-medium">Razón y detalle</p>
            <Textarea
              placeholder="Explique..."
              value={reason}
              onChange={(e) => setReason(e.currentTarget.value)}
              className="shadow-sm"
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <p className="font-medium">Fecha inicio:</p>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="shadow-sm"
              />
            </div>
            <div className="flex-1">
              <p className="font-medium">Fecha fin (opcional):</p>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="shadow-sm"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            className="button4-custom text-[var(--text-light)]"
            onClick={onClose}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={submitting} className="button3-custom text-[var(--text-light)]">
            Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

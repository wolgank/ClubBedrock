// src/modules/employee/membership-suspension/components/SuspendMembershipModal.tsx
import React, { useState } from "react";
import { Button }    from "@/components/ui/button";
import { Input }     from "@/components/ui/input";
import { Label }     from "@/components/ui/label";
import { Textarea }  from "@/components/ui/textarea";
import ConfirmSuspendModal from "./ConfirmSuspendModal";
import { Member }    from "./SocioSearchModal";

interface Props {
  member: Member;
  action: "suspend" | "annul";
  onClose: () => void;
}

export default function SuspendMembershipModal({ member, action, onClose }: Props) {
  const [startDate, setStartDate]     = useState<string>("");   
  const [endDate, setEndDate]         = useState<string>("");   
  const [notes, setNotes]             = useState<string>("");   
  const [showConfirm, setShowConfirm] = useState<boolean>(false);

  const title      = action === "annul" ? "Anular Membresía" : "Suspender Membresía";
  const buttonText = action === "annul" ? "Anular" : "Suspender";

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="background-custom rounded-2xl shadow-lg w-full max-w-2xl overflow-hidden">
          <header className="px-6 py-4 border-b">
            <h2 className="text-2xl font-bold">{title}</h2>
          </header>
          <div className="p-6 space-y-6">
            <section className="grid grid-cols-3 gap-4">
              <div>
                <Label>Nº Membresía</Label>
                <Input readOnly value={String(member.membershipId)} />
              </div>
              <div>
                <Label>Nombre del titular</Label>
                <Input readOnly value={member.fullName} />
              </div>
              <div>
                <Label>Estado actual</Label>
                <Input readOnly value="Activo" />
              </div>
            </section>
            <section className="grid grid-cols-3 gap-4">
              <div>
                <Label>Fecha de inicio</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label>Fecha de fin (opcional)</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div>
                <Label>Detalles adicionales</Label>
                <Textarea
                  placeholder="Anotaciones del gestor"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </section>
          </div>
          <footer className="px-6 py-4 border-t flex justify-end gap-2">
            <Button onClick={() => setShowConfirm(true)}>
              {buttonText}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Regresar
            </Button>
          </footer>
        </div>
      </div>

      {showConfirm && (
        <ConfirmSuspendModal
          data={{
            id:                  member.membershipId,
            action,
            managerNotes:       notes,
            changeStartDate:    startDate,
            changeEndDate:      endDate || null,
          }}
          onClose={() => {
            setShowConfirm(false);
            onClose();
          }}
        />
      )}
    </>
  );
}
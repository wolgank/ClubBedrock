import React, { useEffect, useRef,useState  } from "react";
import RequestDetailForm from "./RequestDetailForm";
import { Button } from "@/components/ui/button";

export interface Request {
  id: number;
  fullName: string;
  createdAt: string;
  refs: string;
  status: "Pendiente" | "En revisión" | "Aprobada" | "Rechazada";
  // añade aquí más campos si los necesitas…
}

interface MembershipDetailModalProps {
  open: boolean;
  request: Request;
  onAccept: (correo: string) => void;
  onReject: (correo: string) => void;
  onClose: () => void;
}

export default function MembershipDetailModal({
  open,
  request,
  onAccept,
  onReject,
  onClose,
}: MembershipDetailModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [correo, setCorreo] = useState("");
  // controlamos showModal / close() según la prop `open`
  useEffect(() => {
    const dlg = dialogRef.current!;
    if (open && !dlg.open) dlg.showModal();
    if (!open && dlg.open) dlg.close();
  }, [open]);

  // ─── sólo se puede aceptar / rechazar si la solicitud sigue abierta ───
  const canManage = request.status === "Pendiente" || request.status === "En revisión";
  
  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="
        fixed inset-0 w-full h-full z-50
        flex items-center justify-center
        p-4 bg-transparent
      "
    >
      <div className="
        w-[90%] max-w-3xl max-h-[90vh]
        rounded-xl overflow-hidden
        background-custom
        text-black dark:text-white
      ">
        {/* — Header — */}
        <header className="border-b px-6 py-4">
          <h2 className="text-2xl font-bold text-[var(--brand)]">Detalle de Solicitud de Membresía</h2>
        </header>

        {/* — Contenido: tu RequestDetailForm con scroll interno — */}
        <div
          className="overflow-y-auto p-6"
          style={{ maxHeight: "calc(90vh - 180px)" }}
        >
          <RequestDetailForm requestId={request.id} onLoaded={(correo) => {
            setCorreo(correo);
          }} />
        </div>

        {/* — Footer con acciones — */}
        <footer className="border-t px-6 py-4 flex justify-end gap-3">
          <Button
            disabled={!canManage}
            onClick={() => onAccept(correo)}
            className={`
              rounded-md px-4 py-2 text-[var(--text-light)] button3-custom
              ${canManage ? "" : "cursor-not-allowed"}
            `}
          >
            Aceptar Solicitud
          </Button>
          <Button
            disabled={!canManage}
            onClick={() => onReject(correo)}
            className={`
              rounded-md px-4 py-2 text-[var(--text-light)] button4-custom
              ${canManage ? "" : "cursor-not-allowed"}
            `}
          >
            Rechazar Solicitud
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            className="rounded-md px-4 py-2"
          >
            Cancelar
          </Button>
        </footer>
      </div>
    </dialog>
  );
}

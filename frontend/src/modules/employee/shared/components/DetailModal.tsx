// src/modules/employee/shared/components/DetailModal.tsx
import { useEffect, useRef, ReactNode } from "react";

export interface DetailModalProps {
  open: boolean;
  title: string;
  children: ReactNode;        // aquí va el contenido de los campos
  onAccept: () => void;
  onReject: () => void;
  onClose: () => void;
  acceptLabel?: string;      // opcionalmente “Aceptar Solicitud” o “Aceptar Inclusión”
  rejectLabel?: string;
}

export function DetailModal({
  open,
  title,
  children,
  onAccept,
  onReject,
  onClose,
  acceptLabel = "Aceptar",
  rejectLabel = "Rechazar",
}: DetailModalProps) {
  const dlgRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dlg = dlgRef.current!;
    if (open && !dlg.open) dlg.showModal();
    if (!open && dlg.open) dlg.close();
  }, [open]);

  return (
    <dialog
      ref={dlgRef}
      className="fixed inset-0 z-50 mx-auto w-full max-w-2xl rounded-xl bg-[var(--bg-light-alt)] p-8 shadow-lg"
      onClose={onClose}
    >
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <div className="space-y-6">{children}</div>
      <div className="mt-6 flex justify-end gap-2">
        <button
          onClick={onAccept}
          className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
        >
          {acceptLabel}
        </button>
        <button
          onClick={onReject}
          className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
        >
          {rejectLabel}
        </button>
        <button
          onClick={onClose}
          className="rounded bg-gray-400 px-4 py-2 text-white hover:bg-gray-500"
        >
          Cancelar
        </button>
      </div>
    </dialog>
  );
}

/* ---------------------------------------------------------------------------
   Panel que muestra el total seleccionado y abre el modal de pago masivo
--------------------------------------------------------------------------- */
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Quota } from "./QuotasTable";
import BulkPaymentModal from "./BulkPaymentModal";

interface PaymentPanelProps {
  selected: Quota[];   // cuotas marcadas en la tabla
  onPaid: () => void;  // callback para que la página refresque
}

export default function PaymentPanel({ selected, onPaid }: PaymentPanelProps) {
  const total = selected.reduce((s, q) => s + q.amount + q.lateFee, 0);
  const [open, setOpen] = useState(false);   // controla el modal

  return (
    <>
      <div className="rounded-2xl p-6 flex items-center justify-between my-6 background-custom">
        <p className="text-lg font-semibold">
          Total a pagar:&nbsp;
          <span className="text-[var(--brand)]">S/. {total.toFixed(2)}</span>
        </p>

        <Button
          onClick={() => setOpen(true)}
          disabled={selected.length === 0}
          className="px-6 py-2 button4-custom text-[var(--text-light)]"
        >
          PAGAR
        </Button>
      </div>

      {/* Modal MASIVO: sale al pulsar PAGAR */}
      <BulkPaymentModal
        open={open}
        quotas={selected}
        onClose={() => setOpen(false)}
        onPaid={() => {
          setOpen(false); // cerrar modal
          onPaid();       // refrescar tabla en la página
        }}
      />
    </>
  );
}

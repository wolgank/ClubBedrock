/* ---------------------------------------------------------------------------
   Modal para pagar varias cuotas a la vez. Muestra el desglose (items) de cada
   recibo seleccionado antes de confirmar el pago.
--------------------------------------------------------------------------- */
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
import { Separator } from "@/components/ui/separator";
import { CreditCard, Loader2 } from "lucide-react";
import { Quota } from "./QuotasTable";
import { toast } from "sonner";

interface Props {
  open: boolean;
  quotas: Quota[];          // cuotas seleccionadas
  onClose: () => void;
  onPaid: () => void;       // refrescar tabla en la página
}

export default function BulkPaymentModal({
  open,
  quotas,
  onClose,
  onPaid,
}: Props) {
  /* ---------- totales ---------- */
  const total = quotas.reduce((s, q) => s + q.amount + q.lateFee, 0);

  /* ---------- pagar todas ---------- */
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg]     = useState("");

  const payAll = async () => {
    try {
      setProcessing(true);
      setErrorMsg("");

      /* enviamos una petición POR CUOTA (único endpoint disponible) */
      await Promise.all(
        quotas.map((q) =>
          fetch(`${import.meta.env.VITE_BACKEND_URL}/api/bill/pay`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              billId: q.id,
              paymentMethod: "CREDIT_CARD", // o "TRANSFER", "CASH" según tu lógica
            }),
          }).then(async (res) => {
            if (!res.ok) {
              const msg = await res.text();
              throw new Error(
                msg ||
                  `No se pudo pagar la factura ${q.id} (estado: ${res.status})`
              );
            }
          })
        )
      );

      toast.success(`Pagadas ${quotas.length} cuota(s) correctamente`);
      onPaid();   // refrescar tabla en la página
      onClose();  // cerrar modal
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Error inesperado");
    } finally {
      setProcessing(false);
    }
  };

  /* ---------- UI ---------- */
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-center text-lg sm:text-xl">
            Pago de {quotas.length} cuota(s)
          </DialogTitle>
        </DialogHeader>

        {/* Total */}
        <section className="space-y-1 text-sm mb-4">
          <div className="flex justify-between font-medium">
            <span>Total a pagar</span>
            <span>S/. {total.toFixed(2)}</span>
          </div>
        </section>

        {/* Desglose individual */}
        <table className="w-full text-sm mb-4">
          <thead>
            <tr className="text-muted-foreground text-left">
              <th>Descripción</th>
              <th className="text-right">Monto</th>
            </tr>
          </thead>
          <tbody>
            {quotas.map((q) => (
              <tr key={q.id}>
                <td>
                  {q.description}
                  {q.lateFee > 0 && " + mora"}
                </td>
                <td className="text-right">
                  S/. {(q.amount + q.lateFee).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <Separator className="my-2" />

        {/* Datos de tarjeta (simulado) */}
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="block text-sm font-medium">
              <CreditCard size={16} className="inline mb-0.5 mr-1" />
              Número de tarjeta
            </label>
            <Input placeholder="XXXX-XXXX-XXXX-XXXX" maxLength={19} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium">CVV/CVC</label>
              <Input placeholder="XXX" maxLength={4} />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium">Válido hasta</label>
              <Input placeholder="mm/aaaa" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium">Nombre</label>
            <Input placeholder="Nombre" />
          </div>
        </div>

        <DialogFooter className="pt-4">
          <Button
            onClick={payAll}
            disabled={processing}
            className="w-full sm:w-auto flex items-center gap-2"
          >
            {processing && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
            Pagar ahora
          </Button>

          <Button
            variant="secondary"
            onClick={onClose}
            disabled={processing}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
        </DialogFooter>

        {errorMsg && (
          <p className="text-center text-sm text-red-600 mt-2">{errorMsg}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

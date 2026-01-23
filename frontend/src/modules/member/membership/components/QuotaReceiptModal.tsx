// src/modules/user/membership/components/QuotaReceiptModal.tsx
import React, { useEffect, useState } from "react";
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
import { Quota } from "./QuotasTable";
import { CreditCard, ChevronRight, Loader2 } from "lucide-react";

/* -------- tipos auxiliares -------- */
type Detail = { id: number; description: string; finalPrice: number };

interface Props {
  open: boolean;
  quota: Quota | null;
  onClose: () => void;
  onPaid?: () => void; // callback para que la página refresque la tabla
}


export default function QuotaReceiptModal({
  open,
  quota,
  onClose,
  onPaid,
}: Props) {
  /* -------- flags de estado -------- */
  const isPending =
    quota?.status === "PENDIENTE" || quota?.status === "VENCIDO";

  /* -------- detalle de la factura -------- */
  const [details, setDetails] = useState<Detail[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    if (!open || !quota) return;

    (async () => {
      try {
        setLoadingDetails(true);
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/bill/${quota.id}/details`,
          { credentials: "include" }
        );
        const json = await res.json();
        setDetails(
          (json.details ?? []).map((d: any) => ({
            id: d.id,
            description: d.description,
            finalPrice: parseFloat(d.finalPrice),
          }))
        );
      } catch (err) {
        console.error(err);
        setDetails([]);
      } finally {
        setLoadingDetails(false);
      }
    })();
  }, [open, quota]);

  /* -------- proceso de pago -------- */
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const pay = async () => {
    if (!quota) return;
    try {
      setProcessing(true);
      setErrorMsg("");

      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/bill/pay`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            billId: quota.id,
            paymentMethod: "CREDIT_CARD", // o "DEBIT_CARD"
          }),
        }
      );

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "No se pudo procesar el pago");
      }

      // éxito
      if (onPaid) onPaid();
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Error inesperado al pagar");
    } finally {
      setProcessing(false);
    }
  };

  /* -------- totales -------- */
  const total = details.reduce((s, d) => s + d.finalPrice, 0);

  /* -------- render -------- */
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()} >
      <DialogContent className="sm:max-w-[480px] max-h-screen overflow-y-auto background-custom">
        <DialogHeader>
          <DialogTitle className="text-center text-lg sm:text-xl">
            {isPending ? "Pago de cuotas" : "Detalle del recibo"}
          </DialogTitle>
        </DialogHeader>

        {/* Total + concepto */}
        <section className="space-y-1 text-sm">
          <div className="flex justify-between font-medium">
            <span>Importe total</span>
            <span>S/. {total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Concepto</span>
            <span className="text-right">{quota?.description}</span>
          </div>
        </section>

        <Separator className="my-4" />

        {/* Tabla items */}
        {loadingDetails ? (
          <p className="text-center text-sm py-6">Cargando detalle…</p>
        ) : (
          <table className="w-full text-sm mb-4">
            <tbody>
              {details.map((d) => (
                <tr key={d.id}>
                  <td className="pr-2">{d.description}</td>
                  <td className="text-right">S/. {d.finalPrice.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Método de pago */}
        {isPending && (
          <>
            <Separator className="my-2" />


            <details open className="rounded-xl border border-gray-300 dark:border-gray-600">
              <summary className="flex items-center justify-between px-4 py-3 cursor-pointer select-none  rounded-t-xl">
                <div className="flex items-center gap-2 font-medium">
                  <CreditCard size={18} /> Tarjeta de Débito / Crédito
                </div>
                <ChevronRight className="h-5 w-5" />
              </summary>

              <div className="p-4 space-y-4 rounded-b-xl">
                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    Número de Tarjeta
                  </label>
                  <Input placeholder="XXXX-XXXX-XXXX-XXXX" maxLength={19} className="shadow-sm"/>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">
                      No. CVV / CVC
                    </label>
                    <Input placeholder="XXX" maxLength={4} className="shadow-sm"/>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium">
                      Válido hasta
                    </label>
                    <Input placeholder="mm/aaaa" className="shadow-sm"/>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium">Nombre</label>
                  <Input placeholder="Nombre" className="shadow-sm"/>
                </div>
              </div>
            </details>
          </>
        )}

        {/* Botones */}
        <DialogFooter className="pt-4">
          {isPending && (
            <Button
              onClick={pay}
              disabled={processing}
              className="w-full sm:w-auto flex items-center gap-2 button3-custom text-[var(--text-light)]"
            >
              {processing && (
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
              )}
              Realizar pago
            </Button>
          )}

          <Button
            onClick={onClose}
            className="w-full sm:w-auto button4-custom text-[var(--text-light)]"
            disabled={processing}
          >
            {isPending ? "Cancelar" : "Cerrar"}
          </Button>
        </DialogFooter>

        {/* Error */}
        {errorMsg && (
          <p className="text-center text-sm text-red-600 mt-2">{errorMsg}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

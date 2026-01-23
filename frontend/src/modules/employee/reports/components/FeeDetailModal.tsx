// src/modules/employee/billing/components/FeeDetailModal.tsx
import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

/* ---------- Tipos ---------- */
interface BillDetail {
  id: number;
  description: string;
  price: number;
  discount: number;
  finalPrice: number;
}

interface Props {
  fee: {
    id: number;
    description: string;
    finalAmount: string;
    createdAt: string;
    dueDate: string;
    status: string;
  };
  onClose: () => void;
}

export default function FeeDetailModal({ fee, onClose }: Props) {
  const backendURL = import.meta.env.VITE_BACKEND_URL;

  const [details, setDetails] = useState<BillDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        const res = await fetch(
          `${backendURL}/api/bill/${fee.id}/details`,
          { credentials: "include" }
        );
        const json = await res.json();

        /* -------- normaliza -------- */
        const raw: any[] = Array.isArray(json) ? json : json.details ?? [];

        setDetails(
          raw.map((d) => ({
            id: d.id,
            description: d.description,
            price: parseFloat(d.price),
            discount: parseFloat(d.discount),
            finalPrice: parseFloat(d.finalPrice),
          }))
        );
      } catch (e) {
        console.error(e);
        setDetails([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [backendURL, fee.id]);

  /* total seguro aun si no hay array */
  const total = details.reduce?.((s, d) => s + d.finalPrice, 0) ?? 0;


  /* ---------- Render ---------- */
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl background-custom">
        <DialogHeader>
          <DialogTitle className="text-center text-lg sm:text-xl">
            Detalle de la factura
          </DialogTitle>
        </DialogHeader>

        {/* Resumen cabecera */}
        <section className="space-y-2 text-sm border-b pb-4">
          <div className="flex justify-between font-medium">
            <span>Importe total</span>
            <span>S/. {total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Concepto</span>
            <span className="text-right">{fee.description}</span>
          </div>

          <div className="flex justify-between text-muted-foreground">
            <span>Fecha vencimiento</span>
            <span className="text-right">
              {new Date(fee.dueDate).toLocaleDateString("es-PE")}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium"> Estado</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                fee.status === "OVERDUE"
                  ? "bg-red-200 text-red-900"    // vencido → rojo
                  : "bg-yellow-200 text-yellow-900" // pendiente → amarillo
              }`}
            >
              {fee.status === "OVERDUE" ? "Vencido" : "Pendiente"}
            </span>
          </div>
        </section>

        {/* Tabla de items */}
        <section className="mt-4">
          <h3 className="font-semibold mb-2">Items</h3>

          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="ml-2 text-sm">Cargando detalle…</span>
            </div>
          ) : details.length ? (
            <table className="w-full text-sm">
              <thead className="border-b text-left">
                <tr>
                  <th className="py-1">Descripción</th>
                  <th className="py-1 text-right">Precio</th>
                  <th className="py-1 text-right">Desc.</th>
                  <th className="py-1 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {details.map((d) => (
                  <tr key={d.id}>
                    <td className="py-1 pr-2">{d.description}</td>
                    <td className="py-1 text-right">S/ {d.price.toFixed(2)}</td>
                    <td className="py-1 text-right">
                      S/ {d.discount.toFixed(2)}
                    </td>
                    <td className="py-1 text-right font-medium">
                      S/ {d.finalPrice.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              No hay items registrados.
            </p>
          )}
        </section>

        <DialogFooter>
          <Button onClick={onClose} className="w-full sm:w-auto button4-custom text-[var(--text-light)]">
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------------------------------------------------------------------
   Página: muestra cuotas, permite pagos individuales y masivos
--------------------------------------------------------------------------- */
import React, { useEffect, useState } from "react";
import PaymentPanel from "../components/PaymentPanel";
import QuotasTable, { Quota } from "../components/QuotasTable";
import QuotaReceiptModal from "../components/QuotaReceiptModal";
import { toast } from "sonner";
import { useMembershipStatus } from "@/shared/hooks/useMembershipStatus"; 
import { useUser } from "@/shared/context/UserContext";

/* ---------- helper backend → Quota ---------- */
function mapFeeToQuota(fee: any): Quota {
  let status: Quota["status"];
  switch (fee.status) {
    case "PENDING":
      status = "PENDIENTE";
      break;
    case "OVERDUE":
      status = "VENCIDO";
      break;
    case "PAID":
      status = "PAGADO";
      break;
    case "CANCELLED":
      status = "ANULADO";
      break;
    default:
      status = "PENDIENTE";
  }

  return {
    id: fee.id,
    period: fee.period ?? "",
    description: fee.description,
    amount: Number(fee.finalAmount),
    lateFee: Number(fee.moratoriumAmount ?? 0),
    issueDate: fee.createdAt?.slice(0, 10) ?? "",
    dueDate: fee.dueDate?.slice(0, 10) ?? "",
    status,
  };
}

export default function PagoCuotasPage() {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const { user } = useUser();
  const { readOnly, loading: statusLoading } = useMembershipStatus();
  const [quotas, setQuotas]   = useState<Quota[]>([]);
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState<Quota[]>([]);   // para pago masivo

  /* -------- modal individual -------- */
  const [modalOpen, setModalOpen] = useState(false);
  const [currentQuota, setCurrentQuota] = useState<Quota | null>(null);

  /* ---------- cargar cuotas ---------- */
  const loadQuotas = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${backendUrl}/api/bill/fees`, {
        credentials: "include",
      });
      const raw: any[] = await res.json();

      const mapped = raw.map(mapFeeToQuota);
      setQuotas(mapped.filter((q) =>
        q.status === "PENDIENTE" || q.status === "VENCIDO"
      ));
    } catch (e) {
      console.error(e);
      toast.error("No se pudieron obtener las cuotas.");
    } finally {
      setLoading(false);
      setSelected([]); // limpiar selección tras recarga
    }
  };

  useEffect(() => {
    loadQuotas();
  }, [backendUrl]);

  /* ---------- pago individual ---------- */
  const handleAction = (q: Quota) => {
    setCurrentQuota(q);
    setModalOpen(true);
  };

  /* ---------- UI ---------- */
  if (loading) return <div>Cargando…</div>;
  if (!quotas.length)
    return <div className="my-10 text-center">No tienes cuotas pendientes.</div>;

  return (
    <>
      {/* Panel de pago masivo: solo si se permite operar */}
      {!readOnly && (
        <PaymentPanel selected={selected} onPaid={loadQuotas} />
      )}

      {/* Tabla de cuotas */}
      <QuotasTable
        data={quotas}
        selectable={!readOnly}   // ← desactiva checkboxes
        showLateFee
        showActions={!readOnly}  // ← oculta botón Pagar fila
        onSelectionChange={setSelected}
        onAction={handleAction}
      />

      {/* Modal de pago individual */}
      {!readOnly && (
        <QuotaReceiptModal
          open={modalOpen}
          quota={currentQuota}
          onClose={() => setModalOpen(false)}
          onPaid={loadQuotas}
        />
      )}
    </>
  );
}

import React from "react";
import { format } from "date-fns";
import es from "date-fns/locale/es";
import { Familiar } from "./FamilyCard";

/* ---------- Utilidades ---------- */
function mapType(isForInclusion: boolean) {
  return isForInclusion ? "Inclusión" : "Exclusión";
}

function mapState(state: Familiar["state"]) {
  switch (state) {
    case "PENDING":
      return "EN REVISIÓN";
    case "APPROVED":
      return "APROBADA";
    case "REJECTED":
      return "RECHAZADA";
    default:
      return "—";
  }
}

function formatDate(date?: string | null) {
  if (!date) return "—";
  return format(new Date(date), "dd-MM-yyyy", { locale: es });
}

/* ---------- Componente ---------- */
interface Props {
  items: Familiar[];        // lista de familiares ya cargada en la página
}

export default function FamilyRequestsTable({ items }: Props) {
  if (!items.length) return null;   // nada que mostrar

  return (
    <section className="my-10">
      <div className="rounded-2xl p-8 overflow-y-auto max-h-[420px] background-custom">
        <h2 className="text-2xl font-semibold text-center text-[var(--brand-dark)] mb-6">
          Estado de solicitudes
        </h2>

        <table className="w-full text-[var(--brand-dark)]">
          <thead>
            <tr className="text-sm font-semibold text-[var(--brand)]">
              <th className="text-left pb-4">Tipo</th>
              <th className="text-left pb-4">Nombre</th>
              <th className="text-left pb-4">Fecha de solicitud</th>
              <th className="text-left pb-4">Estado</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-muted/30">
            {items.map((f) => (
              <tr key={f.id} className="text-base leading-10">
                <td>{mapType(f.isForInclusion)}</td>
                <td>{f.name}</td>
                <td>{formatDate(f.submissionDate)}</td>
                <td className="font-semibold">{mapState(f.state)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// src/modules/user/membership/components/ChangeRequestsSection.tsx
import React, { useEffect, useState } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { format } from "date-fns";
import { es } from "date-fns/locale/es";
import { getDateFromISO } from "@/shared/utils/utils";

/* ────────── Tipos ────────── */
export interface ChangeRequest {
  id: number;
  type: string;          // «SUSPENSIÓN» | «ANULACIÓN»
  state: string;         // «PENDIENTE» | «EN REVISIÓN» | «APROBADA» | «RECHAZADA»
  submittedAt: string;   // dd/MM/yyyy
  period?: string;       // 01/07/2025 – 31/07/2025  (o solo 01/07/2025)
  resolvedAt?: string;   // dd/MM/yyyy
}

/* ────────── Clases pill por estado ────────── */
const statePill: Record<string, string> = {
  Pendiente:
    "bg-yellow-300/60 text-yellow-900 dark:bg-yellow-600/30 dark:text-yellow-200",
  "En revisión":
    "bg-sky-300/50 text-sky-900 dark:bg-sky-600/30 dark:text-sky-200",
  Aprobada:
    "bg-green-300/60 text-green-900 dark:bg-green-600/30 dark:text-green-200",
  Rechazada:
    "bg-red-300/60 text-red-900 dark:bg-red-600/30 dark:text-red-200",
};

function determinePeriod(start?: string, end?: string) {
  if(!start) return undefined;
  return end ? `${start} - ${end}` : `Desde ${start}`;
}

export default function ChangeRequestsSection() {
  const [data, setData] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const backendUrl = import.meta.env.VITE_BACKEND_URL as string;

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `${backendUrl}/api/membership-change-requests/my-change-requests`,
          { credentials: "include" }
        );
        const raw: any[] = await res.json();

        /* Traducciones */
        const typeMap: Record<string, string> = {
          SUSPENSION: "Suspensión",
          DISAFFILIATION: "Anulación",
        };
        const stateMap: Record<string, string> = {
          PENDING: "Pendiente",
          IN_REVIEW: "En revisión",
          APPROVED: "Aprobada",
          REJECTED: "Rechazada",
        };

        const formatted: ChangeRequest[] = raw.map((r) => {
          // OJO: changeStartDate y changeEndDate son fechas literales sacadas de un
          // input type date => asi que la fecha hay que sacar de los números que tiene
          // directamente (a diferencia de las otras)
          const start = r.changeStartDate
            ? format(getDateFromISO(r.changeStartDate), "dd/MM/yyyy", { locale: es })
            : undefined;
          const end = r.changeEndDate
            ? format(getDateFromISO(r.changeEndDate), "dd/MM/yyyy", { locale: es })
            : undefined;

          return {
            id: r.requestId,
            type: typeMap[r.type] ?? r.type,
            state: stateMap[r.requestState] ?? r.requestState,
            submittedAt: format(new Date(r.submissionDate), "dd/MM/yyyy", {
              locale: es,
            }),
            period: determinePeriod(start, end),
            resolvedAt: r.resolutionDate
              ? format(new Date(r.resolutionDate), "dd/MM/yyyy", { locale: es })
              : undefined,
          };
        });

        setData(formatted);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [backendUrl]);

  /* ---- render ---- */
  if (loading || data.length === 0) return null;

  return (
    <>
      <h2 className="mt-10 mb-4 text-xl font-semibold">
        Solicitudes de cambio
      </h2>

      <div className="background-custom rounded-2xl p-4 my-6">
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Periodo solicitado</TableHead>
              <TableHead>Fecha de solicitud</TableHead>
              <TableHead>Fecha de resolución</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {data.map(r => (
              <TableRow
                key={r.id}   
              >
                <TableCell>{r.type}</TableCell>

                <TableCell>
                  <span
                    className={`inline-block rounded-full px-4 py-1 text-sm font-medium ${
                      statePill[r.state] ?? ""
                    }`}
                  >
                    {r.state}
                  </span>
                </TableCell>

                <TableCell>{r.period ?? "—"}</TableCell>
                <TableCell>{r.submittedAt}</TableCell>
                <TableCell>{r.resolvedAt ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

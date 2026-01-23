import React, { useEffect, useMemo, useState } from "react";
import {
  MoreVertical,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from "lucide-react";

/* ─────────── Tipos ─────────────────────────────────────────────────── */
export interface MoraRow {
  id: string;
  name: string;
  lastname: string;
  membershipCode: string;
  subCode: string;
  daysDelayed: number;
  rawAmount: number;
  moraAmount: number;
  totalAmount: number;
  billCreatedAt: string;
  billDueDate: string;
}

interface Props {
  data: MoraRow[];
}

/* ─────────── Constantes de paginación ──────────────────────────────── */
const PAGE_SIZE = 7;

/* ─────────── Componente ────────────────────────────────────────────── */
export default function MembersMoraTable({ data }: Props) {
  const [page, setPage] = useState(0);

  /* ——— Ajustar última página si cambia el tamaño del dataset ——— */
  useEffect(() => {
    const lastPage = Math.max(0, Math.ceil(data.length / PAGE_SIZE) - 1);
    setPage((p) => Math.min(p, lastPage));
  }, [data]);

  /* ——— Reset opcional a página 0 cuando el dataset cambia mucho ——— */
  // useEffect(() => setPage(0), [data]);

  /* ——— Helpers ——— */
  const money = (n: number) => n.toFixed(2);
  const date  = (iso: string) => new Date(iso).toLocaleDateString();

  /* ——— Cálculo de filas visibles ——— */
  const start = page * PAGE_SIZE;
  const end   = start + PAGE_SIZE;

  const pageData = useMemo(
    () => data.slice(start, end),
    [data, start, end],
  );

  const pageCount = Math.ceil(data.length / PAGE_SIZE);

  return (
    <div className="overflow-x-auto rounded-2xl background-custom p-2">
      {/* ───── Tabla ───── */}
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left font-semibold">
            <th className="p-3">Titular</th>
            <th className="p-3">Código&nbsp;|&nbsp;Sub</th>
            <th className="p-3 text-center">Días retraso</th>
            <th className="p-3 text-right">Base&nbsp;(S/)</th>
            <th className="p-3 text-right">Mora&nbsp;(S/)</th>
            <th className="p-3 text-right">Total&nbsp;(S/)</th>
            <th className="p-3">Emisión</th>
            <th className="p-3">Vencimiento</th>
          </tr>
        </thead>

        <tbody>
          {pageData.length === 0 ? (
            <tr>
              <td colSpan={8} className="p-6 text-center text-gray-500">
                No hay socios en mora.
              </td>
            </tr>
          ) : (
            pageData.map((r, i) => (
              /* ⬇️ Key única en todo el dataset */
              <tr key={`${r.id}-${start + i}`} className="border-t">
                <td className="p-3 whitespace-nowrap">
                  {r.name} {r.lastname}
                </td>
                <td className="p-3 whitespace-nowrap">
                  {r.membershipCode} | {r.subCode}
                </td>
                <td className="p-3 text-center">{r.daysDelayed}</td>
                <td className="p-3 text-right">{money(r.rawAmount)}</td>
                <td className="p-3 text-right">{money(r.moraAmount)}</td>
                <td className="p-3 text-right font-semibold">
                  {money(r.totalAmount)}
                </td>
                <td className="p-3 whitespace-nowrap">
                  {date(r.billCreatedAt)}
                </td>
                <td className="p-3 whitespace-nowrap">{date(r.billDueDate)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* ───── Controles de paginación ───── */}
      {pageCount > 1 && (
        <div className="flex items-center justify-between mt-4 px-2">
          <span className="text-sm">
            Página {page + 1} de {pageCount}
          </span>

          <div className="flex gap-2">
            <button
              className="w-10 h-10 flex items-center justify-center rounded-lg border disabled:opacity-40 bg-white"
              disabled={page === 0}
              onClick={() => setPage(0)}
            >
              <ChevronsLeft size={18} />
            </button>
            <button
              className="w-10 h-10 flex items-center justify-center rounded-lg border disabled:opacity-40 bg-white"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              className="w-10 h-10 flex items-center justify-center rounded-lg border disabled:opacity-40 bg-white"
              disabled={page === pageCount - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight size={18} />
            </button>
            <button
              className="w-10 h-10 flex items-center justify-center rounded-lg border disabled:opacity-40 bg-white"
              disabled={page === pageCount - 1}
              onClick={() => setPage(pageCount - 1)}
            >
              <ChevronsRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

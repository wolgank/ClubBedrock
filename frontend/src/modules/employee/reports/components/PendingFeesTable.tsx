// src/modules/employee/billing/components/PendingFeesTable.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  ColumnFiltersState,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import FeeDetailModal from "./FeeDetailModal";

/* ---------- Tipos ---------- */
type PendingFee = {
  id: number;
  membershipId: number;
  memberName: string;
  membershipCode: string;
  description: string;
  dueDate: string;
  status: string;
};

export default function PendingFeesTable() {
  const backendURL = import.meta.env.VITE_BACKEND_URL;

  const [rows, setRows] = useState<PendingFee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFee, setSelectedFee] = useState<PendingFee | null>(null);

  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  /* ---------- Carga de datos ---------- */
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1) Tipo TITULAR
        const tRes = await fetch(`${backendURL}/api/member-types`, {
          credentials: "include",
        });
        const types = await tRes.json();
        const titular = types.find(
          (x: any) =>
            typeof x.name === "string" && x.name.toUpperCase().includes("TITULAR")
        );
        if (!titular) throw new Error("Tipo TITULAR no encontrado");
        const titularId = titular.id;

        // 2) Titulares
        const mRes = await fetch(
          `${backendURL}/api/members/by-type?typeId=${titularId}`,
          { credentials: "include" }
        );
        const titulares = await mRes.json();

        // 3) Fees pendientes por cada titular
        const feePromises = titulares.map(async (t: any) => {
          const url = `${backendURL}/api/bill/${t.membershipId}/fees`;
          const r = await fetch(url, { credentials: "include" });
          if (!r.ok) return [];

        const fees = await r.json();
          return fees
            .filter((f: any) => f.status === "PENDING" || f.status === "OVERDUE")  // ← aquí
            .map((f: any) => ({
              id: f.id,
              membershipId: t.membershipId,
              memberName: `${t.name} ${t.lastname}`.trim(),
              membershipCode: t.code,
              description: f.description ?? "-",
              dueDate: f.dueDate,
              status: f.status,                // guarda el estado real
            }));
        });

        setRows((await Promise.all(feePromises)).flat());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [backendURL]);

  /* ---------- Columnas ---------- */
  const columns = useMemo<ColumnDef<PendingFee>[]>(
    () => [
      {
        accessorKey: "memberName",
        header: () => (
          <div className="flex items-center">
            Nombre&nbsp;
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                setSorting((o) =>
                  o[0]?.id === "memberName" && !o[0].desc
                    ? [{ id: "memberName", desc: true }]
                    : [{ id: "memberName", desc: false }]
                )
              }
            >
              <ArrowUpDown className="w-4 h-4" />
            </Button>
          </div>
        ),
        size: 160,
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "membershipCode",
        header: "Código",
        size: 120,
      },
      {
        accessorKey: "description",
        header: "Concepto",
        size: 240,
        cell: (info) => (
          <span className="whitespace-pre-line break-words max-w-[240px]">
            {info.getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: "dueDate",
        header: () => (
          <div className="flex items-center">
            Fecha&nbsp;
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                setSorting((o) =>
                  o[0]?.id === "dueDate" && !o[0].desc
                    ? [{ id: "dueDate", desc: true }]
                    : [{ id: "dueDate", desc: false }]
                )
              }
            >
              <ArrowUpDown className="w-4 h-4" />
            </Button>
          </div>
        ),
        size: 120,
        cell: (info) =>
          new Date(info.getValue<string>()).toLocaleDateString("es-PE"),
      },
      {
        id: "estado",
        header: "Estado",
        size: 110,
        cell: ({ row }) => {
          const st = row.original.status;          // "PENDING" | "OVERDUE"
          const label = st === "OVERDUE" ? "Vencido" : "Pendiente";
          const color = st === "OVERDUE" ? "bg-red-200 text-red-900" : "bg-yellow-200 text-yellow-900";
          return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${color}`}>
              {label}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "",
        size: 60,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedFee(row.original)}
          >
            <Eye className="w-4 h-4" />
          </Button>
        ),
      },
    ],
    [sorting]
  );

  /* ---------- React-Table ---------- */
  const table = useReactTable({
    data: rows,
    columns,
    initialState: { pagination: { pageSize: 8 } },
    state: { sorting, globalFilter, columnFilters },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const page = table.getState().pagination.pageIndex;
  const pageCount = table.getPageCount();

  return (
    <>
      {/* MODAL */}
      {selectedFee && (
        <FeeDetailModal fee={selectedFee} onClose={() => setSelectedFee(null)} />
      )}

      {/* Contenedor centrado */}
      <div className="mx-auto px-4 w-full max-w-6xl space-y-6">
        <div className="mx-auto px-4 w-full max-w-6xl space-y-6">
          
          {/* ---- TÍTULO ---- */}
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Reporte de Pagos pendientes y vencidos
          </h2>

          {/* Buscador */}
          <Input
            placeholder="Buscar por nombre"
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="max-w-sm"
          />

          {/* Tabla */}
          <div className="rounded-2xl border background-custom p-2
                          max-h-[70vh] overflow-y-auto overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id}>
                    {hg.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        colSpan={header.colSpan}
                        style={{ width: header.getSize() }}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="text-center">
                      Cargando…
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          style={{ width: cell.column.getSize() }}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="text-center">
                      Sin resultados
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Paginación */}
          <div className="flex justify-end items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <span className="text-sm">
              Página {page + 1} de {pageCount}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

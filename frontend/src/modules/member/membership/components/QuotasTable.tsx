// src/modules/user/membership/components/QuotasTable.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  ColumnFiltersState,
} from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowUpDown,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from "lucide-react";
import { getISOfromDate } from "@/shared/utils/utils";

/* ─────────── Tipos ─────────── */
export interface Quota {
  id: string;
  period: string;
  description: string;
  amount: number;
  lateFee: number;
  issueDate: string;
  dueDate: string;
  status: "PENDIENTE" | "PAGADO" | "VENCIDO" | "ANULADO";
}

export interface QuotasTableProps {
  data: Quota[];
  selectable?: boolean;
  onSelectionChange?: (selected: Quota[]) => void;
  showActions?: boolean;
  onAction?: (quota: Quota) => void;
}

/* ─────────── Filtro global (monto, fechas, estado) ─────────── */
const globalFilterFn = (row: any, _columnId: string, value: string) => {
  const q: Quota = row.original;
  const v = value.toLowerCase();
  return (
    q.description.toLowerCase().includes(v) ||
    q.status.toLowerCase().includes(v) ||
    q.amount.toString().includes(v) ||
    q.issueDate.toLowerCase().includes(v) ||
    q.dueDate.toLowerCase().includes(v)
  );
};

export default function QuotasTable({
  data,
  selectable = false,
  onSelectionChange,
  showActions = false,
  onAction,
}: QuotasTableProps) {
  /* ─────────── Estados locales ─────────── */
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const today = getISOfromDate(new Date());

  /* ─────────── Avisar al padre cuando cambie la selección ─────────── */
  useEffect(() => {
    if (onSelectionChange) {
      const selected = data.filter((q) => selectedIds.has(q.id));
      onSelectionChange(selected);
    }
  }, [selectedIds, data, onSelectionChange]);

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const copy = new Set(prev);
      copy.has(id) ? copy.delete(id) : copy.add(id);
      return copy;
    });
  };

  /* ─────────── Definición de columnas ─────────── */
  const columns = useMemo<ColumnDef<Quota, any>[]>(
    () => [
      ...(selectable
        ? [
            {
              id: "select",
              header: () => null,
              cell: ({ row }) => (
                <Checkbox
                  checked={selectedIds.has(row.original.id)}
                  onCheckedChange={() => toggle(row.original.id)}
                />
              ),
              enableSorting: false,
              enableColumnFilter: false,
              size: 40,
            },
          ]
        : []),
      {
        accessorKey: "description",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
          >
            Descripción
            <ArrowUpDown className="ml-1 h-4 w-4" />
          </Button>
        ),
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "amount",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
          >
            Monto
            <ArrowUpDown className="ml-1 h-4 w-4" />
          </Button>
        ),
        cell: ({ getValue }) => `S/. ${getValue<number>().toFixed(2)}`,
      },
      {
        accessorKey: "issueDate",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
          >
            Fecha emisión
            <ArrowUpDown className="ml-1 h-4 w-4" />
          </Button>
        ),
      },
      {
        accessorKey: "dueDate",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
          >
            Fecha vencimiento
            <ArrowUpDown className="ml-1 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const q = row.original;
          const isOverdue =
            q.status === "PENDIENTE" && q.dueDate < today;
          return (
            <span className={isOverdue ? "text-red-600" : ""}>{q.dueDate}</span>
          );
        },
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
          >
            Estado
            <ArrowUpDown className="ml-1 h-4 w-4" />
          </Button>
        ),
      },
      ...(showActions
        ? [
            {
              id: "action",
              header: () => "Acción",
              enableSorting: false,
              cell: ({ row }) => {
                const q = row.original;
                return (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => onAction?.(q)}
                  >
                    {q.status === "PENDIENTE" || q.status === "VENCIDO"
                      ? "Pagar recibo"
                      : "Ver recibo"}
                  </Button>
                );
              },
            },
          ]
        : []),
    ],
    [selectable, selectedIds, showActions, onAction]
  );

  /* ─────────── React-Table instance ─────────── */
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
      columnFilters,
    },
    initialState: {
      pagination: { pageSize: 5 },
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    globalFilterFn,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  /* ─────────── Render ─────────── */
  return (
    <div className="background-custom rounded-2xl p-4 my-6 ">
      {/* Buscador */}
      <Input
        placeholder="Buscar por monto, fecha o estado…"
        value={globalFilter ?? ""}
        onChange={(e) => setGlobalFilter(e.target.value)}
        className="mb-4 max-w-sm"
      />

      {/* Tabla */}
      <div className="overflow-auto">
        <table className="w-full text-left">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="text-[var(--brand)]">
                {hg.headers.map((header) => (
                  <th key={header.id} className="whitespace-nowrap">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className={
                  row.index % 2 === 0 ? "bg-amber-50 dark:bg-gray-700" : ""
                }
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="py-2 px-1">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-end gap-1 mt-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronsLeftIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </Button>

        <span className="px-2 text-sm">
          Página {table.getState().pagination.pageIndex + 1} de{" "}
          {table.getPageCount()}
        </span>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
        >
          <ChevronsRightIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

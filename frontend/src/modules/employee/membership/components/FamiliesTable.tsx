// src/modules/employee/membership/components/FamiliesTable.tsx
import * as React from "react";
import {
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowUpDown,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from "lucide-react";
import FamilyActionMenu from "./FamilyActionMenu";

/* ───────────── Tipos ───────────── */
interface ApiFamilyRequest {
  requestId: number;
  isForInclusion: boolean;
  requestinMemberId: number;
  requestingMemberName: string;
  requestingMemberLastName: string;
  familiarName: string;
  familiarLastName: string;
  relationship: string;
  submissionDate: string | null;
  requestState: string | null;
  reason: string;
}

type FamilyRequest = {
  id: number;
  memberName: string;
  familyName: string;
  requestType: string;
  relationship: string;
  requestDate: string;
  status: "Pendiente" | "En revisión" | "Aprobada" | "Rechazada";
};

export default function FamiliesTable() {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [filters, setFilters] = React.useState<ColumnFiltersState>([]);
  const [data, setData] = React.useState<FamilyRequest[]>([]);
  const [loading, setLoading] = React.useState(true);

  /* ───────────── Fetch datos ───────────── */
  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/member-requests/family-all-manager`,
        {
          credentials: "include",
        }
      );
      const response = await res.json();
      const apiData = Array.isArray(response) ? response : response.data;

      const mapped: FamilyRequest[] = apiData.map((item: ApiFamilyRequest) => ({
        id: item.requestId,
        memberName: `${item.requestingMemberName} ${item.requestingMemberLastName}`,
        familyName: `${item.familiarName} ${item.familiarLastName}`,
        requestType: item.isForInclusion ? "Inclusión" : "Retiro",
        relationship: item.relationship,
        requestDate: item.submissionDate
          ? new Date(item.submissionDate).toLocaleDateString()
          : "—",
        status:
          item.requestState === "PENDING"
            ? "Pendiente"
            : item.requestState === "APPROVED"
            ? "Aprobada"
            : item.requestState === "REJECTED"
            ? "Rechazada"
            : "En revisión",
      }));

      setData(mapped);
    } catch (err) {
      console.error("Error al obtener solicitudes familiares:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ───────────── Config tabla ───────────── */
  const table = useReactTable({
    data,
    columns: [
      {
        accessorKey: "memberName",
        size: 320,
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
            className="text-[var(--brand)] font-semibold -ml-1"
          >
            Nombre del socio <ArrowUpDown className="ml-1 h-4 w-4" />
          </Button>
        ),
        cell: (info) => (
          <span className="pl-2 w-64 max-w-[16rem] truncate inline-block">
            {info.getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: "familyName",
        size: 320,
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
            className="text-[var(--brand)] font-semibold -ml-1"
          >
            Nombre del Familiar <ArrowUpDown className="ml-1 h-4 w-4" />
          </Button>
        ),
        cell: (info) => (
          <span className="pl-2 w-64 max-w-[16rem] truncate inline-block">
            {info.getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: "requestType",
        header: () => (
          <div className="text-[var(--brand)] font-semibold -ml-6">
            Tipo de solicitud
          </div>
        )
      },
      {
        accessorKey: "relationship",
        header: () => (
          <div className="text-[var(--brand)] font-semibold -ml-2">
            Parentesco
          </div>
        )
      },
      {
        accessorKey: "requestDate",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
            className="text-[var(--brand)] font-semibold ml-8"
          >
            Fecha de Solicitud <ArrowUpDown className="ml-1 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="text-center">
            {row.original.requestDate}
          </div>
        )
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
            className="text-[var(--brand)] font-semibold -ml-1"
          >
            Estado <ArrowUpDown className="ml-1 h-4 w-4" />
          </Button>
        ),
        cell: ({ getValue }) => {
          const v = getValue<string>();
          const color =
            v === "Pendiente"
              ? "bg-yellow-400/30"
              : v === "En revisión"
              ? "bg-blue-400/30"
              : v === "Aprobada"
              ? "bg-green-400/30"
              : "bg-red-400/30";
          return (
            <span className={`px-2 py-0.5 rounded-lg text-xs ${color}`}>{v}</span>
          );
        },
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <FamilyActionMenu family={row.original} onResolved={fetchData} />
        ),
      },
    ],
    state: { sorting, columnFilters: filters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (loading) return <div className="text-center py-10">Cargando solicitudes…</div>;

  /* ───────────── UI tabla ───────────── */
  return (
    <div className="w-full">
      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Buscar por nombre o número de socio"
          value={(table.getColumn("memberName")?.getFilterValue() as string) || ""}
          onChange={(e) =>
            table.getColumn("memberName")?.setFilterValue(e.target.value)
          }
          className="max-w-xs"
        />
      </div>

      <div className="overflow-auto rounded-lg">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id} className="whitespace-nowrap">
                    {h.isPlaceholder
                      ? null
                      : typeof h.column.columnDef.header === "function"
                      ? h.column.columnDef.header(h.getContext())
                      : h.column.columnDef.header}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {typeof cell.column.columnDef.cell === "function"
                      ? cell.column.columnDef.cell(cell.getContext())
                      : cell.column.columnDef.cell}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      <div className="flex justify-between items-center mt-4">
        <span className="text-sm">
          Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
        </span>
        <div className="flex gap-1">
          <IconBtn
            icon={<ChevronsLeftIcon />}
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          />
          <IconBtn
            icon={<ChevronLeftIcon />}
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          />
          <IconBtn
            icon={<ChevronRightIcon />}
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          />
          <IconBtn
            icon={<ChevronsRightIcon />}
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          />
        </div>
      </div>
    </div>
  );
}

function IconBtn({
  icon,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <Button
      size="icon"
      variant="outline"
      onClick={onClick}
      disabled={disabled}
      className="h-8 w-8"
    >
      {icon}
    </Button>
  );
}

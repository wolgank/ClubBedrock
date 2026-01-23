// src/modules/employee/membership/components/RequestTable.tsx
import * as React from "react";
import {
  ColumnDef,
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
import RequestsActionMenu from "./RequestsActionMenu";   // 👈 vuelve la importación

/* ---------- tipos ---------- */
type ApiSummary = {
  id: number;
  applicantName: string;
  applicantLastName: string;
  submissionDate: string;
  requestState: "PENDING" | "APPROVED" | "REJECTED" | "IN_REVIEW";
  validRecommendations: number;
};

type Request = {
  id: number;
  fullName: string;
  createdAt: string;
  refs: string;
  status: "Pendiente" | "En revisión" | "Aprobada" | "Rechazada";
};

/* ---------- util ---------- */
function formatDateUTC(fecha: string) {
  const d = new Date(fecha);
  return `${d.getUTCDate().toString().padStart(2, "0")}/${(d.getUTCMonth() + 1)
    .toString()
    .padStart(2, "0")}/${d.getUTCFullYear()}`;
}

/* ---------- componente ---------- */
export default function RequestTable() {
  const [data, setData] = React.useState<Request[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [filters, setFilters] = React.useState<ColumnFiltersState>([]);

  /* carga inicial */
  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/membership-applications`,
          { credentials: "include" }
        );
        if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);

        const json: ApiSummary[] = await res.json();

        const mapped: Request[] = json
          .sort(
            (a, b) =>
              new Date(b.submissionDate).getTime() -
              new Date(a.submissionDate).getTime()
          )
          .map((item) => ({
            id: item.id,
            fullName: `${item.applicantName} ${item.applicantLastName}`,
            createdAt: formatDateUTC(item.submissionDate),
            refs: `${item.validRecommendations}/2`,
            status:
              item.requestState === "PENDING"
                ? "Pendiente"
                : item.requestState === "IN_REVIEW"
                ? "En revisión"
                : item.requestState === "APPROVED"
                ? "Aprobada"
                : "Rechazada",
          }));

        setData(mapped);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* definición de columnas –– sin checkbox, con menú de acciones */
  const columns: ColumnDef<Request>[] = [
    {
      accessorKey: "fullName",
      size: 320,
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="text-[#318161] font-semibold"
        >
          Nombre <ArrowUpDown className="ml-1 h-4 w-4" />
        </Button>
      ),
      cell: (info) => <span className="pl-2 w-64 max-w-[16rem] truncate inline-block">{info.getValue<string>()}</span>,
    },
    {
      accessorKey: "createdAt",
      sortingFn: "datetime",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="text-[#318161] font-semibold"
        >
          Fecha <ArrowUpDown className="ml-1 h-4 w-4" />
        </Button>
      ),
      
    },
    { accessorKey: "refs", header: "Referencias Válidas / Requeridas" },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="text-[#318161] font-semibold"
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
    /* 👇 columna de tres puntos */
    {
      id: "actions",
      header: () => null,
      cell: ({ row }) => <RequestsActionMenu request={row.original} />,
    },
  ];

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters: filters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  /* estados de carga */
  if (loading) return <div>Cargando solicitudes…</div>;
  if (error) return <div className="text-red-600">Error: {error}</div>;

  /* render */
  return (
    <div className="w-full">
      {/* búsqueda */}
      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Buscar por nombre"
          value={(table.getColumn("fullName")?.getFilterValue() as string) || ""}
          onChange={(e) =>
            table.getColumn("fullName")?.setFilterValue(e.target.value)
          }
          className="max-w-xs"
        />
      </div>

      {/* tabla */}
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

      {/* paginación */}
      <div className="flex justify-between items-center mt-4">
        <span className="text-sm">
          Página {table.getState().pagination.pageIndex + 1} de{" "}
          {table.getPageCount()}
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

/* botón de paginación */
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

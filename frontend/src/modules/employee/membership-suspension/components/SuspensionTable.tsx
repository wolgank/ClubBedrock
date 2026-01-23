// src/modules/employee/membership-suspension/components/SuspensionTable.tsx
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowUpDown,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  Eye,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import ResolveChangeModal from "@/modules/employee/membership-suspension/components/ResolveChangeModal";

/* ---------- Tipos ---------- */
type ApiInitiated = {
  requestId:       number;
  membershipCode:  string;
  titularFullName: string;
  memberReason:    string | null;
  requestState:    "PENDING" | "APPROVED" | "REJECTED";
  type:            "SUSPENSION" | "DISAFFILIATION";
  changeStartDate: string;
  changeEndDate:   string | null;
};

type Row = {
  requestId:       number;
  membershipCode:  string;
  titularFullName: string;
  reason:          string;
  state:           "Pendiente" | "Aprobada" | "Rechazada";
  start:           string;
  end:             string;
};

interface Props {
  action: "suspend" | "annul";   // define filtro
}

/* Color map for estados */
const stateBg = {
  Pendiente: "bg-yellow-100 text-yellow-800",
  Aprobada:  "bg-green-100 text-green-800",
  Rechazada: "bg-red-100 text-red-800",
};

/* ---------- Componente ---------- */
export default function SuspensionTable({ action }: Props) {
  const [data, setData]         = useState<Row[]>([]);
  const [loading, setLoading]   = useState(true);
  const [sorting, setSorting]   = useState<SortingState>([]);
  const [filters, setFilters]   = useState<ColumnFiltersState>([]);
  const [openDetails, setOpenDetails] = useState(false);
  const [openResolve, setOpenResolve] = useState(false);  // NUEVO
  const [selected, setSelected] = useState<Row | null>(null);
  const backendURL = import.meta.env.VITE_BACKEND_URL;

  /* ---- carga datos (reutilizable) ---- */
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${backendURL}/api/membership-change-requests/member-initiated`,
        { credentials: "include" },
      );
      const json: ApiInitiated[] = await res.json();
      const rows: Row[] = json
        .filter(r => r.type === (action === "annul" ? "DISAFFILIATION" : "SUSPENSION"))
        .map(r => ({
          requestId:       r.requestId,
          membershipCode:  r.membershipCode,
          titularFullName: r.titularFullName,
          reason:          r.memberReason ?? "—",
          state:           r.requestState === "PENDING"  ? "Pendiente"
                         : r.requestState === "APPROVED" ? "Aprobada"
                         : "Rechazada",
          start:           r.changeStartDate,
          end:             r.changeEndDate ?? "—",
        }));
      setData(rows);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [action]);

  /* ---- botones de acción ---- */
  const actionBtns = (row: Row) => (
    <div className="flex gap-1">
      {/* Ver */}
      <Button
        size="icon"
        variant="ghost"
        title="Ver detalles"
        onClick={() => { setSelected(row); setOpenDetails(true); }}
      >
        <Eye className="h-4 w-4 text-[#318161]" />
      </Button>

      {/* Resolver (solo pendiente) */}
      {row.state === "Pendiente" && (
        <Button
          size="icon"
          variant="outline"
          title="Resolver solicitud"
          onClick={() => { setSelected(row); setOpenResolve(true); }}
        >
          ✔︎
        </Button>
      )}
    </div>
  );

  /* ---- columnas ---- */
  const columns = useMemo<ColumnDef<Row>[]>(() => [
    { accessorKey: "titularFullName", header: () => "Nombre del Socio" },
    { accessorKey: "membershipCode",  header: () => "N.º Membresía" },
    {
      accessorKey: "state",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting()}>
          Estado <ArrowUpDown className="ml-1 h-4 w-4" />
        </Button>
      ),
      cell: info => {
        const value = info.getValue<string>() as keyof typeof stateBg;
        return (
          <span className={`px-2 py-0.5 rounded-lg text-xs ${stateBg[value]}`}>
            {value}
          </span>
        );
      }
    },
    { accessorKey: "reason", header: () => "Motivo" },
    { accessorKey: "start",  header: () => "Inicio" },
    { accessorKey: "end",    header: () => "Fin" },
    { id: "actions", header: () => null, cell: ({ row }) => actionBtns(row.original) },
  ], []);

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters: filters },
    onSortingChange:       setSorting,
    onColumnFiltersChange: setFilters,
    getCoreRowModel:       getCoreRowModel(),
    getSortedRowModel:     getSortedRowModel(),
    getFilteredRowModel:   getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (loading) return <div>Cargando…</div>;

  /* ---------- Render ---------- */
  return (
    <>
      {/* ----- Modal Resolver ----- */}
      {selected && openResolve && (
        <ResolveChangeModal
          data={{
            requestId: selected.requestId,
            type: action === "annul" ? "DISAFFILIATION" : "SUSPENSION",
          }}
          onResolved={() => {
            setOpenResolve(false);
            setSelected(null);
            loadData();         // refresca tabla
          }}
          onClose={() => setOpenResolve(false)}
        />
      )}

      {/* ----- Modal Detalles ----- */}
      <Dialog open={openDetails} onOpenChange={setOpenDetails}>
        <DialogContent className="max-w-2xl background-custom">
          <DialogHeader>
            <DialogTitle>
              {action === "annul" ? "Anular" : "Suspender"} Membresía
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              {/* … (detalle igual que antes) … */}
              <p><strong>N.º Membresía:</strong> {selected.membershipCode}</p>
              <p><strong>Titular:</strong> {selected.titularFullName}</p>
              <p><strong>Motivo:</strong> {selected.reason}</p>
              <p><strong>Inicio:</strong> {selected.start}</p>
              <p><strong>Fin:</strong> {selected.end}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ----- Encabezado & buscador ----- */}
      <h2 className="text-2xl font-bold mb-4">
        {action === "annul"
          ? "Solicitudes de Anulación"
          : "Solicitudes de Suspensión"}
      </h2>

      <Input
        placeholder="Buscar…"
        className="max-w-xs mb-4"
        value={(table.getColumn("membershipCode")?.getFilterValue() as string) || ""}
        onChange={e => {
          const v = e.target.value;
          table.getColumn("membershipCode")?.setFilterValue(v);
          table.getColumn("titularFullName")?.setFilterValue(v);
          table.getColumn("reason")?.setFilterValue(v);
        }}
      />

      {/* ----- Tabla ----- */}
      <div className="overflow-auto rounded-lg background-custom p-2">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(hg => (
              <TableRow key={hg.id}>
                {hg.headers.map(h => (
                  <TableHead key={h.id}>
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map(r => (
              <TableRow key={r.id}>
                {r.getVisibleCells().map(c => (
                  <TableCell key={c.id}>
                    {flexRender(c.column.columnDef.cell, c.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* ----- Paginación ----- */}
      <div className="flex justify-end gap-1 mt-4">
        <Button size="icon" variant="outline"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}>
          <ChevronsLeftIcon />
        </Button>
        <Button size="icon" variant="outline"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}>
          <ChevronLeftIcon />
        </Button>
        <Button size="icon" variant="outline"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}>
          <ChevronRightIcon />
        </Button>
        <Button size="icon" variant="outline"
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}>
          <ChevronsRightIcon />
        </Button>
      </div>
    </>
  );
}

import React, { useEffect, useState } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
} from "@/shared/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Plus, Check } from "lucide-react";

/* ────────── Tipos ────────── */
interface Membership {
  id: number;
  code: string;
  state: "ACTIVE" | "ENDED" | "ON_REVISION" | "PRE_ADMITTED";
}

/* Traducción directa del backend */
const STATE_ES: Record<Membership["state"], string> = {
  ENDED: "Inactiva",
  ACTIVE: "Activa",
  ON_REVISION: "En revisión",
  PRE_ADMITTED: "Pre‑admitida",
};

/* ────────── Constantes ────────── */
const backendUrl = import.meta.env.VITE_BACKEND_URL;

/* ────────── Componentes auxiliares ────────── */
const StatePill = ({ state }: { state: Membership["state"] }) => (
  <span className="inline-block rounded-full bg-rose-100 px-3 py-0.5 text-xs font-medium text-rose-700 dark:bg-rose-900/20 dark:text-rose-300">
    {STATE_ES[state]}
  </span>
);

const SelectBtn = ({
  selected,
  toggle,
}: {
  selected: boolean;
  toggle: () => void;
}) => (
  <Button
    size="icon"
    variant="outline"
    onClick={toggle}
    className={
      selected
        ? "bg-[var(--brand)] text-[var(--text-light)] hover:bg-[var(--brand-light)]"
        : "hover:bg-muted/60"
    }
  >
    {selected ? <Check size={16} /> : <Plus size={16} />}
  </Button>
);

/* ────────── Página ────────── */
export default function ReactivateMembershipTable() {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  /* Cargar solo INACTIVAS (state = ENDED) */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${backendUrl}/api/memberships`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Error al obtener membresías");
        const data: Membership[] = await res.json();
        console.table(data); // debug
        setMemberships(data.filter((m) => m.state === "ENDED"));
      } catch (err: any) {
        toast.error(err.message ?? "No se pudo cargar la información");
      }
    })();
  }, []);

  /* Helpers de selección */
  const toggleSelect = (id: number) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  /* Reactivar */
  const handleReactivate = async () => {
    setLoading(true);
    try {
      await Promise.all(
        selectedIds.map(async (id) => {
          const res = await fetch(
            `${backendUrl}/api/membership-change-requests/membership/${id}/reactivate`,
            { method: "POST", credentials: "include" },
          );
          if (!res.ok) throw new Error(`Error reactivando membresía #${id}`);
        }),
      );
      toast.success("Membresías reactivadas");
      setMemberships((prev) => prev.filter((m) => !selectedIds.includes(m.id)));
      setSelectedIds([]);
    } catch (err: any) {
      toast.error(err.message ?? "Hubo un problema al reactivar");
    } finally {
      setLoading(false);
      setConfirmOpen(false);
    }
  };

  /* ────────── Render ────────── */
  return (
    <section className="mx-auto mt-10 flex w-full max-w-4xl flex-col gap-6 px-4">
      {/* Encabezado + botón */}
      <div className="flex items-center gap-2">
        <h2 className="text-2xl font-bold">Reactivar membresías</h2>
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogTrigger asChild>
            <Button
              disabled={selectedIds.length === 0 || loading}
              className="ml-2 bg-[var(--brand)] px-6 text-[var(--text-light)] hover:bg-[var(--brand-light)] dark:bg-[var(--brand)] dark:hover:bg-[var(--brand-light)]"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reactivar
            </Button>
          </DialogTrigger>

          <DialogContent>
            <h3 className="mb-4 text-xl font-semibold">
              Confirmar reactivación
            </h3>
            <p className="mb-6">
              {selectedIds.length === 1
                ? "¿Seguro que deseas reactivar la membresía seleccionada?"
                : `¿Seguro que deseas reactivar las ${selectedIds.length} membresías seleccionadas?`}
            </p>
            <div className="flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={() => setConfirmOpen(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleReactivate}
                disabled={loading}
                className="bg-[var(--brand)] text-[var(--text-light)] hover:bg-[var(--brand-light)] dark:bg-[var(--brand)] dark:hover:bg-[var(--brand-light)]"
              >
                {loading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
                )}
                Confirmar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabla */}
      <div className="w-full overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14" />
              <TableHead>ID</TableHead>
              <TableHead>Código</TableHead>
              <TableHead className="w-40">Estado</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {memberships.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="text-center">
                  <SelectBtn
                    selected={selectedIds.includes(m.id)}
                    toggle={() => toggleSelect(m.id)}
                  />
                </TableCell>
                <TableCell>{m.id}</TableCell>
                <TableCell>{m.code}</TableCell>
                <TableCell className="text-center">
                  <StatePill state={m.state} />
                </TableCell>
              </TableRow>
            ))}

            {memberships.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center">
                  No hay membresías <b>INACTIVAS</b>.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

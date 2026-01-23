// src/modules/employee/membership-suspension/components/InnerTabs.tsx
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function InnerTabs() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  /* ─────────── Navegación ─────────── */
  const onSuspender = () => navigate("suspender");
  const onAnular    = () => navigate("anular");
  const onReactivar = () => navigate("reactivar");   // ← nueva pestaña

  /* ─────────── Estado activo ─────────── */
  const activeSusp = pathname.endsWith("/suspender");
  const activeAnul = pathname.endsWith("/anular");
  const activeReac = pathname.endsWith("/reactivar"); // ← nuevo chequeo

  /* ─────────── Estilos ─────────── */
  const base  = "px-4 py-2 font-medium";
  const act   = "border-b-2 border-[var(--brand)] text-[var(--text-dark)]";
  const inact = "text-[var(--brand)] hover:text-[var(--brand-light)]";

  return (
    <nav className="flex gap-6 mb-6">
      <Button
        variant="ghost"
        onClick={onSuspender}
        className={`${base} ${activeSusp ? act : inact}`}
        type="button"
      >
        Suspender Membresía
      </Button>

      <Button
        variant="ghost"
        onClick={onAnular}
        className={`${base} ${activeAnul ? act : inact}`}
        type="button"
      >
        Anulación de Membresía
      </Button>

      <Button
        variant="ghost"
        onClick={onReactivar}
        className={`${base} ${activeReac ? act : inact}`}
        type="button"
      >
        Reactivaciones
      </Button>
    </nav>
  );
}

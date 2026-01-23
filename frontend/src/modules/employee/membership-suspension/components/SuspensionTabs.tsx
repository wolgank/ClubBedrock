// SuspensionTabs.tsx
import { useNavigate, useLocation, useMatch } from "react-router-dom";
import { Button } from "@/components/ui/button";

const ROUTE_OPERACIONES = "/employee-membership/operaciones";
const ROUTE_REACTIVAR   = "/employee-membership/reactivar";

interface Props {
  /** opcional en la ruta /reactivar */
  action?: "suspend" | "annul";
  onChange: (action: "suspend" | "annul") => void;
}

export default function SuspensionTabs({ action, onChange }: Props) {
  const navigate     = useNavigate();
  const { pathname } = useLocation();

  /* 1️⃣  Detectamos “reactivar” con un match más robusto */
  const isReactivar = pathname.startsWith(ROUTE_REACTIVAR);   // admite /reactivar/, /reactivar/123, etc.

  /* 2️⃣  Pestaña activa solo si NO estamos en /reactivar */
  const isSuspender = !isReactivar && action === "suspend";
  const isAnular    = !isReactivar && action === "annul";

  /* 3️⃣  Helper de navegación: si estamos en /reactivar -> salir a Operaciones */
  const go = (dest: "suspend" | "annul") => {
    if (isReactivar) {
      navigate(ROUTE_OPERACIONES);        // la ruta realmente registrada
    }
    onChange(dest);                       // selecciona la pestaña
  };

  /* ─── Estilos común/es ─────────────────────────────────────── */
  const base     = "px-4 py-2 font-medium";
  const active   = "border-b-2 border-[var(--brand)]";
  const inactive = "text-[var(--brand)] hover:text-[var(--brand-light)]";

  return (
    <nav className="w-full max-w-[1339px] px-[34px] flex gap-6 mt-2">
      {/* Suspender */}
      <Button
        variant="ghost"
        onClick={() => go("suspend")}
        className={`${base} ${isSuspender ? active : inactive}`}
      >
        Suspender Membresía
      </Button>

      {/* Anular */}
      <Button
        variant="ghost"
        onClick={() => go("annul")}
        className={`${base} ${isAnular ? active : inactive}`}
      >
        Anular Membresía
      </Button>

      {/* Reactivar */}
      <Button
        variant="ghost"
        onClick={() => navigate(ROUTE_REACTIVAR)}
        className={`${base} ${isReactivar ? active : inactive}`}
      >
        Reactivar Membresía
      </Button>
    </nav>
  );
}

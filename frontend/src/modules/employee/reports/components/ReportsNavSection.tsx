// src/modules/employee/membership/components/ReportsNavSection.tsx
import { NavLink } from "react-router-dom";
import { DollarSign, AlertTriangle } from "lucide-react";

/* ───────── Ítems del sub-menú ───────── */
const items = [
  { key: "pagos", label: "Reporte de Pagos", icon: DollarSign, to: "/employee-membership/reportes" },
  { key: "moras", label: "Reporte de Moras", icon: AlertTriangle, to: "/employee-membership/reportes/moras" },
];

/* ───────── Componente ───────── */
export default function ReportsNavSection() {
  return (
    <div className="mt-4">
      {/* fondo blanco, sin bordes, padding ligero */}
      <nav className="inline-flex gap-3 rounded-2xl  px-3 py-0 mb-6">
        {items.map(({ key, label, icon: Icon, to }) => (
          <NavLink
            key={key}
            to={to}
            end
            className={({ isActive }) => `
              flex items-center gap-2 px-3 py-1 rounded-md transition-colors
              text-sm md:text-base
              ${isActive
                ? "border-b-2 border-[var(--brand)]"
                : "text-[var(--brand)] hover:text-[var(--brand-light)]"}
            `}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

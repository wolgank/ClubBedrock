// src/modules/employee/membership/components/ApplicationNavSection.tsx
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List, Wrench, BarChart2 } from "lucide-react";

const items = [
  { key: "dashboard",   label: "Principal",   icon: LayoutGrid, to: "/employee-membership/dashboard" },
  { key: "solicitudes", label: "Solicitudes", icon: List,       to: "/employee-membership/solicitud" },
  { key: "operaciones", label: "Operaciones", icon: Wrench,     to: "/employee-membership/operaciones" },
  { key: "reportes",    label: "Reportes",    icon: BarChart2,  to: "/employee-membership/reportes" },
];

export default function ApplicationNavSection() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <div className="w-full flex justify-center my-6">
      <Card className="rounded-2xl shadow-md background-custom">
        <CardContent className="flex gap-8">
          {items.map(({ key, label, icon: Icon, to }) => {
            // para "solicitudes" ya incluyes /solicitud y /familiares
            // ahora para "operaciones" abarcas su raíz y subrutas
            const active =
              key === "solicitudes"
                ? pathname.startsWith("/employee-membership/solicitud") ||
                  pathname.startsWith("/employee-membership/familiares")
              : key === "operaciones"
                  ? pathname.startsWith("/employee-membership/operaciones") ||
                  pathname.startsWith("/employee-membership/anular")
              : key === "reportes"                             // 👈 NUEVO
                ? pathname.startsWith("/employee-membership/reportes") ||
                pathname.startsWith("/employee-membership/reportes/moras")
              : pathname.startsWith(to);
              
            return (
              <Button
                key={key}
                variant="ghost"
                onClick={() => navigate(to)}
                className={`
                  flex items-center gap-2 px-4 py-2
                  ${active
                    ? "border-b-2 border-[var(--brand)]"
                    : "text-[var(--brand)] hover:text-[var(--brand-light)]"
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </Button>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

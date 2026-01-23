// src/modules/user/membership/components/TabNavigation.tsx
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List, AlertTriangle } from "lucide-react";

const items = [
  {
    key: "consulta",
    label: "General", // antes Consulta de cuotas
    icon: LayoutGrid,
    to: "/membresia/consulta-cuotas",
  },
  {
    key: "pago",
    label: "Pago de cuotas",
    icon: List,
    to: "/membresia/pago-cuotas",
  },
  {
    key: "familiares",
    label: "Gestión de familiares",
    icon: AlertTriangle,
    to: "/membresia/gestion-familiares",
  },
];

export default function TabNavigation() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <div className="w-full flex justify-center my-6">
      <Card className="rounded-2xl background-custom">
        <CardContent className="flex gap-8">
          {items.map(({ key, label, icon: Icon, to }) => {
            // Para "consulta" lo marcamos activo también cuando estamos en `/membership`
            const active =
              key === "consulta"
                ? pathname === "/membresia" ||
                  pathname.startsWith(to)
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

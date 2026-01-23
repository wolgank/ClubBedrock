import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { FamilyPolicyForm } from "../components/FamilyPolicyForm";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import { ConfigureFeeForm } from "./ConfigureFeeForm";
import { ClubConfigRatesDialog } from "./ConfigureMoratory";

interface DashboardItem {
  label: string;
  to: string;
  type: "nav" | "popup";
  component?: React.ComponentType<{ open: boolean; onClose: () => void }>;
}

const items: DashboardItem[] = [
  { label: "Revisar Solicitudes",          to: "/employee-membership/solicitud", type: "nav" },
  { label: "Analizar pagos pendientes",    to: "/employee-membership/reportes",  type: "nav" },
  { label: "Configurar Cuota de Ingreso",  to: "cuota",     type: "popup", component: ConfigureFeeForm },
  { label: "Configurar Tasa de Interés/Mora", to: "tasas",  type: "popup", component: ClubConfigRatesDialog },
  { label: "Configurar Políticas Familiares", to: "familiares", type: "popup", component: FamilyPolicyForm },
];

export default function DashboardActions() {
  const navigate = useNavigate();
  const [currentDialog, setCurrentDialog] = useState<string | null>(null);

  const handleOpenChange = (to: string) => (isOpen: boolean) => {
    setCurrentDialog(isOpen ? to : null);
  };

  /* …código anterior… */
  return (
    <div
      /* 🔸 cuadrícula responsiva:
          xs: 1 col  |  sm: 2  |  md: 3  |  lg: 4  |  xl: 5  */
      className="
        grid gap-4 mb-10
        grid-cols-1
        sm:grid-cols-2
        md:grid-cols-3
        lg:grid-cols-4
        xl:grid-cols-5
      "
    >
      {items.map(({ label, to, type, component: Component }) =>
        type === "popup" && Component ? (
          <Dialog key={to} open={currentDialog === to} onOpenChange={handleOpenChange(to)}>
            <DialogTrigger asChild>
              <Button
                /* 🔸 wrap + centrado */
                className="w-full button3-custom text-[var(--text-light)] text-center whitespace-normal"
              >
                {label}
              </Button>
            </DialogTrigger>

            <DialogContent className="backdrop-blur-sm bg-white/90 w-fit sm:max-w-5xl max-h-screen overflow-y-auto">
              <Component open={currentDialog === to} onClose={() => setCurrentDialog(null)} />
            </DialogContent>
          </Dialog>
        ) : (
          <Button
            key={to}
            onClick={() => navigate(to)}
            className="w-full button3-custom text-[var(--text-light)] text-center whitespace-normal"
          >
            {label}
          </Button>
        )
      )}
    </div>
  );

}

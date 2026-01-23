// components/MoraSummaryGrid.tsx
import MoraSummaryCard from "./MoraSummaryCard";
import { AlertTriangle, DollarSign, GaugeCircle } from "lucide-react";

interface Stats {
  totalMembers: number;
  totalDebt: number;
  avgMonths: number;
}

export default function MoraSummaryGrid({ stats }: { stats: Stats }) {
  const { totalMembers, totalDebt, avgMonths } = stats;
  return (
    <div className="flex flex-wrap gap-6 my-6 justify-center">
      <MoraSummaryCard
        title="Total de socios en mora"
        value={totalMembers}
        subtitle="+7%"
        icon={<AlertTriangle className="w-6 h-6" />}
      />
      <MoraSummaryCard
        title="Suma total de la deuda"
        value={`S/ ${totalDebt.toFixed(2)}`}
        subtitle="+45%"
        icon={<DollarSign className="w-6 h-6" />}
      />
      <MoraSummaryCard
        title="Promedio de meses en mora"
        value={avgMonths.toFixed(1)}
        subtitle="+9%"
        icon={<GaugeCircle className="w-6 h-6" />}
      />
    </div>
  );
}

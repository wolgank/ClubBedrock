// components/MoraSummaryCard.tsx
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;   // p. ej. “+7%”
  icon?: React.ReactNode;
}

export default function MoraSummaryCard({ title, value, subtitle, icon }: Props) {
  return (
    <Card className="w-56 rounded-2xl shadow-md bg-[var(--brand-dark)] text-[var(--bg-light)]">
      <CardContent className="flex flex-col items-center gap-1 py-5">
        {icon}
        <span className="text-sm">{title}</span>
        <span className="text-4xl font-semibold">{value}</span>
        {subtitle && <span className="text-xs opacity-80">{subtitle}</span>}
      </CardContent>
    </Card>
  );
}

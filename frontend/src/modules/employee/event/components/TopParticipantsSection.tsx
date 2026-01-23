
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUpIcon, TrendingDownIcon } from "lucide-react";

const statsCards = [
  {
    title: "Total de eventos organizados",
    description: "Eventos realizados este mes",
    value: "170",
    trend: "+5%",
    trendPositive: true,
    footerText: "Comparado con el mes anterior",
  },
  {
    title: "Total de participantes acumulados",
    description: "Participantes en total",
    value: "230",
    trend: "+8%",
    trendPositive: true,
    footerText: "Crecimiento anual",
  },
  {
    title: "Promedio de asistentes por evento",
    description: "Asistencia promedio",
    value: "35",
    trend: "+6%",
    trendPositive: true,
    footerText: "Tendencia estable",
  },
];

export function SectionCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-4 lg:px-6 ">
      {statsCards.map((card, idx) => (
        <Card key={idx} className="@container/card to-card card-custom ">
          <CardHeader className="relative">
            <CardDescription className="text-sm text-muted-foreground">
              {card.description}
            </CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              {card.value}
            </CardTitle>
            <div className="absolute right-4 top-4">
              <Badge variant="outline" className="flex items-center gap-1 text-xs">
                {card.trendPositive ? <TrendingUpIcon className="w-4 h-4" /> : <TrendingDownIcon className="w-4 h-4" />}
                {card.trend}
              </Badge>
            </div>
          </CardHeader>
          <CardFooter className="flex flex-col items-start gap-1 text-sm">
            <div className="line-clamp-1 flex items-center gap-2 font-medium">
              {card.title}{' '}
              {card.trendPositive ? <TrendingUpIcon className="w-4 h-4" /> : <TrendingDownIcon className="w-4 h-4" />}
            </div>
            <div className="text-muted-foreground">
              {card.footerText}
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

export default SectionCards;
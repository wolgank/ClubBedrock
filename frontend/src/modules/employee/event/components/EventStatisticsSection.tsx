
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts"  // Recharts subyace en shadcn/ui Charts :contentReference[oaicite:5]{index=5}

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card"

import {
  ChartContainer,
  ChartConfig,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
const monthlyData = [
  { month: "nov", value: 10 },
  { month: "dic", value: 20 },
  { month: "ene", value: 18 },
  { month: "feb", value: 17 },
  { month: "mar", value: 15 },
  { month: "abr", value: 12 },
]

// Datos para los últimos 6 años
const yearlyData = [
  { year: "2020", value: 0 },
  { year: "2021", value: 10 },
  { year: "2022", value: 20 },
  { year: "2023", value: 110 },
  { year: "2024", value: 180 },
  { year: "2025", value: 120 },
]

// Configuración común para ambos gráficos
const chartConfig = {
  value: {
    label: "Eventos",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

export default function EventStatisticsSection() {
  return (
    <div className="w-full flex flex-col lg:flex-row gap-8">
      {/* Gráfico Mensual */}
      <Card className="flex-1  overflow-hidden card-custom">
        <CardHeader className="flex items-center justify-center gap-2 pb-2 pt-2.5">
          <CardTitle className="font-bold text-[var(--brand)] text-xl leading-[20px] ">
            N° Eventos por mes (últimos 6 meses)
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:p-6">
          <ChartContainer
            config={chartConfig}
            className="h-[250px] w-full"
          >
            <BarChart
              data={monthlyData}
              margin={{ top: 20, right: 20, left: 12, bottom: 5 }}
            >
              <CartesianGrid vertical={false} />  {/* Cuadrícula adaptada :contentReference[oaicite:9]{index=9} */}
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis
                tickCount={6}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                domain={[0, "dataMax + 5"]}
              />
              <ChartTooltip
                content={<ChartTooltipContent nameKey="Eventos" />}
              />
              <Bar dataKey="value" fill="var(--brand)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Gráfico Anual */}
      <Card className="flex-1  card-custom overflow-hidden">
        <CardHeader className="flex items-center justify-center gap-2 pb-2 pt-2.5">
          <CardTitle className="font-bold text-[var(--brand)] text-xl leading-[20px] ">
            N° Eventos por año (últimos 6 años)
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:p-6">
          <ChartContainer
            config={chartConfig}
            className="h-[250px] w-full"
          >
            <BarChart
              data={yearlyData}
              margin={{ top: 20, right: 20, left: 12, bottom: 5 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="year"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis
                tickCount={6}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                domain={[0, "dataMax + 20"]}
              />
              <ChartTooltip
                content={<ChartTooltipContent nameKey="Eventos" />}
              />
              <Bar dataKey="value" fill="var(--brand)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}

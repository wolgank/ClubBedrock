import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Award, TrendingUp } from "lucide-react";

export default function TopEventsSection() {
    // Data for top events
    const topEvents = [
        { event: "Concierto al aire libre", date: "21-04-2025", attendees: 95 },
        { event: "Gymkana Familiar", date: "18-04-2025", attendees: 80 },
        { event: "Tarde de Cine II", date: "15-04-2025", attendees: 76 },
        { event: "Feria Gastronómica", date: "12-04-2025", attendees: 75 },
        { event: "Concurso de disfraces", date: "10-04-2025", attendees: 70 },
    ];

    // Data for top members
    const topMembers = [
        { name: "Martín Salazar", lastAttendance: "10-01-2025", total: 15 },
        { name: "Carla Espinoza", lastAttendance: "05-02-2025", total: 13 },
        { name: "Felipe Navarro", lastAttendance: "28-02-2025", total: 12 },
        { name: "Rocío Meneses", lastAttendance: "15-03-2025", total: 10 },
        { name: "Andrés Lira", lastAttendance: "20-03-2025", total: 9 },
    ];

    return (
        <div className="w-full flex flex-col lg:flex-row gap-8 ">
            {/* Top Events Card */}
            <Card className="  flex-1 sm:w-[350px] md:w-[400px] card-custom">
                <CardHeader className="flex items-center justify-center gap-2 pb-2 pt-2.5">
                    <TrendingUp className="w-6 h-6" />
                    <CardTitle className="font-bold text-[var(--brand)] text-xl leading-[20px] ">
                        Top 5 Eventos
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-8 pb-2 ">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-[var(--brand)] text-sm font-semibold ">
                                    Evento
                                </TableHead>
                                <TableHead className="text-[var(--brand)] text-sm font-semibold text-center ">
                                    Fecha
                                </TableHead>
                                <TableHead className="text-[var(--brand)] text-sm font-semibold text-center ">
                                    Total Asistentes
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {topEvents.map((event, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-semibold text-[#142e38] text-sm py-2 dark:text-[var(--primary)]">
                                        {event.event}
                                    </TableCell>
                                    <TableCell className="font-semibold text-[#142e38] text-sm text-center py-2 dark:text-[var(--primary)]">
                                        {event.date}
                                    </TableCell>
                                    <TableCell className="font-semibold text-[#142e38] text-sm text-center py-2 dark:text-[var(--primary)]">
                                        {event.attendees}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Top Members Card */}
            <Card className="flex-1 sm:w-[350px] md:w-[400px] card-custom">
                <CardHeader className="flex items-center justify-center gap-2 pb-2 pt-2.5">
                    <Award className="w-6 h-6" />
                    <CardTitle className="font-bold text-[var(--brand)] text-xl leading-[20px] ">
                        Top 5 socios con mayor asistencia
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-8 pb-2">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-[var(--brand)] text-sm font-semibold ">
                                    Nombre
                                </TableHead>
                                <TableHead className="text-[var(--brand)] text-sm font-semibold text-center ">
                                    Último Asistencia
                                </TableHead>
                                <TableHead className="text-[var(--brand)] text-sm font-semibold text-center ">
                                    Total
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {topMembers.map((member, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-semibold text-[#142e38] text-sm py-2 dark:text-[var(--primary)]">
                                        {member.name}
                                    </TableCell>
                                    <TableCell className="font-semibold text-[#142e38] text-sm text-center py-2 dark:text-[var(--primary)]">
                                        {member.lastAttendance}
                                    </TableCell>
                                    <TableCell className="font-semibold text-[#142e38] text-sm text-center py-2 dark:text-[var(--primary)]">
                                        {member.total}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
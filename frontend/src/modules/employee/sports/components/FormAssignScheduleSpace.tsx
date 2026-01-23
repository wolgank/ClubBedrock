import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import {
    Table,
    TableHeader,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
} from "@/components/ui/table";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationPrevious,
    PaginationLink,
    PaginationNext,
} from "@/components/ui/pagination";

import React, { useState, useEffect } from "react";
import { NumericFormat } from "react-number-format";
import MensajeDeAviso from "./CreateSpaceModal";
import { useNavigate } from "react-router-dom";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Slice } from "lucide-react";
import { format } from "date-fns";
import { ca, es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { z } from "zod";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner"
import { useQuery } from "@tanstack/react-query";
import { getSpace } from "@/lib/api/apiSpace";
import { getTimeSlotDaySpaceIdALL } from "@/lib/api/apiSpaceDayTimeSlotForMember";
import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { deleteSpaceDayTimeSlotForMember } from "@/lib/api/apiSpaceDayTimeSlotForMember";
import { getSpecialReservationsBySpaceId, deleteReservationById } from "@/lib/api/apiReservation";
// -----------------------------
// Schema & Raw Data (unchanged)
// -----------------------------
export const SpaceSchema = z.object({
    id: z.number(),
    name: z.string(),
    description: z.string(),
    reference: z.string(),
    capacity: z.number(),
    canBeReserved: z.boolean(),
    type: z.enum(["LEISURE", "SPORTS"]),
    urlImage: z.string().optional(),
});
function parseDateWithoutTimezone(isoDate: string): Date {
    const [year, month, day] = isoDate.split('T')[0].split('-').map(Number);
    return new Date(year, month - 1, day); // mes base 0
}
function addHours(dateStr: string, hours: number): Date {
    const date = new Date(dateStr);
    date.setHours(date.getHours() + hours);
    return date;
}

export type SpaceType = {
    id: number;
    name: string;
    description: string;
    reference: string;
    capacity: number;
    urlImage: string;
    costPerHour: string;
    canBeReserved: boolean;
    isAvailable: boolean;
    type: 'LEISURE' | 'SPORTS';
};


export type SpaceItem = z.infer<typeof SpaceSchema>;


export type Space = { id: number; name: string };
const data: Space[] = [
    { id: 1, name: "SPORTS" },
    { id: 2, name: "LEISURE" },
];

// ------------------------------------------
// Reservation interface (unchanged)
// ------------------------------------------
interface Reservation {
    id: number;
    date: Date;
    start: string;
    end: string;
    type: "Miembro" | "Evento" | "Academia" | "Otros";
    reason: string;
}

// Order of weekdays for sorting
const WEEKDAY_ORDER: Record<string, number> = {
    Lunes: 1,
    Martes: 2,
    Miércoles: 3,
    Jueves: 4,
    Viernes: 5,
    Sábado: 6,
    Domingo: 7,
};

function getWeekdayName(dateInput: string | Date): string {
    const date = new Date(dateInput);
    const daysOfWeek = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    return daysOfWeek[date.getUTCDay()];
}

function combineDateAndTime(date: Date, time: string): string {
    const [hours, minutes] = time.split(":").map(Number);

    const combined = new Date(date); // clona la fecha base
    combined.setHours(hours - 5);
    combined.setMinutes(minutes);
    combined.setSeconds(0);
    combined.setMilliseconds(0);

    return combined.toISOString(); // Esto lo transforma a ISO
}


function getISODateFromDayAndTime(dayName: string, time: string): string {
    const daysMap: { [key: string]: number } = {
        "Domingo": 0,
        "Lunes": 1,
        "Martes": 2,
        "Miércoles": 3,
        "Jueves": 4,
        "Viernes": 5,
        "Sábado": 6,
    };

    const today = new Date();
    const todayDay = today.getDay(); // Día actual (0–6)
    const targetDay = daysMap[dayName];

    if (targetDay === undefined) throw new Error("Día inválido");

    // Calcular cuántos días faltan para el día objetivo
    const diffDays = (targetDay - todayDay + 7) % 7;
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + diffDays);

    // Extraer hora y minutos
    const [hours, minutes] = time.split(":").map(Number);

    // Establecer hora
    targetDate.setHours(hours - 5, minutes, 0, 0);

    // Convertir a ISO
    return targetDate.toISOString(); // → YYYY-MM-DDTHH:MM:00.000Z
}

export default function FormAssignScheduleSpace() {

    const queryClient = useQueryClient();


    // ------------------------------------------
    // Select Space state
    // ------------------------------------------
    const [spaceType, setSpaceType] = useState<"SPORTS" | "LEISURE">("SPORTS");
    const [spaceName, setSpaceName] = useState<string>("");
    const [imageSrc, setImageSrc] = useState<string | null>(null);

    const navigate = useNavigate();


    const { isLoading, error, data: spaces } = useQuery({
        queryKey: ['get-space'],
        queryFn: () => getSpace(),
    });

    const rawSpaces: SpaceItem[] = useMemo(() => {
        return spaces
            ? spaces.map(space => ({
                id: space.id,
                name: space.name,
                description: space.description,
                reference: space.reference,
                capacity: space.capacity,
                canBeReserved: space.canBeReserved,
                type: space.type,
                urlImage: space.urlImage,
            }))
            : [];
    }, [spaces]);

    const getDayOrder = (dayInput: string): number => {
        const asDate = new Date(dayInput);
        if (!isNaN(asDate.getTime())) {
            const d = asDate.getUTCDay();        // 0-6
            return d === 0 ? 7 : d;              // 7 = domingo
        }
        return WEEKDAY_ORDER[dayInput] ?? 0;   // texto “Lunes”… → 1-7
    };
    const getMinutes = (time: string): number => {
        // ISO → “…THH:MM…”  |  HH:MM
        const m = time.match(/T(\d{2}):(\d{2})/) ?? time.match(/(\d{2}):(\d{2})/);
        if (!m) return 0;
        const [, hh, mm] = m;
        return Number(hh) * 60 + Number(mm);
    };

    const dataSpaces: SpaceItem[] = useMemo(() => {
        try {
            return rawSpaces.map((item) => SpaceSchema.parse(item));
        } catch {
            return [];
        }
    }, [rawSpaces]);

    // When a space is chosen, fill in the info
    const [selectedSpaceInfo, setSelectedSpaceInfo] = useState<SpaceItem | null>(null);
    useEffect(() => {
        if (spaceName) {
            const found = dataSpaces.find((s) => s.name === spaceName);
            setSelectedSpaceInfo(found ?? null);
            if (found) {
                setImageSrc(found.urlImage); // or some default
            }
        } else {
            setSelectedSpaceInfo(null);
            setImageSrc(null);
        }
    }, [spaceName, spaces]);

    // ------------------------------------------
    // "Editar Horarios Espacio" state
    // ------------------------------------------
    const [schedules, setSchedules] = useState<
        { id: number; day: string; start_hour: string; end_hour: string; is_used: boolean; price: number }[]
    >([]);

    // New schedule inputs
    const [newDay, setNewDay] = useState<string>("");
    const [newStart, setNewStart] = useState<string>("");
    const [newEnd, setNewEnd] = useState<string>("");
    const [newPrice, setNewPrice] = useState<number | "">("");
    const [newBlockDuration, setNewBlockDuration] = useState<number | "">(1);

    const selectedSpace = useMemo(() => {
        return dataSpaces.find((s) => s.name === spaceName);
    }, [dataSpaces, spaceName]);


    const spaceId = selectedSpace?.id;

    const { error: errorTimeSlot, data: dataTimeSlot } = useQuery({
        queryKey: ['get-time-slot-id', spaceId],
        queryFn: () => getTimeSlotDaySpaceIdALL(spaceId!.toString()),
        enabled: !!spaceId
    });


    useEffect(() => {
        if (dataTimeSlot) {
            const aux = dataTimeSlot.map(slot => ({
                id: slot.id,
                day: slot.day,
                start_hour: slot.startHour,
                end_hour: slot.endHour,
                is_used: slot.isUsed,
                price: slot.pricePerBlock,
            }));
            setSchedules(aux);
        }
    }, [dataTimeSlot]);

    // Pagination
    const itemsPerPage = 5;
    const [currentPage, setCurrentPage] = useState(1);

    // Sort schedules by weekday order and start time
    const sortedSchedules = [...schedules].sort((a, b) => {
        const dayDiff = getDayOrder(a.day) - getDayOrder(b.day);
        if (dayDiff !== 0) return dayDiff;            // primero L-D
        return getMinutes(a.start_hour) - getMinutes(b.start_hour); // luego hora
    });

    const pageCount = Math.ceil(sortedSchedules.length / itemsPerPage);
    const pagedSchedules = sortedSchedules.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    function extractTime(timeStr: string): [number, number] {
        // si viene ISO, cortamos “YYYY-MM-DDTHH:MM…”
        const hhmm = timeStr.includes('T') ? timeStr.slice(11, 16) : timeStr;
        const [h, m] = hhmm.split(':').map(Number);
        return [h, m];
    }
    const overlaps = (day: string, start: string, end: string): boolean => {
        const [h1, m1] = start.split(':').map(Number);
        const [h2, m2] = end.split(':').map(Number);
        const newStartMin = h1 * 60 + m1;
        const newEndMin = h2 * 60 + m2;

        return schedules.some((s) => {
            // comparamos el nombre del día
            if (getWeekdayName(s.day) !== day) return false;

            const [sh1, sm1] = extractTime(s.start_hour);
            const [sh2, sm2] = extractTime(s.end_hour);
            const existStart = sh1 * 60 + sm1;
            const existEnd = sh2 * 60 + sm2;

            return newStartMin < existEnd && newEndMin > existStart;
        });
    };

    const { data: dataReservations } = useQuery({
        queryKey: ['get-special-reservation-id', spaceId],
        queryFn: () => getSpecialReservationsBySpaceId(spaceId!.toString()),
        enabled: !!spaceId
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmittingR, setIsSubmittingR] = useState(false);

    const addSchedule = async () => {
        if (!newDay || !newStart || !newEnd || newPrice === "" || !newBlockDuration || newBlockDuration < 1) {
            toast.error("Por favor, complete todos los campos. La duración del bloque debe ser de al menos 1 hora.");
            return;
        }
        if (newStart >= newEnd) {
            toast.error("La hora de inicio debe ser anterior a la hora de fin.");
            return;
        }
        if (overlaps(newDay, newStart, newEnd)) {
            toast.error("Este horario se solapa con uno existente para el mismo día.");
            return;
        }
        const nextId = Math.max(0, ...schedules.map((s) => s.id)) + 1;
       
        setNewDay("");
        setNewStart("");
        setNewEnd("");
        setNewPrice("");

        try {
            setIsSubmitting(true)
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/spaceDayTimeSlotForMember/crearHorariosDisnponibles`, {
                method: "POST",

                credentials: "include",

                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    day: getISODateFromDayAndTime(newDay, newStart),
                    startHour: getISODateFromDayAndTime(newDay, newStart),
                    endHour: getISODateFromDayAndTime(newDay, newEnd),
                    spaceUsed: spaceId,
                    isUsed: false,
                    pricePerBlock: Number(newPrice),
                    duracion_bloque: newBlockDuration
                })
            });
            if (!res.ok) {
                throw new Error("error")
            }

            toast.success("Horario agregado correctamente.", {
                description: `${newDay} · ${newStart}–${newEnd}`,
            });
        }
        catch (err) {
            console.error("Error al crear el espacio", err);
        }
        finally {
            queryClient.invalidateQueries({ queryKey: ['get-time-slot-id'] });
            setIsSubmitting(false)
        }


    };


    const mutation = useMutation({
        mutationFn: deleteSpaceDayTimeSlotForMember,

        onSuccess: () => {
            //console.log("SE BOROOOOOOO")
            queryClient.invalidateQueries({ queryKey: ['get-time-slot-id'] });
            toast("Horario eliminado correctamente.", {
            });
        },
        onError: (error: any) => {
            console.error("Error en la mutación:", error.message || error);
            alert("Error al eliminar reserva: " + (error.message || "Error desconocido"));
        },
    });

    const mutationReservation = useMutation({
        mutationFn: deleteReservationById,

        onSuccess: () => {
            //console.log("SE BOROOOOOOO")
            queryClient.invalidateQueries({ queryKey: ['get-special-reservation-id'] });
            toast("Reserva eliminada correctamente.", {
            });
        },
        onError: (error: any) => {
            console.error("Error en la mutación:", error.message || error);
            alert("Error al eliminar reserva: " + (error.message || "Error desconocido"));
        },
    });


    const deleteSchedule = async (id: number) => {
        setSchedules((prev) => prev.filter((s) => s.id !== id));
        const newLength = schedules.length - 1;
        const newPageCount = Math.ceil(newLength / itemsPerPage);
        if (currentPage > newPageCount) {
            setCurrentPage(newPageCount);
        }

        mutation.mutate({ id });

        //console.log("Eliminando horario con ID:", id);

    };

    // ------------------------------------------
    // “Reserva de Espacio” state
    // ------------------------------------------
    const [reservationReason, setReservationReason] = useState<string>(""); // Motivo
    const [reservationDay, setReservationDay] = useState<Date | undefined>(undefined); // Fecha
    const [reservationStart, setReservationStart] = useState<string>(""); // Hora inicio
    const [reservationEnd, setReservationEnd] = useState<string>(""); // Hora fin
    const [reservationDescription, setReservationDescription] = useState<string>(""); // Descripción

    const [reservations, setReservations] = useState<Reservation[]>([]);


    //AQUIIIII



    useEffect(() => {
        if (!dataReservations) return;

        const parsed = dataReservations.map((res: any) => ({
            id: res.id,
            date: parseDateWithoutTimezone(res.date), // ✅ sin zona horaria
            start: addHours(res.startHour, 5).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
            end: addHours(res.endHour, 5).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
            type: "Miembro",
            reason: res.name || "Sin nombre",
        }));

        setReservations(parsed);
    }, [dataReservations]);

    // Filter and sort reservations by selected date
    const reservationsForSelectedDay = reservationDay
        ? reservations
            .filter((r) => r.date.toDateString() === reservationDay.toDateString())
            .sort((a, b) => a.start.localeCompare(b.start))
        : [];

    const reservationOverlaps = (
        date: Date,
        start: string,
        end: string
    ): boolean => {
        const [h1, m1] = start.split(":").map(Number);
        const [h2, m2] = end.split(":").map(Number);
        const newStartMin = h1 * 60 + m1;
        const newEndMin = h2 * 60 + m2;

        return reservationsForSelectedDay.some((r) => {
            const [rh1, rm1] = r.start.split(":").map(Number);
            const [rh2, rm2] = r.end.split(":").map(Number);
            const existStart = rh1 * 60 + rm1;
            const existEnd = rh2 * 60 + rm2;
            return newStartMin < existEnd && newEndMin > existStart;
        });
    };

    const addReservation = async () => {
        if (
            !reservationReason ||
            !reservationDay ||
            !reservationStart ||
            !reservationEnd ||
            !reservationDescription
        ) {
            toast.error("Por favor, completa todos los campos de la reserva.");
            return;
        }
        if (reservationStart >= reservationEnd) {
            toast.error("La hora de inicio debe ser anterior a la hora de fin.");
            return;
        }
        // if (reservationOverlaps(reservationDay, reservationStart, reservationEnd)) {
        //     toast.error("Conflicto con una reserva existente en ese día.");
        //     return;
        // }

        setReservationReason("");
        // setReservationDay(und    efined);
        setReservationStart("");
        setReservationEnd("");
        setReservationDescription("");
        // //console.log(reservationDay, reservationDescription, reservationStart, reservationEnd);

        try {
            setIsSubmittingR(true)
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/reservation/createSports`, {
                method: "POST",

                credentials: "include",

                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    date: reservationDay,
                    name: reservationReason,
                    startHour: combineDateAndTime(reservationDay, reservationStart),
                    endHour: combineDateAndTime(reservationDay, reservationEnd),
                    capacity: 1,
                    allowOutsiders: true,
                    spaceId: spaceId,
                    description: reservationDescription,
                }),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => null); // <- muy importante
                throw new Error(errorData?.message || "Error desconocidow");
            }

            await queryClient.invalidateQueries({ queryKey: ['get-special-reservation-id'] });

            toast.success("Reserva creada con éxito");

        } catch (error) {
            console.error("Error al agregar la reserva:", error);
            toast.error(
                <>
                    <strong>Error al agregar la reserva.</strong>
                    <div>{error?.message || "Error desconocido"}</div>
                </>
            );
        }
        finally {
            setIsSubmittingR(false)
        }
    };







    // FUNCION PARA BORRAR RESERVAS 
    const deleteReservation = (id: number) => {
        mutationReservation.mutate({ id });
        setReservations((prev) => prev.filter((r) => r.id !== id));
    };

    if (isLoading) {
        return <div>Cargando...</div>;
    }
    return (
        <div className="flex flex-col gap-8 w-full">
            {/* -----------------------------------
          Sección: Selección de Espacio
      ----------------------------------- */}
            <Card className="w-full bg-white rounded-2xl overflow-hidden card-custom border-0 dark:text-[var(--primary)]">
                <CardHeader className="pb-0">
                    <CardTitle className="text-2xl font-bold text-[#222222] dark:text-[var(--primary)]">
                        Selección de Espacio
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 md:gap-x-20 gap-y-5 w-full justify-center items-center">
                        {/* Tipo de Espacio */}
                        <div className="flex flex-col gap-y-5 w-full">
                            <div>
                                <Label className="font-semibold text-base">Tipo de espacio</Label>
                                <Select
                                    value={spaceType}
                                    disabled
                                    onValueChange={(val) => {
                                        setSpaceType(val as "SPORTS" | "LEISURE");
                                        setSpaceName("");
                                    }}
                                >
                                    <SelectTrigger className="h-10 w-full bg-white rounded-lg border border-[#cccccc] px-2">
                                        <SelectValue placeholder="Seleccionar tipo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {data.map((space) => (
                                            <SelectItem key={space.id} value={space.name}>
                                                {space.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Nombre del Espacio (depende del tipo) */}
                            <div>
                                <Label className="font-semibold text-base">Espacio</Label>
                                <Select
                                    value={spaceName}
                                    onValueChange={(val) => setSpaceName(val)}
                                    disabled={!spaceType}
                                >
                                    <SelectTrigger className="h-10 w-full bg-white rounded-lg border border-[#cccccc] px-2">
                                        <SelectValue placeholder="Seleccionar espacio" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {dataSpaces
                                            .filter((sp) => sp.type === spaceType)
                                            .map((sp) => (
                                                <SelectItem key={sp.id} value={sp.name}>
                                                    {sp.name}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Vista previa de imagen (opcional) */}
                        <div className="flex justify-center w-full">
                            <div className="w-80">
                                <AspectRatio
                                    ratio={16 / 9}
                                    className="bg-muted rounded-lg overflow-hidden"
                                >
                                    <img
                                        src={imageSrc ?? `${import.meta.env.VITE_BACKEND_URL_MEDIA}/preview.jpg`}
                                        alt="Vista previa del espacio"
                                        className="h-full w-full object-cover"
                                    />
                                </AspectRatio>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* --------------------------------------------------------------
          Una vez que se seleccione un Espacio, mostrar las secciones:
             - Información de Espacio Elegido
             - Editar Horarios Espacio
             - Reserva de Espacio
      ---------------------------------------------------------------- */}
            {spaceName && selectedSpaceInfo && (
                <>
                    {/* --------------------------------------------------------
              Información de Espacio Elegido
          -------------------------------------------------------- */}
                    <Card className="w-full bg-[var(--brand)] rounded-2xl overflow-hidden text-white card-custom border-0">
                        <CardHeader className="pb-0">
                            <CardTitle className="text-2xl font-bold text-white">
                                Información de Espacio Elegido
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-5">
                                <div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 md:gap-x-20 gap-y-3 md:gap-y-5 w-full">
                                        {/* Referencia */}
                                        <div className="flex flex-col gap-y-1">
                                            <Label className="font-semibold text-base">Referencia</Label>
                                            <Input
                                                value={selectedSpaceInfo.reference}
                                                disabled
                                                className="h-10 bg-[#efefef] rounded-lg p-2 text-[12.8px]  text-black leading-[15px] border border-[#cccccc] resize-none overflow-auto dark:text-[var(--primary)] dark:bg-[var(--color-gray-700)]"
                                            />
                                        </div>
                                        {/* Capacidad */}
                                        <div className="flex flex-col gap-y-1">
                                            <Label className="font-semibold text-base">Capacidad</Label>
                                            <Input
                                                value={selectedSpaceInfo.capacity}
                                                disabled
                                                className="h-10 bg-[#efefef] rounded-lg p-2 text-[12.8px]  text-black leading-[15px] border border-[#cccccc] resize-none overflow-auto dark:text-[var(--primary)] dark:bg-[var(--color-gray-700)]"
                                            />
                                        </div>
                                        {/* ¿Reservable? */}
                                        <div className="flex items-center gap-2 mt-2">
                                            <Label className="font-semibold text-base">¿Reservable?</Label>
                                            <Switch
                                                checked={selectedSpaceInfo.canBeReserved}
                                                disabled
                                                className="h-6 w-14 dark:data-[state=checked]:bg-[#318161] [&>span]:h-5 [&>span]:w-5 [&>span]:data-[state=checked]:translate-x-8"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex flex-col gap-y-1">
                                        <Label className="font-semibold text-base">Descripción</Label>
                                        <Textarea
                                            value={selectedSpaceInfo.description}
                                            disabled
                                            maxLength={200}
                                            className="h-28 bg-[#efefef] rounded-lg p-2 text-[12.8px]  text-black leading-[15px] border border-[#cccccc] resize-none overflow-auto dark:text-[var(--primary)] dark:bg-[var(--color-gray-700)]"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* --------------------------------------------------------
              Editar Horarios Espacio
          -------------------------------------------------------- */}
                    <Card className="w-full bg-white rounded-2xl overflow-hidden card-custom border-0 dark:text-[var(--primary)]">
                        <CardHeader className="pb-0">
                            <CardTitle className="text-2xl font-bold text-[#222222] dark:text-[var(--primary)]">
                                Editar Horarios del Espacio
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-4 items-start">
                            {/* Formulario para agregar un nuevo horario */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4 w-full">
                                {/* Día de la semana */}
                                <div>
                                    <Label className="font-semibold text-base">Día de la semana</Label>
                                    <Select
                                        value={newDay}
                                        onValueChange={(val) => setNewDay(val)}
                                    >
                                        <SelectTrigger className="h-10 w-full bg-white rounded-lg border border-[#cccccc] px-2">
                                            <SelectValue placeholder="Día de la semana" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {[
                                                "Lunes",
                                                "Martes",
                                                "Miércoles",
                                                "Jueves",
                                                "Viernes",
                                                "Sábado",
                                                "Domingo",
                                            ].map((d) => (
                                                <SelectItem key={d} value={d}>
                                                    {d}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="font-semibold text-base">Duración de Bloque (horas)</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={newBlockDuration}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setNewBlockDuration(val === "" ? "" : Number(val));
                                        }}
                                        placeholder="1"
                                        className="h-10 w-full bg-white rounded-lg border border-[#cccccc] px-2"
                                    />
                                </div>

                                {/* Hora Inicio */}
                                <div>
                                    <Label className="font-semibold text-base">Hora Inicio</Label>
                                    <Input
                                        type="time"
                                        value={newStart}
                                        onChange={(e) => setNewStart(e.target.value)}
                                        className="h-10 w-full bg-white rounded-lg border border-[#cccccc] px-2"
                                    />
                                </div>

                                {/* Hora Fin */}
                                <div>
                                    <Label className="font-semibold text-base">Hora Fin</Label>
                                    <Input
                                        type="time"
                                        value={newEnd}
                                        onChange={(e) => setNewEnd(e.target.value)}
                                        className="h-10 w-full bg-white rounded-lg border border-[#cccccc] px-2"
                                    />
                                </div>

                                {/* Precio */}
                                <div>
                                    <Label className="font-semibold text-base ">Precio</Label>
                                    <NumericFormat
                                        value={newPrice}
                                        onValueChange={(vals) => {
                                            const num = Number(vals.value);
                                            setNewPrice(isNaN(num) ? "" : num);
                                        }}
                                        decimalSeparator="."
                                        decimalScale={2}
                                        fixedDecimalScale
                                        prefix="S/ "
                                        placeholder="S/ 0.00"
                                        allowNegative={false}
                                        className="h-10 w-full bg-white border-1 rounded-lg border-[#cccccc] px-2 dark:bg-[var(--color-gray-800)]"
                                    />
                                </div>
                                <div></div>
                                {/* Botón Agregar Horario */}
                                <div className="flex items-end">
                                    <Button
                                        onClick={addSchedule}
                                        disabled={isSubmitting}
                                        className="bg-[var(--brand)] text-white font-bold rounded-lg border-0 button3-custom"
                                    >
                                        {isSubmitting ? 'Creando Horario...' : 'Agregar Horario'}
                                    </Button>
                                </div>
                            </div>

                            {/* Tabla de horarios */}
                            <div>
                                <Label className="font-semibold text-base">Horarios</Label>
                                <div className="overflow-x-auto rounded-lg">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="font-semibold">Día</TableHead>
                                                <TableHead className="font-semibold">Inicio</TableHead>
                                                <TableHead className="font-semibold">Fin</TableHead>
                                                <TableHead className="font-semibold">Precio (S/)</TableHead>
                                                <TableHead className="font-semibold text-center">
                                                    Acciones
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {pagedSchedules.map((sched) => (
                                                <TableRow key={sched.id}>
                                                    <TableCell>{getWeekdayName(sched.day)}</TableCell>
                                                    <TableCell>{sched.start_hour.slice(11, 16)}</TableCell>
                                                    <TableCell>{sched.end_hour.slice(11, 16)}</TableCell>
                                                    <TableCell>
                                                        {"S/ " + sched.price.toFixed(2)}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Button
                                                            size="sm"
                                                            type="button"
                                                            className="text-white bg-red-500 hover:bg-red-600 font-bold border-0 rounded-lg shadow-[0_0_5px_0px_rgba(0,0,0,0)] shadow-gray-400"
                                                            onClick={() => deleteSchedule(sched.id)}
                                                        >
                                                            Eliminar
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Paginación */}
                                {pageCount > 1 && (
                                    <Pagination className="flex justify-center mt-3">
                                        <PaginationContent>
                                            <PaginationItem>
                                                <PaginationPrevious
                                                    onClick={() =>
                                                        setCurrentPage((p) => Math.max(p - 1, 1))
                                                    }
                                                    aria-disabled={currentPage === 1}
                                                    tabIndex={currentPage === 1 ? -1 : undefined}
                                                    className={
                                                        currentPage === 1
                                                            ? "pointer-events-none opacity-50"
                                                            : undefined
                                                    }
                                                >
                                                    Anterior
                                                </PaginationPrevious>
                                            </PaginationItem>

                                            {Array.from({ length: pageCount }).map((_, i) => {
                                                const page = i + 1;
                                                return (
                                                    <PaginationItem key={i}>
                                                        <PaginationLink
                                                            onClick={() => setCurrentPage(page)}
                                                            isActive={currentPage === page}
                                                            className={
                                                                currentPage === page
                                                                    ? "bg-white text-black dark:text-white"
                                                                    : ""
                                                            }
                                                        >
                                                            {page}
                                                        </PaginationLink>
                                                    </PaginationItem>
                                                );
                                            })}

                                            <PaginationItem>
                                                <PaginationNext
                                                    onClick={() =>
                                                        setCurrentPage((p) => Math.min(p + 1, pageCount))
                                                    }
                                                    aria-disabled={currentPage === pageCount}
                                                    tabIndex={currentPage === pageCount ? -1 : undefined}
                                                    className={
                                                        currentPage === pageCount
                                                            ? "pointer-events-none opacity-50"
                                                            : undefined
                                                    }
                                                >
                                                    Siguiente
                                                </PaginationNext>
                                            </PaginationItem>
                                        </PaginationContent>
                                    </Pagination>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* --------------------------------------------------------
              Reserva de Espacio
          -------------------------------------------------------- */}
                    <Card className="w-full bg-white rounded-2xl overflow-hidden card-custom border-0 dark:text-[var(--primary)]">
                        <CardHeader className="pb-0">
                            <CardTitle className="text-2xl font-bold text-[#222222] dark:text-[var(--primary)]">
                                Reservar Espacio
                            </CardTitle>
                        </CardHeader>

                        <CardContent className="flex flex-col gap-y-8">
                            {/* Formulario de Reserva */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 w-full">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 w-full">
                                    {/* Motivo */}
                                    <div className="flex flex-col gap-1 w-full">
                                        <Label className="font-semibold text-base">Motivo</Label>
                                        <Input
                                            type="text"
                                            value={reservationReason}
                                            onChange={(e) => setReservationReason(e.target.value)}
                                            placeholder="Ej. Mantenimiento"
                                            className="h-10 w-full bg-white rounded-lg border border-[#cccccc] px-2"
                                        />
                                    </div>

                                    {/* Fecha */}
                                    <div className="flex flex-col gap-1 w-full">
                                        <Label className="font-semibold text-base">Fecha</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    id="reservationDay"
                                                    className={cn(
                                                        `h-10 w-full bg-white rounded-lg border-[#cccccc] dark:border-[#cccccc] pr-10 text-left font-normal ${!reservationDay
                                                            ? "text-muted-foreground"
                                                            : "text-black dark:text-white"
                                                        }`
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {reservationDay
                                                        ? format(reservationDay, "dd-MM-yyyy", { locale: es })
                                                        : <span>dd-mm-yyyy</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={reservationDay}
                                                    onSelect={setReservationDay}
                                                    locale={es}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                    {/* Hora Inicio */}
                                    <div className="flex flex-col gap-1 w-full">
                                        <Label className="font-semibold text-base">Hora Inicio</Label>
                                        <Input
                                            type="time"
                                            value={reservationStart}
                                            onChange={(e) => setReservationStart(e.target.value)}
                                            className="h-10 w-full bg-white rounded-lg border border-[#cccccc] px-2"
                                        />
                                    </div>

                                    {/* Hora Fin */}
                                    <div className="flex flex-col gap-1 w-full">
                                        <Label className="font-semibold text-base">Hora Fin</Label>
                                        <Input
                                            type="time"
                                            value={reservationEnd}
                                            onChange={(e) => setReservationEnd(e.target.value)}
                                            className="h-10 w-full bg-white rounded-lg border border-[#cccccc] px-2"
                                        />
                                    </div>

                                    {/* Descripción */}
                                    <div className="flex flex-col col-span-2 gap-1 w-full">
                                        <Label className="font-semibold text-base">
                                            Descripción
                                        </Label>
                                        <Textarea
                                            value={reservationDescription}
                                            onChange={(e) => setReservationDescription(e.target.value)}
                                            placeholder="Detalles adicionales de la reserva..."
                                            className="h-24 w-full bg-white  border-[#cccccc] rounded-lg p-2"
                                        />
                                    </div>

                                    {/* Botón Agregar Reserva */}
                                    <div className="flex items-end">
                                        <Button
                                            disabled={isSubmittingR}
                                            onClick={addReservation}
                                            className="bg-[var(--brand)] text-white font-bold rounded-lg border-0 button3-custom"
                                        >
                                            {isSubmittingR ? 'Creando Reserva...' : 'Agregar Reserva'}
                                        </Button>
                                    </div>
                                </div>
                                {/* Tabla de Conflictos / Reservas del Día */}
                                <div>
                                    <Label className="font-semibold text-base">
                                        Reservas del Día Seleccionado
                                    </Label>
                                    <div className="overflow-x-auto rounded-lg">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="font-semibold">Tipo</TableHead>
                                                    <TableHead className="font-semibold">Inicio</TableHead>
                                                    <TableHead className="font-semibold">Fin</TableHead>
                                                    <TableHead className="font-semibold">
                                                        Motivo / Descripción
                                                    </TableHead>
                                                    <TableHead className="font-semibold text-center">
                                                        Acciones
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {reservationsForSelectedDay.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell
                                                            colSpan={5}
                                                            className="text-center text-muted-foreground"
                                                        >
                                                            No hay reservas para esta fecha.
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    reservationsForSelectedDay.map((r) => (
                                                        <TableRow key={r.id}>
                                                            <TableCell>{r.type}</TableCell>
                                                            <TableCell>{r.start}</TableCell>
                                                            <TableCell>{r.end}</TableCell>
                                                            <TableCell>{r.reason}</TableCell>
                                                            <TableCell className="text-center">
                                                                {r.type === "Miembro" ? (
                                                                    <Button
                                                                        size="sm"
                                                                        type="button"
                                                                        onClick={() => deleteReservation(r.id)}
                                                                        className="text-white bg-red-500 hover:bg-red-600 font-bold border-0 rounded-lg shadow-[0_0_5px_0px_rgba(0,0,0,0)] shadow-gray-400"
                                                                    >
                                                                        Eliminar
                                                                    </Button>
                                                                ) : (
                                                                    <span className="text-muted-foreground">-</span>
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            </div>


                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}

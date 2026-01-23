import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, List } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Calendar } from "@/components/ui/calendar"
import React, { useRef, useState } from "react";
import { NumericFormat } from "react-number-format";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import MensajeDeAviso from "./CreateEventModal";
import { useNavigate } from 'react-router-dom';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { es } from "date-fns/locale";
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { z } from "zod"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
} from "@/components/ui/form"
import { useEffect } from "react";
// import { apiEvent } from "@/lib/api/apiEvent";
import { getSpace } from "@/lib/api/apiSpace";
import { useQuery } from "@tanstack/react-query";
// import { apiSpaceDayTimeSlotForMember } from "@/lib/api/apiSpaceDayTimeSlotForMember";
import { getTimeSlotDaySpaceId } from "@/lib/api/apiSpaceDayTimeSlotForMember";
import { getTimeSlotById } from "@/lib/api/apiSpaceDayTimeSlotForMember";
import { getNoTimeSlotDaySpaceId } from "@/lib/api/apiSpaceDayTimeSlotForMember";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
export type Evento = {
    name: string,
    date: string,
    startHour: string,
    endHour: string,
    spaceUsed: string,
    ticketPriceMember: number,
    ticketPriceGuest: number,
    capacity: number,
    urlImage: string,
    isActive: true,
    description: string,
    allowOutsiders: boolean,
    numberOfAssistants: number,
}

export type Reservation = {
    name: string;
    date: string;
    startHour: string;
    endHour: string;
    capacity: number;
    allowOutsiders: boolean;
    description: string;
    spaceId: number;
};


export type Space = {
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

export type SpaceDayTimeSlotForMember = {
    day: string,
    startHour: string,
    endHour: string,
    spaceUsed: number,
}


function getStartEndTime(date: Date, timeRange: string): { startHour: string, endHour: string } {
    const [startStr, endStr] = timeRange.split(" - ");
    const [startHour, startMinute] = startStr.split(":").map(Number);
    const [endHour, endMinute] = endStr.split(":").map(Number);

    const start = new Date(date);
    start.setUTCHours(startHour, startMinute, 0, 0);

    const end = new Date(date);
    end.setUTCHours(endHour, endMinute, 0, 0);

    return {
        startHour: start.toISOString(),
        endHour: end.toISOString(),
    };
}

function toMinutes(hhmm: string): number {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
}

function parseRanges(ranges: string[]): [number, number][] {
    return ranges.map((r) => {
        const [iniStr, finStr] = r.split(" - ").map((s) => s.trim());
        return [toMinutes(iniStr), toMinutes(finStr)] as [number, number];
    });
}
function expandIfOverlapsToString(startHour: string, endHour: string, availableSlots: { time: string }[]): string {
    const [startH, startM] = startHour.split(":").map(Number);
    const [endH, endM] = endHour.split(":").map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    let minStart = startMinutes;
    let maxEnd = endMinutes;
    let overlaps = false;

    for (const slot of availableSlots) {
        const [slotStart, slotEnd] = slot.time.split(" - ");
        const [slotStartH, slotStartM] = slotStart.split(":").map(Number);
        const [slotEndH, slotEndM] = slotEnd.split(":").map(Number);
        const slotStartMinutes = slotStartH * 60 + slotStartM;
        const slotEndMinutes = slotEndH * 60 + slotEndM;

        const intersecta = !(endMinutes <= slotStartMinutes || startMinutes >= slotEndMinutes);

        if (intersecta) {
            overlaps = true;
            minStart = Math.min(minStart, slotStartMinutes);
            maxEnd = Math.max(maxEnd, slotEndMinutes);
        }
    }

    const toHHMM = (mins: number) => {
        const h = String(Math.floor(mins / 60)).padStart(2, "0");
        const m = String(mins % 60).padStart(2, "0");
        return `${h}:${m}`;
    };

    return `${toHHMM(minStart)} - ${toHHMM(maxEnd)}`;
}

/**
 * Dado un array de intervalos [ini, fin], los ordena y fusiona
 * si hay solapamiento o contigüidad:
 * Ejemplo: [[900, 960], [960, 1080], [1200, 1260]] 
 *   → devuelve [[900, 1080], [1200, 1260]]
 */
function mergeIntervals(intervals: [number, number][]): [number, number][] {
    if (intervals.length === 0) return [];

    // 1) Ordena por hora de inicio
    const sorted = [...intervals].sort((a, b) => a[0] - b[0]);

    const result: [number, number][] = [];
    let [currIni, currFin] = sorted[0];

    for (let i = 1; i < sorted.length; i++) {
        const [nextIni, nextFin] = sorted[i];

        // Si el siguiente arranca antes o justo cuando termina el actual, los unimos
        if (nextIni <= currFin) {
            currFin = Math.max(currFin, nextFin);
        } else {
            // Hay hueco → cerramos el actual y comenzamos uno nuevo
            result.push([currIni, currFin]);
            currIni = nextIni;
            currFin = nextFin;
        }
    }
    result.push([currIni, currFin]);
    return result;
}

function getCoveredSlots(
    selectedStart: string, // ej. "10:30"
    selectedEnd: string,   // ej. "12:01"
    slots: { time: string }[] // ej. [{ time: "10:00 - 11:00" }, ...]
): { time: string }[] {
    const [selStartH, selStartM] = selectedStart.split(":").map(Number);
    const [selEndH, selEndM] = selectedEnd.split(":").map(Number);
    const selStartMin = selStartH * 60 + selStartM;
    const selEndMin = selEndH * 60 + selEndM;

    return slots.filter(slot => {
        const [startStr, endStr] = slot.time.split(" - ");
        const [slotStartH, slotStartM] = startStr.split(":").map(Number);
        const [slotEndH, slotEndM] = endStr.split(":").map(Number);
        const slotStartMin = slotStartH * 60 + slotStartM;
        const slotEndMin = slotEndH * 60 + slotEndM;

        // Verifica solapamiento:
        return !(slotEndMin <= selStartMin || slotStartMin >= selEndMin);
    });
}

const eventSchema = z.object({
    name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
    date: z.date({ required_error: "La fecha es obligatoria." }),
    capacity: z.coerce
        .number({ required_error: "La capacidad es obligatoria." })
        .min(1, { message: "Debe ser al menos 1." }),
    spaceUsed: z.string({ required_error: "El espacio es obligatorio." }),
    startHour: z.string().regex(/^([01]\d|2[0-3]):?([0-5]\d)$/, { message: "Hora de inicio inválida." }),
    endHour: z.string().regex(/^([01]\d|2[0-3]):?([0-5]\d)$/, { message: "Hora de fin inválida." }),
    ticketPriceMember: z.string().nonempty({ message: "Precio socio obligatorio." }),
    ticketPriceGuest: z.string().nonempty({ message: "Precio externo obligatorio." }),
    allowOutsiders: z.boolean(),
    description: z.string().nonempty({ message: "La descripción es obligatoria." })
})
    .superRefine((data, ctx) => {
        // Compare times as strings "HH:mm" works lexically for 24h
        if (data.endHour <= data.startHour) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["endHour"],
                message: "La hora de fin debe ser posterior a la hora de inicio.",
            })
        }
    })
type EventFormValues = z.infer<typeof eventSchema>

function getAllErrorMessages(errors: Record<string, any>): string[] {
    return Object.values(errors).flatMap((err: any) => {
        if (err.types) {
            // En modo 'all', `types` agrupa mensajes
            return Object.values(err.types) as string[]
        }
        if (err.message) {
            return [err.message]
        }
        // para estructuras anidadas (e.g. arrays, objetos)
        return getAllErrorMessages(err)
    })
}

function ErrorSummary({ messages }: { messages: string[] }) {
    if (messages.length === 0) return null
    return (
        <div className="border border-red-500 bg-red-100 p-4 rounded-md mt-2">
            <p className="font-semibold text-red-700 mb-2">Por favor corrige los siguientes errores:</p>
            <ul className="list-disc list-inside text-red-600 space-y-1">
                {messages.map((msg, idx) => <li key={idx}>{msg}</li>)}
            </ul>
        </div>
    )
}


export default function EventFormSection() {
    //form
    const form = useForm<EventFormValues>({
        resolver: zodResolver(eventSchema),
        criteriaMode: 'all',            // para capturar *todos* los errores de cada campo
        mode: 'onSubmit',
        defaultValues: {
            name: "",
            date: undefined,
            capacity: undefined,
            spaceUsed: undefined,
            startHour: "",
            endHour: "",
            ticketPriceMember: "",
            ticketPriceGuest: "",
            allowOutsiders: false,
            description: "",
        },
    })
    const { isPending, error, data } = useQuery({
        queryKey: ['get-space'],
        queryFn: getSpace,
    });

    const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);
    const fechaISO = form.watch("date");
    const spaceAux = form.watch("spaceUsed");
    const idSpaceAux = data?.find(space => space.name === spaceAux);
    const [availableSlots, setAvailableSlots] = useState<{ time: string; }[]>([]);
    const [NoavailableSlots, setNoAvailableSlots] = useState<{ time: string; }[]>([]);


    // Rangos “hardcodeados” solo a modo de guía
    const { isLoading, data: timeSlotsM } = useQuery({
        queryKey: ['get-time-space', idSpaceAux?.id, fechaISO?.toString()],
        queryFn: () => getTimeSlotDaySpaceId(idSpaceAux!.id.toString(), fechaISO!.toISOString()),
        enabled: !!idSpaceAux?.id && !!fechaISO,
    });


    const { isLoading: cargando, data: NotimeSlotsM } = useQuery({
        queryKey: ['get-no-time-space', idSpaceAux?.id, fechaISO?.toString()],
        queryFn: () => getNoTimeSlotDaySpaceId(idSpaceAux!.id.toString(), fechaISO!.toISOString()),
        enabled: !!idSpaceAux?.id && !!fechaISO,
    });


    useEffect(() => {
        //console.log("Horarios Disponibles: ", timeSlotsM)
    }, [form.watch("date")]);

    useEffect(() => {
        //console.log("Horarios No Disponibles: ", NotimeSlotsM)
    }, [form.watch("date")]);

    const { error: errorTimeSlot, data: dataTimeSlot } = useQuery({
        queryKey: ['get-time-slot', idSpaceAux?.id],
        queryFn: () => getTimeSlotById(idSpaceAux!.id.toString()),
        enabled: !!idSpaceAux?.id,
    });

    const [allTimeSlot, setAllTimeSlot] = useState<SpaceDayTimeSlotForMember[]>([])

    useEffect(() => {
        if (dataTimeSlot && dataTimeSlot.length > 0) {
            setAllTimeSlot(dataTimeSlot);
        } else {
            setAllTimeSlot([]);
        }
    }, [dataTimeSlot]);


    useEffect(() => {
        if (NotimeSlotsM && Array.isArray(NotimeSlotsM)) {
            const Notransformed = NotimeSlotsM
                .map((time: string) => ({ time }))
                .sort((a, b) => a.time.localeCompare(b.time));
            setNoAvailableSlots(Notransformed);
        }
    }, [NotimeSlotsM]);


    useEffect(() => {
        if (timeSlotsM && Array.isArray(timeSlotsM)) {
            const transformed = timeSlotsM
                .map((time: string) => ({ time }))
                .sort((a, b) => a.time.localeCompare(b.time));
            setAvailableSlots(transformed);

        }
    }, [timeSlotsM]);


    const buildSlotIsoRange = (time: string, dateStr: string) => {
        const [start, end] = time.split(" - ");
        const startIso = `${dateStr}T${start}:00.000Z`;
        const endIso = `${dateStr}T${end}:00.000Z`;
        return { startIso, endIso };
    };


    const isSlotReserved = (timeSlotTime: string, reservedSlots: SpaceDayTimeSlotForMember[], dateStr: string) => {
        const { startIso, endIso } = buildSlotIsoRange(timeSlotTime, dateStr);
        return reservedSlots.some(res => {
            return !(endIso <= res.startHour || res.endHour <= startIso);
        });
    };



    const availableTimeSlots = availableSlots
        .filter(slot =>
            !isSlotReserved(slot.time, allTimeSlot, fechaISO.toISOString().split('T')[0])
        )
        .sort((a, b) => a.time.localeCompare(b.time));


    useEffect(() => {
        //console.log("Horarios NO DISPO 2: ", NoavailableSlots)
    }, [NoavailableSlots]);


    const NoavailableTimeSlots = NoavailableSlots
        .sort((a, b) => a.time.localeCompare(b.time));

    useEffect(() => {
        //console.log("Horarios NO DISPO: ", NoavailableSlots)
    }, [NoavailableSlots]);

    // Form field data
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);


    const [showModal, setShowModal] = useState(false);

    const navigate = useNavigate();

    const openModal = () => {
        setShowModal(true);
    };


    const closeSuccess = () => {
        setShowModal(false);
        navigate("/employee-event/eventos");
    };
    useEffect(() => {
        if (data && data.length > 0) {
            setSelectedSpace(data[0]);
        }
    }, [data]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const previewURL = URL.createObjectURL(file);
        setImageSrc(previewURL);

        const formData = new FormData();
        formData.append("file", file);

        try {
            setIsSubmitting(true)
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/files/upload`, {
                method: "POST",
                body: formData,
                credentials: 'include',
            });

            if (!response.ok) throw new Error("Error al subir el archivo");

            const result = await response.json();
            //console.log("Archivo subido correctamente:", result);
            setUploadedUrl(result.fileName);
            //console.log("Archivo subido correctamente, numeritos:", result.fileName);

        } catch (error) {
            console.error("Fallo en la subida:", error);
        }
        finally{
            setIsSubmitting(false)
        }
    };



    const [formData, setFormData] = useState<Evento>({
        name: "",
        date: "",
        startHour: "",
        endHour: "",
        spaceUsed: "",
        ticketPriceMember: 0,
        ticketPriceGuest: 0,
        capacity: 0,
        urlImage: "",
        isActive: true,
        description: "",
        allowOutsiders: true,
        numberOfAssistants: 0,
    });


    useEffect(() => {
        formData.allowOutsiders = watch("allowOutsiders")
        formData.name = watch("name")
        //console.log("Data actual:", formData);
        //console.log("Espacio", selectedSpace);
        //console.log("Fecha", date?.toISOString().split("T")[0]);
        //console.log("Fecha", isoDate);
    }, [formData]);

    // Form field data
    const [date, setDate] = React.useState<Date>()
    const [openConfirm, setOpenConfirm] = useState(false);
    const [pendingValues, setPendingValues] = useState<EventFormValues | null>(null);
    const [ticketPriceMember, setticketPriceMember] = useState("");
    const [ticketPriceGuest, setticketPriceGuest] = useState("");

    const triggerFileSelect = () => {
        fileInputRef.current?.click();
    };

    //data
    //const spaces = [{ id: 1, name: "ESTADIO N°1 - ZONA VERDE" }, { id: 2, name: "ESTADIO N°2 - ZONA VERDE" }, { id: 3, name: "ESTADIO N°3 - ZONA VERDE" }];


    const isoDate = React.useMemo(() => {
        return date ? date.toISOString().split("T")[0] + "T00:00:00.000Z" : undefined;
    }, [date]);



    const [isSubmitting, setIsSubmitting] = useState(false);




    const proceedWithSubmit = async (values: EventFormValues, selectedSpace: Space) => {
        setIsSubmitting(true);
        try {
            // Conversión de horas a minutos
            const [startH, startM] = values.startHour.split(":").map(Number);
            const [endH, endM] = values.endHour.split(":").map(Number);
            const startMinutes = startH * 60 + startM;
            const endMinutes = endH * 60 + endM;

            // Fusionar intervalos disponibles
            const rawIntervals = parseRanges(
                NoavailableSlots.map((slot) => slot.time)
            );

            //console.log("Intervalos disponibles (minutos):", rawIntervals);
            // const merged = mergeIntervals(rawIntervals);

            // Verificar si rango choca con algún intervalo
            const dentroDeAlgunoMerged = rawIntervals.some(
                ([iniMin, finMin]) =>
                    !(endMinutes <= iniMin || startMinutes >= finMin)
            );

            //console.log("MINUTOS DE INICIO, FINAL: ", startMinutes, endMinutes)
            //console.log("Intervalos que chocan ?:", dentroDeAlgunoMerged);

            if (dentroDeAlgunoMerged) {
                setError("startHour", {
                    type: "manual",
                    message: "El horario entra en conflicto con las horas reservadas.",
                });
                setIsSubmitting(false);
                return;
            }

            // Verificar capacidad contra la máxima del espacio (esta vez no bloqueamos aquí,
            // porque ya se confirmó antes en el AlertDialog)
            if (values.capacity > selectedSpace.capacity) {
                // No hacemos setError aquí; asumimos que el usuario ya confirmó
            }

            // Construir fechas en formato ISO
            const isoDate = values.date.toISOString().split("T")[0] + "T00:00:00.000Z";
            const getStartEndTime = (date: Date, timeRange: string) => {
                const [startStr, endStr] = timeRange.split(" - ");
                const [startHour, startMinute] = startStr.split(":").map(Number);
                const [endHour, endMinute] = endStr.split(":").map(Number);
                const start = new Date(date);
                start.setUTCHours(startHour, startMinute, 0, 0);
                const end = new Date(date);
                end.setUTCHours(endHour, endMinute, 0, 0);
                return {
                    startHour: start.toISOString(),
                    endHour: end.toISOString(),
                };
            };


            const { startHour: isoStart, endHour: isoEnd } = getStartEndTime(
                values.date,
                `${values.startHour} - ${values.endHour}`
            );



            // Calcular slots cubiertos por el evento
            const usados = expandIfOverlapsToString(
                values.startHour,
                values.endHour,
                availableSlots
            );

            //console.log("Slots cubiertos por el evento:", availableSlots);

            //console.log("Eso es importante", isoDate, isoStart, isoEnd, usados);

            // Registrar en la tabla “reservation”
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/event/new`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    reservation: {
                        name: values.name,
                        date: isoDate,
                        startHour: isoStart,
                        endHour: isoEnd,
                        capacity: values.capacity,
                        allowOutsiders: values.allowOutsiders,
                        description: values.description,
                        spaceId: selectedSpace.id,
                    },
                    event: {
                        name: values.name,
                        date: isoDate.split("T")[0], // YYYY-MM-DD
                        startHour: isoStart,
                        endHour: isoEnd,
                        spaceUsed: values.spaceUsed,
                        ticketPriceMember: (values.ticketPriceMember),
                        ticketPriceGuest: (values.ticketPriceGuest),
                        capacity: values.capacity,
                        urlImage: uploadedUrl,
                        isActive: true,
                        description: values.description,
                        allowOutsiders: parseFloat(values.ticketPriceGuest) !== 0,
                        numberOfAssistants: 0,
                    },
                }),
            });


            // 2. Separas las horas de inicio y fin
            const [startHHMM, endHHMM] = usados.split(" - ");

            // 3. La fecha base en formato YYYY-MM-DD (sin tiempo)
            const isoDateM = isoDate.split("T")[0];

            // 4. Construyes las fechas ISO completas
            const startISOM = `${isoDateM}T${startHHMM}:00.000Z`;
            const endISOM = `${isoDateM}T${endHHMM}:00.000Z`;


            // Registrar slots ocupados
            const dateOnly = isoDate.split("T")[0];

            // //console.log(payload)
            // await fetch(
            //     `${import.meta.env.VITE_BACKEND_URL}/api/spaceDayTimeSlotForMember`,
            //     {
            //         method: "POST",
            //         headers: { "Content-Type": "application/json" },
            //         body: JSON.stringify({
            //             day: isoDate.split("T")[0],
            //             startHour: isoStart, // startISOM,
            //             endHour: isoEnd, // endISOM,
            //             spaceUsed: selectedSpace.id,
            //         }),
            //     }
            // );
            if (!res.ok) {
                const errorData = await res.json().catch(() => null); // <- muy importante
                throw new Error(errorData?.message || "Error desconocidow");
            }
            toast.success(
                <>
                    <strong>Evento creado correctamente.</strong>
                </>
            );

            // Si todo sale bien, abrir modal de éxito
            setShowModal(true);
            setOpenConfirm(false);
            setPendingValues(null);
        } catch (err) {
            console.error(err);
            toast.error(
                <>
                    <strong>Error al crear evento.</strong>
                    <div>{err?.message || "Error desconocido"}</div>
                </>
            );
        }
        finally {
            setIsSubmitting(false);
        }
    };
    const onSubmit = async (values: EventFormValues) => {
        setIsSubmitting(true);
        const selectedSpace = data?.find((space) => space.name === values.spaceUsed);
        if (!selectedSpace || !values.date) {
            toast.error("Selecciona un espacio y una fecha válidos.");
            setIsSubmitting(false);
            return;
        }

        // Verificar si la capacidad excede la del espacio
        if (values.capacity > selectedSpace.capacity) {
            // Guardamos los datos y mostramos el AlertDialog
            setPendingValues(values);
            setIsSubmitting(false);
            setOpenConfirm(true);
            return;
        }

        // Si no excede, seguimos con el envío normal
        await proceedWithSubmit(values, selectedSpace);
    };

    const { control, watch, formState, setValue, setError } = form
    const allErrors = getAllErrorMessages(formState.errors)
    const allowOutsiders = watch("allowOutsiders")
    const nombre = form.watch("name");
    formData.allowOutsiders = allowOutsiders
    const { formState: { errors } } = form;

    const dateValue = watch("date");         // es undefined ó Date
    const spaceValue = watch("spaceUsed");   // es undefined ó string


    return (
        // flex flex-col items-center gap-2.5 flex-1
        <div className=" flex flex-col lg:flex-row gap-8 w-full">
            {/* Image upload section */}
            <CardContent className="flex flex-col items-center justify-center gap-2.5 p-2.5 md:w-1/2">
                {/* Preview */}
                <AspectRatio ratio={16 / 9} className="w-full bg-muted rounded-lg overflow-hidden">
                    <img
                        src={imageSrc ?? `${import.meta.env.VITE_BACKEND_URL_MEDIA}/preview.jpg`}
                        alt="Event image"
                        className="h-full w-full object-cover"
                    />
                </AspectRatio>

                {/* Botón que abre el file picker */}
                <Button
                    variant="outline"
                    className="w-[242px] h-[43px]  text-white font-bold border-0 rounded-lg   button4-custom"
                    onClick={triggerFileSelect}
                >
                    Adjuntar Imagen
                </Button>

                {/* Input oculto */}
                <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                />
            </CardContent>
            {/* Form fields section */}
            <CardContent className="flex flex-wrap gap-5 p-2.5 md:w-1/2">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 md:gap-x-20 gap-y-3 md:gap-y-6">
                            {/* Nombre */}
                            <FormField
                                control={form.control}
                                name="name"

                                render={({ field, fieldState }) => {
                                    const hasError = Boolean(fieldState.error);
                                    return (
                                        <FormItem className="-space-y-1 w-[200px]">
                                            <FormLabel
                                                htmlFor="name"
                                                // Solo la etiqueta se tiñe de rojo cuando hay error
                                                className={`font-normal text-base ${hasError ? "text-red-500" : ""}`}
                                            >
                                                Nombre
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    id="name"
                                                    placeholder="Nombre"
                                                    // borde normal incluso si hay error
                                                    className="h-10 bg-white rounded-lg border-[#cccccc]"
                                                    {...field}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    );
                                }}
                            />

                            {/* Fecha */}
                            <FormField
                                control={form.control}
                                name="date"
                                render={({ field }) => (
                                    <FormItem className="-space-y-1 w-[200px]">
                                        <FormLabel htmlFor="date" className="font-normal text-base">
                                            Fecha
                                        </FormLabel>
                                        <FormControl>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        id="date"
                                                        variant="outline"
                                                        className={cn(
                                                            `h-10 w-full bg-white rounded-lg border-[#cccccc] pr-10 text-left font-normal ${errors.date ? 'border-red-500 dark:border-red-500' : 'border-[#cccccc] dark:border-[#cccccc]'}`,
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                        onBlur={field.onBlur}
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4 " />
                                                        {field.value ? format(field.value, "dd-MM-yyyy", { locale: es }) : <span>dd-mm-yyyy</span>}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value}
                                                        onSelect={field.onChange}
                                                        locale={es}
                                                        disabled={(date) => date < new Date()}
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            {/* Capacidad */}
                            <FormField
                                control={form.control}
                                name="capacity"
                                render={({ field }) => (
                                    <FormItem className="-space-y-1 w-[200px]">
                                        <FormLabel htmlFor="capacity" className="font-normal text-base">
                                            Capacidad
                                        </FormLabel>
                                        <FormControl>
                                            <Input id="capacity" type="number" placeholder="Capacidad" {...field} className="h-10 bg-white rounded-lg border-[#cccccc]" />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            {/* Espacio */}
                            <FormField
                                control={form.control}
                                name="spaceUsed"
                                render={({ field }) => (
                                    <FormItem className="-space-y-1 w-[200px]">
                                        <FormLabel htmlFor="spaceUsed" className="font-normal text-base">
                                            Espacio
                                        </FormLabel>
                                        <FormControl>
                                            <Select value={field.value} onValueChange={field.onChange}>
                                                <SelectTrigger className={`h-10 bg-white rounded-lg border-[#cccccc] w-[200px] ${errors.spaceUsed ? 'border-red-500' : 'border-[#cccccc]'}`}>
                                                    <SelectValue placeholder="Seleccionar espacio" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {data?.map((space) => (
                                                        <SelectItem key={space.id} value={space.name}>
                                                            {space.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            {/* Hora Inicio */}
                            <FormField
                                control={form.control}
                                name="startHour"
                                render={({ field }) => {
                                    const [openPopover, setOpenPopover] = useState(false);



                                    return (
                                        <FormItem className="-space-y-1">
                                            <FormLabel htmlFor="startHour" className="font-normal text-base">
                                                Hora Inicio
                                            </FormLabel>

                                            <div className="flex items-center gap-2">
                                                {/* Input de tipo time */}
                                                <FormControl>
                                                    <Input
                                                        id="startHour"
                                                        type="time"
                                                        step={60}
                                                        min="00:00"
                                                        max="23:59"
                                                        {...field}
                                                        disabled={!dateValue || !spaceValue}
                                                        className="h-10 w-[110px] bg-white rounded-lg border-[#cccccc]"
                                                    />
                                                </FormControl>

                                                {/* Popover: tanto el ícono como el botón textual son triggers */}
                                                <Popover open={openPopover} onOpenChange={setOpenPopover}>
                                                    {/* Al usar asChild, podemos envolver varios elementos dentro de un container */}
                                                    <PopoverTrigger asChild>
                                                        <button
                                                            type="button"
                                                            disabled={!dateValue || !spaceValue}
                                                            className="p-2  bg-[var(--brand)]  font-bold rounded-lg border-0 button3-custom"
                                                            title="Ver horarios disponibles"
                                                        >
                                                            <List className="h-5 w-5 text-white" />
                                                        </button>
                                                    </PopoverTrigger>

                                                    <PopoverContent className="w-[180px] p-3">
                                                        {/* Título dentro del Popover */}
                                                        <p className="font-semibold text-sm mb-2">Horas NO disponibles</p>
                                                        <div className="flex flex-col space-y-1">
                                                            {NoavailableTimeSlots.length > 0 ? (
                                                                NoavailableTimeSlots.map((range) => (
                                                                    <span
                                                                        key={range.time}
                                                                        className="px-2 py-1 rounded text-sm "
                                                                    >
                                                                        {range.time}
                                                                    </span>
                                                                ))
                                                            ) : (
                                                                <span className="text-sm text-gray-500 italic">No reservaciones</span>
                                                            )}
                                                        </div>
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                        </FormItem>
                                    );
                                }}
                            />

                            {/* Hora Fin */}
                            <FormField
                                control={form.control}
                                name="endHour"
                                render={({ field }) => (
                                    <FormItem className="-space-y-1">
                                        <FormLabel htmlFor="endHour" className="font-normal text-base">
                                            Hora Fin
                                        </FormLabel>
                                        <FormControl>
                                            <Input id="endHour" type="time" step={60} min="00:00" max="23:59" {...field} disabled={!dateValue || !spaceValue} className="h-10 w-[110px] bg-white rounded-lg border-[#cccccc]" />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            {/* Precio Socio */}
                            <FormField
                                control={control}
                                name="ticketPriceMember"
                                render={({ field }) => (
                                    <FormItem className="-space-y-1">
                                        <FormLabel htmlFor="ticketPriceMember" className="font-normal text-base">
                                            Precio Socio
                                        </FormLabel>
                                        <FormControl>
                                            <NumericFormat
                                                id="ticketPriceMember"
                                                value={field.value}
                                                onValueChange={({ value }) => field.onChange(value)}
                                                decimalSeparator="."
                                                decimalScale={2}
                                                fixedDecimalScale
                                                prefix="S/ "
                                                placeholder="S/ 0.00"
                                                className={`h-10 w-[130px] bg-white border-1 rounded-lg border-[#cccccc] px-2 dark:bg-[var(--color-gray-800)] ${errors.ticketPriceMember ? 'border-red-500' : 'border-[#cccccc]'}`}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            {/* Precio Externo + Checkbox */}
                            <div className="flex items-start gap-4">
                                <FormField
                                    control={control}
                                    name="ticketPriceGuest"
                                    render={({ field }) => (
                                        <FormItem className="-space-y-1">
                                            <FormLabel htmlFor="ticketPriceGuest" className="font-normal text-base">
                                                Precio Externo
                                            </FormLabel>
                                            <FormControl>
                                                <NumericFormat
                                                    id="ticketPriceGuest"
                                                    value={field.value}
                                                    onValueChange={({ value }) => field.onChange(value)}
                                                    decimalSeparator="."
                                                    decimalScale={2}
                                                    fixedDecimalScale
                                                    prefix="S/ "
                                                    placeholder="S/ 0.00"
                                                    disabled={allowOutsiders}
                                                    className={cn(
                                                        `h-10 w-[130px] bg-white border-1 rounded-lg border-[#cccccc] px-2 dark:bg-[var(--color-gray-800)] ${errors.ticketPriceGuest ? 'border-red-500' : 'border-[#cccccc]'}`,
                                                        allowOutsiders && "opacity-50 cursor-not-allowed"
                                                    )}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={control}
                                    name="allowOutsiders"
                                    render={({ field }) => (
                                        <div className="flex items-center gap-2 mt-8">
                                            <Checkbox
                                                id="allowOutsiders"
                                                checked={field.value}
                                                onCheckedChange={(checked) => {
                                                    field.onChange(checked)               // Actualiza allowOutsiders
                                                    if (checked) {
                                                        // Si solo socios, forzar precio externo a cero
                                                        setValue("ticketPriceGuest", "0.00", { shouldValidate: true })
                                                    }
                                                }}
                                                className="h-[18px] w-[18px]"
                                            />
                                            <FormLabel htmlFor="allowOutsiders" className="font-normal text-base">
                                                Solo socios
                                            </FormLabel>
                                        </div>
                                    )}
                                />
                            </div>
                        </div>


                        <div className="flex flex-col gap-y-3 md:gap-y-6">
                            {/* Descripción */}
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem className="-space-y-1 w-full mt-6">
                                        <FormLabel htmlFor="description" className="font-normal text-base">
                                            Descripción
                                        </FormLabel>
                                        <FormControl>
                                            <Textarea id="description" {...field} maxLength={200} className="h-25 bg-white rounded-lg border-[#cccccc] break-all" />
                                        </FormControl>
                                        <p className="text-sm text-muted-foreground text-right">
                                            {field.value.length}/200
                                        </p>
                                    </FormItem>
                                )}
                            />
                            <ErrorSummary messages={allErrors} />
                            {/* Botón Acción */}
                            <div className="flex flex-col sm:flex-row gap-4 mt-2 justify-center w-full">
                                <Button disabled={isSubmitting} type="submit" className="h-[43px] bg-[var(--brand)] text-white font-bold rounded-lg border-0 button3-custom" >
                                    {isSubmitting ? "Creando evento..." : "Crear Nuevo Evento"}
                                </Button>
                            </div>
                        </div>
                    </form>
                </Form>
            </CardContent>
            <AlertDialog open={openConfirm} onOpenChange={setOpenConfirm}>
                <AlertDialogContent className="background-custom">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Capacidad Excedida</AlertDialogTitle>
                        <AlertDialogDescription>
                            La capacidad que ingresaste ({pendingValues?.capacity}) excede la capacidad máxima
                            del espacio seleccionado ({data?.find(s => s.name === pendingValues?.spaceUsed)?.capacity}).
                            ¿Deseas continuar de todas formas?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="text-white hover:text-white rounded-lg border-0 font-bold  button4-custom">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-[var(--brand)] text-white font-bold rounded-lg border-0 button3-custom"
                            onClick={() => {
                                // Aquí se confirma: procedemos con el envío usando pendingValues
                                if (pendingValues) {
                                    const selectedSpace2 = data?.find(s => s.name === pendingValues.spaceUsed)!;
                                    proceedWithSubmit(pendingValues, selectedSpace2);
                                }
                            }}
                        >
                            Confirmar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={closeSuccess}>
                    <MensajeDeAviso onClose={closeSuccess} />
                </div>
            )}
        </div>
    );
}
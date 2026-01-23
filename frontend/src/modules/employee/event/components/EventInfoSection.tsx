import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { z } from "zod"
import React, { useRef, useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { NumericFormat } from "react-number-format";
import { format, parseISO, addHours } from "date-fns"
import Participantssection from "./Participantssection";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon, List } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils"
import { es, id, is } from "date-fns/locale";
import { getSpace } from "@/lib/api/apiSpace";
import { getTimeSlotById } from "@/lib/api/apiSpaceDayTimeSlotForMember";
import { getNoTimeSlotDaySpaceId } from "@/lib/api/apiSpaceDayTimeSlotForMember";
import { getTimeSlotDaySpaceId } from "@/lib/api/apiSpaceDayTimeSlotForMember";
import { Checkbox } from "@/components/ui/checkbox";
import MensajeDeAviso from "./EditSpaceModal";
import { useParams, useNavigate } from 'react-router-dom';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormControl,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
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
import { useQueryClient } from "@tanstack/react-query";
import { get } from "http";
import { getEventById } from "@/lib/api/apiEvent";
//--------------------------data--------------------------
// Schema definition
export const schema = z.object({
    name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
    date: z.date({ required_error: "La fecha es obligatoria." }),
    spaceUsed: z.string({ required_error: "El espacio es obligatorio." }),
    capacity: z.coerce
        .number({ required_error: "La capacidad es obligatoria." })
        .min(1, { message: "Debe ser al menos 1." }),
    allowOutsiders: z.boolean(),
    startHour: z.string().regex(/^([01]\d|2[0-3]):?([0-5]\d)$/, { message: "Hora de inicio inválida." }),
    endHour: z.string().regex(/^([01]\d|2[0-3]):?([0-5]\d)$/, { message: "Hora de fin inválida." }),
    ticketPriceMember: z.string().nonempty({ message: "Precio socio obligatorio." }),
    ticketPriceGuest: z.string().nonempty({ message: "Precio externo obligatorio." }),
    description: z.string().nonempty({ message: "La descripción es obligatoria." }),
    urlImage: z.string()
}).superRefine((data, ctx) => {
    // Compare times as strings "HH:mm" works lexically for 24h
    if (data.endHour <= data.startHour) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["endHour"],
            message: "La hora de fin debe ser posterior a la hora de inicio.",
        })
    }
})


type EventItem = z.infer<typeof schema>

export type Evento2 = {
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

export const schema2 = z.object({
    id: z.number(),
    name: z.string(),
    date: z.string(),
    spaceUsed: z.string(),
    capacity: z.number(),
    allowOutsiders: z.boolean(),
    startHour: z.string(),
    endHour: z.string(),
    ticketPriceMember: z.number(),
    ticketPriceGuest: z.number(),
    description: z.string(),
    urlImage: z.string()
})
type Evento = z.infer<typeof schema2>



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



//--------------------------data--------------------------


interface Props {
    evento: Evento
    onRequestDeleteParticipant: (
        id: number,
        name: string,
        eve: string,
        correo: string
    ) => void;
    onSave?: (values: EventItem) => Promise<void>;

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



export default function EventInfoSection({ evento, onRequestDeleteParticipant, onSave }: Props) {
    const queryClient = useQueryClient();
    const { id } = useParams<{ id: string }>();

    const form = useForm<EventItem>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: evento.name ? evento.name : "",
            date: evento.date ? new Date(evento.date) : undefined,
            capacity: evento.capacity ? evento.capacity : undefined,
            spaceUsed: evento.spaceUsed ? evento.spaceUsed : undefined,
            startHour: evento.startHour ? evento.startHour : "",
            endHour: evento.endHour ? evento.endHour : "",
            ticketPriceMember: evento.ticketPriceMember ? evento.ticketPriceMember.toString() : "",
            ticketPriceGuest: evento.ticketPriceGuest ? evento.ticketPriceGuest.toString() : "",
            allowOutsiders: evento.allowOutsiders ? evento.allowOutsiders : false,
            description: evento.description ? evento.description : "",
        },
    });

    const { isPending: cargandoSpace, error, data } = useQuery({
        queryKey: ['get-space'],
        queryFn: getSpace,
    });

    const [isEditing, setIsEditing] = useState(false);
    const [imageSrc, setImageSrc] = useState<string | null>(evento.urlImage);


    const initialImageName = evento.urlImage
        ? evento.urlImage.split("/").pop() || null
        : null;


    const [uploadedUrl, setUploadedUrl] = useState<string | null>(initialImageName || null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { handleSubmit, watch, reset, control, setValue, getValues, setError, formState } = form
    const allErrors = getAllErrorMessages(formState.errors)
    const { formState: { errors } } = form;
    const [allTimeSlot, setAllTimeSlot] = useState<SpaceDayTimeSlotForMember[]>([])
    const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);
    const fechaISO = form.watch("date");
    const spaceAux = form.watch("spaceUsed");
    const idSpaceAux = data?.find(space => space.name === spaceAux);
    const [availableSlots, setAvailableSlots] = useState<{ time: string; }[]>([]);
    const [NoavailableSlots, setNoAvailableSlots] = useState<{ time: string; }[]>([]);
    const [date, setDate] = React.useState<Date>()
    const dateValue = watch("date");         // es undefined ó Date
    const spaceValue = watch("spaceUsed");
    const allowOutsiders = watch("allowOutsiders")
    const [prevValues, setPrevValues] = useState<EventItem | null>(null);
    const horaDesdeIso = (iso: string) => iso.slice(11, 16);
    const [pendingValues, setPendingValues] = useState<EventItem | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [openConfirm, setOpenConfirm] = useState(false);
    // Hook form

    const openModal = () => {
        setShowModal(true);
    };

    const { data: eventData, isLoading: cargandoEvento } = useQuery({
        queryKey: ['get-Event', id],
        queryFn: () => getEventById(id!),
        enabled: !!id,
    });


    const closeSuccess = () => {
        setShowModal(false);
        // FALTA EDITAR
        queryClient.invalidateQueries({ queryKey: ['get-Event', id] });
        queryClient.invalidateQueries({ queryKey: ['get-Event-id', id] });
        setIsEditing(false);

    };

    const { isLoading: cargandotimeSlotsM, data: timeSlotsM } = useQuery({
        queryKey: ['get-time-space', idSpaceAux?.id, fechaISO?.toString()],
        queryFn: () => getTimeSlotDaySpaceId(idSpaceAux!.id.toString(), fechaISO!.toISOString()),
        enabled: !!idSpaceAux?.id && !!fechaISO,
    });


    const { isLoading: cargandoNotimeSlotsM, data: NotimeSlotsM } = useQuery({
        queryKey: ['get-no-time-space', idSpaceAux?.id, fechaISO?.toString()],
        queryFn: () => getNoTimeSlotDaySpaceId(idSpaceAux!.id.toString(), fechaISO!.toISOString()),
        enabled: !!idSpaceAux?.id && !!fechaISO,
    });

    const { isLoading: cargandodataTimeSlot, error: errorTimeSlot, data: dataTimeSlot } = useQuery({
        queryKey: ['get-time-slot', idSpaceAux?.id],
        queryFn: () => getTimeSlotById(idSpaceAux!.id.toString()),
        enabled: !!idSpaceAux?.id,
    });

    const [formData, setFormData] = useState<Evento2>({
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

    const isoDate = React.useMemo(() => {
        return date ? date.toISOString().split("T")[0] + "T00:00:00.000Z" : undefined;
    }, [date]);

    useEffect(() => {
        //console.log("Horarios Disponibles: ", timeSlotsM)
    }, [form.watch("date")]);

    useEffect(() => {
        //console.log("Horarios No Disponibles: ", NotimeSlotsM)
    }, [form.watch("date")]);





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


    const [isSubmitting, setIsSubmitting] = useState(false);

    const proceedWithSubmit = async (values: EventItem, selectedSpace: Space) => {
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

            // Verificar capacidad contra la máxima del espacio (esta vez no bloqueamos aquí,
            // porque ya se confirmó antes en el AlertDialog)

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
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/event/editEvent/${evento.id}`, {
                method: "PUT",
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


            if (!res.ok) {
                const errorData = await res.json().catch(() => null); // <- muy importante
                throw new Error(errorData?.message || "Error desconocido");
            }
            toast.success(
                <>
                    <strong>Evento editado correctamente.</strong>
                </>
            );

            // Si todo sale bien, abrir modal de éxito
            setShowModal(true);
            setIsSubmitting(false);
            setOpenConfirm(false);
            setPendingValues(null);
            setIsEditing(false);
        } catch (err) {
            console.error(err);
            toast.error(
                <>
                    <strong>Error al editar evento.</strong>
                    <div>{err?.message || "Error desconocido"}</div>
                </>
            );
        }
        finally {
            setIsSubmitting(false);
        }
    };


    const onSubmit = async (values: EventItem) => {
        try {
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
            setIsEditing(false);
        } catch (err) {
            console.error(err);
        }
    };

    const toggleEdit = () => {
        if (!isEditing) {
            // Entro en modo edición: guardo snapshot
            setPrevValues(getValues() as EventItem);
            setIsEditing(true);
        } else {
            // Cancelo edición: restauro snapshot
            if (prevValues) {
                reset(prevValues);
                setImageSrc(prevValues.urlImage);
            }
            setIsEditing(false);
        }
    };

    const triggerFileSelect = () => {
        fileInputRef.current?.click();
    };

    useEffect(() => {
        if (eventData) {
            reset({
                name: eventData.name,
                date: addHours(parseISO(eventData.date), 5),
                startHour: horaDesdeIso(eventData.startHour),
                endHour: horaDesdeIso(eventData.endHour),
                spaceUsed: eventData.spaceUsed,
                capacity: eventData.capacity,
                allowOutsiders: eventData.allowOutsiders,
                ticketPriceMember: eventData.ticketPriceMember.toString(),
                ticketPriceGuest: eventData.ticketPriceGuest.toString(),
                description: eventData.description,
                urlImage: eventData.urlImage,
            });
            setImageSrc(eventData.urlImage);
        }
        //console.log("Evento data:", eventData);
    }, [eventData, reset]);


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
        finally {
            setIsSubmitting(false)
        }
    };

    formData.allowOutsiders = allowOutsiders;

    if (cargandoNotimeSlotsM) return <div>Cargando data...</div>;
    if (cargandodataTimeSlot) return <div>Cargando data...</div>;
    if (cargandotimeSlotsM) return <div>Cargando data...</div>;
    if (cargandoSpace) return <div>Cargando espacios...</div>;

    return (
        <div className="flex flex-col items-start lg:flex-col w-full">
            <div className="flex justify-between items-center w-full px-0 py-">
                <h1 className="font-bold text-[var(--brand)] text-3xl leading-normal dark:text-[var(--primary)]">
                    Información del Evento
                </h1>
                <Button onClick={toggleEdit} className="bg-[var(--brand)] text-white font-bold rounded-lg border-0 button3-custom">
                    {isEditing ? "Cancelar" : "Editar"}
                </Button>
            </div>
            <Form {...form}>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <CardContent className="flex flex-col lg:flex-row gap-8 w-full">
                        <div className="flex flex-col items-center justify-center gap-2.5 p-2.5 md:w-2/5 ">
                            <AspectRatio ratio={16 / 9} className="w-full bg-muted rounded-lg overflow-hidden">
                                <img
                                    src={imageSrc ?? `${import.meta.env.VITE_BACKEND_URL_MEDIA}/preview.jpg`}
                                    alt="Event preview"
                                    className="h-full w-full object-cover"
                                />
                            </AspectRatio>

                            {isEditing && (
                                <>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-[242px] h-[43px] text-white border-0 font-bold rounded-lg button4-custom"
                                        onClick={triggerFileSelect}
                                    >
                                        Adjuntar Imagen
                                    </Button>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                    />
                                </>
                            )}
                        </div>
                        <div className="flex flex-wrap px-5 p-2.5 gap-y-5 md:w-3/5">
                            {/* First row of form fields */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-10 md:gap-x-20 gap-y-3 md:gap-y-5 w-full">

                                <FormField
                                    control={form.control}
                                    name="name"

                                    render={({ field, fieldState }) => {
                                        const hasError = Boolean(fieldState.error);
                                        return (
                                            <FormItem className="-space-y-1 w-full">
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
                                                        disabled={!isEditing}
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
                                <FormField
                                    control={form.control}
                                    name="date"
                                    render={({ field }) => (
                                        <FormItem className="-space-y-1 w-full">
                                            <FormLabel htmlFor="date" className="font-normal text-base">
                                                Fecha
                                            </FormLabel>
                                            <FormControl>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            id="date"
                                                            variant="outline"
                                                            disabled={!isEditing}
                                                            className={cn(
                                                                `h-10 w-full bg-white rounded-lg border-[#cccccc] pr-10 text-left font-normal ${errors.date ? 'border-red-500 dark:border-red-500' : 'border-[#cccccc] dark:border-[#cccccc]'}`,
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                            onBlur={field.onBlur}
                                                        >
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
                                        <FormItem className="-space-y-1 w-full">
                                            <FormLabel htmlFor="capacity" className="font-normal text-base">
                                                Capacidad
                                            </FormLabel>
                                            <FormControl>
                                                <Input id="capacity" type="number" disabled={!isEditing} placeholder="Capacidad" {...field} className="h-10 bg-white rounded-lg border-[#cccccc]" />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-10 md:gap-x-20 gap-y-3 md:gap-y-5 w-full">
                                {/* Espacio */}
                                <FormField
                                    control={form.control}
                                    name="spaceUsed"
                                    render={({ field }) => (
                                        <FormItem className="-space-y-1 w-full">
                                            <FormLabel htmlFor="spaceUsed" className="font-normal text-base">
                                                Espacio
                                            </FormLabel>
                                            <FormControl>
                                                <Select value={field.value} onValueChange={field.onChange} disabled={!isEditing}>
                                                    <SelectTrigger className={`h-10 bg-white rounded-lg border-[#cccccc] w-full ${errors.spaceUsed ? 'border-red-500' : 'border-[#cccccc]'}`}>
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
                                            <FormItem className="-space-y-1 w-full">
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
                                                            disabled={!dateValue || !spaceValue || !isEditing}
                                                            className="h-10 w-[110px] bg-white rounded-lg border-[#cccccc]"
                                                        />
                                                    </FormControl>

                                                    {/* Popover: tanto el ícono como el botón textual son triggers */}
                                                    {isEditing && (
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
                                                    )}
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
                                        <FormItem className="-space-y-1 w-full">
                                            <FormLabel htmlFor="endHour" className="font-normal text-base">
                                                Hora Fin
                                            </FormLabel>
                                            <FormControl>
                                                <Input id="endHour" type="time" step={60} min="00:00" max="23:59" {...field} disabled={!dateValue || !spaceValue || !isEditing} className="h-10 w-[110px] bg-white rounded-lg border-[#cccccc]" />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-10 md:gap-x-20 gap-y-3 md:gap-y-5 w-full">

                                {/* Precio Socio */}
                                <FormField
                                    control={control}
                                    name="ticketPriceMember"
                                    render={({ field }) => (
                                        <FormItem className="-space-y-1 w-full">
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
                                                    disabled={!isEditing}
                                                    fixedDecimalScale
                                                    prefix="S/ "
                                                    placeholder="S/ 0.00"
                                                    className={cn(
                                                        `h-10 w-[130px] bg-white border-1 rounded-lg border-[#cccccc] px-2 dark:bg-[var(--color-gray-800)] ${errors.ticketPriceMember ? 'border-red-500' : 'border-[#cccccc]'}`,
                                                        !isEditing && "opacity-50 cursor-not-allowed"
                                                    )}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                {/* Precio Externo + Checkbox */}
                                <FormField
                                    control={control}
                                    name="ticketPriceGuest"
                                    render={({ field }) => (
                                        <FormItem className="-space-y-1 ">
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
                                                    disabled={!allowOutsiders || !isEditing}
                                                    className={cn(
                                                        `h-10 w-[130px] bg-white border-1 rounded-lg border-[#cccccc] px-2 dark:bg-[var(--color-gray-800)] ${errors.ticketPriceGuest ? 'border-red-500' : 'border-[#cccccc]'}`,
                                                        (!allowOutsiders || !isEditing) && "opacity-50 cursor-not-allowed"
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
                                                checked={!field.value} // invertimos: cuando es false, está marcado
                                                disabled={!isEditing}
                                                onCheckedChange={(checked) => {
                                                    const newValue = !checked; // porque el checked visual está invertido
                                                    field.onChange(newValue);

                                                    if (newValue === false) {
                                                        // Si pasó a "solo socios" (es decir, checked === true, value === false)
                                                        setValue("ticketPriceGuest", "0.00", { shouldValidate: true });
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
                            <div className="flex flex-col  w-full gap-x-11 gap-y-5">

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
                                                <Textarea id="description" {...field} maxLength={200} disabled={!isEditing} className="h-25 bg-white rounded-lg border-[#cccccc] break-all" />
                                            </FormControl>
                                            <p className="text-sm text-muted-foreground text-right">
                                                {field.value.length}/200
                                            </p>
                                        </FormItem>
                                    )}
                                />
                                <ErrorSummary messages={allErrors} />
                                {/* Botón Guardar */}
                                {isEditing && (
                                    <div className="flex flex-col sm:flex-row gap-4 mt-2 justify-center w-full">
                                        <Button type="submit" disabled={isSubmitting} className="h-[43px] bg-[var(--brand)] text-white font-bold rounded-lg border-0 button3-custom">
                                            Guardar Cambios
                                        </Button>
                                    </div>
                                )}
                            </div>


                        </div>
                    </CardContent>

                </form>
            </Form>
            <div className="inline-flex items-center gap-2.5 px-0 py-5 ">
                <h1 className="w-fit mt-[-1.00px]  font-bold text-[var(--brand)] text-3xl tracking-[0] leading-normal dark:text-[var(--primary)]">
                    Lista de participantes
                </h1>
            </div>
            <Card className="flex flex-col lg:flex-row gap-8 w-full card-custom">
                <CardContent className="w-full">
                    <Participantssection evento={evento} onRequestDeleteParticipant={onRequestDeleteParticipant} />
                </CardContent>
            </Card>

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
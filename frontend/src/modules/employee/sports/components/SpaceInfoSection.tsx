import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AspectRatio } from "@/components/ui/aspect-ratio"

import { NumericFormat } from "react-number-format";
import ReservationSpacesSection from "./ReservationSpacesSection";
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button";
import React, { useRef, useState } from "react";
import MensajeDeAviso from "./EditSpaceModal";
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { z } from "zod"
import { useQuery } from "@tanstack/react-query";
import { getTimeSlotDaySpaceIdALL } from "@/lib/api/apiSpaceDayTimeSlotForMember";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import { SpaceDayTimeSlotForMember } from '../../../../modules/member/reservation/pages/NuevaReserva'
import { useEffect } from "react";

import { useNavigate, useParams } from 'react-router-dom';

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
} from "@/components/ui/form"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationPrevious,
    PaginationNext,
} from "@/components/ui/pagination"
import { useQueryClient } from "@tanstack/react-query";
import { getSpaceById } from "@/lib/api/apiSpace";
import { Console } from "console";

export type Space = {
    id: number;
    name: string;
};

const data: Space[] = [
    { id: 1, name: "SPORTS" },
    { id: 2, name: "LEISURE" },
]

//--------------------------data--------------------------
// Schema definition
export const spaceSchema = z.object({
    id: z.number(),
    name: z.string(),
    description: z.string(),
    reference: z.string(),
    capacity: z.number(),
    urlImage: z.string(),
    canBeReserved: z.boolean(),
    isAvailable: z.boolean(),
    type: z.enum(["SPORTS", "LEISURE"]),
})

type spaceItem = z.infer<typeof spaceSchema>

// data de reservas de los espacios
type Schedule = {
    day: WeekDay;
    start: string;  // formato "HH:MM"
    end: string;  // formato "HH:MM"
    price: number
}

// 2) Crea un array con varios rangos para distintos días
// const hardcodedSchedules: Schedule[] = [
//     { day: "monday", start: "12:00", end: "14:00" },
//     { day: "monday", start: "14:00", end: "16:00" },
//     { day: "tuesday", start: "08:00", end: "10:00" },
//     { day: "wednesday", start: "09:30", end: "11:30" },
//     { day: "friday", start: "15:00", end: "17:00" },
//     { day: "friday", start: "17:00", end: "19:00" },
// ];
//--------------------------data--------------------------


interface Props {
    space: spaceItem
    onRequestDeleteReservation: (id: number, name: string, espacio: string, correo: string) => void;
}

const eventSchema = z.object({
    name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
    reference: z.string().nonempty({ message: "La referencia es obligatoria." }),
    capacity: z.coerce
        .number({ required_error: "La capacidad es obligatoria." })
        .min(1, { message: "La capacidad debe ser al menos 1." }),
    description: z.string().nonempty({ message: "La descripción es obligatoria." }),
    isReservable: z.boolean().nullable(),
    urlImage: z.string(),
    spaceType: z.string().nonempty({ message: "Selecciona un tipo de espacio." }),
    schedules: z
        .array(
            z.object({
                day: z.enum([
                    "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"
                ], { required_error: "Día requerido" }),
                start: z.string().nonempty({ message: "Hora inicio requerida" }),
                end: z.string().nonempty({ message: "Hora fin requerida" }),
                price: z.number().nullable().optional(),
            })
        )
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

type WeekDay =
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday"
    | "sunday";



export default function EventInfoSection({ space, onRequestDeleteReservation }: Props) {
    const queryClient = useQueryClient();
    const { id } = useParams<{ id: string }>();

    // Form field data
    // Form field data
    const [imageSrc, setImageSrc] = useState<string | null>(space.urlImage);


    const initialImageName = space.urlImage
        ? space.urlImage.split("/").pop() || null
        : null;

    const [uploadedUrl, setUploadedUrl] = useState<string | null>(initialImageName || null)
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showModal, setShowModal] = useState(false);
    const [prevImageSrc, setPrevImageSrc] = useState<string | null>(null);
    const [prevUploadedUrl, setPrevUploadedUrl] = useState<string | null>(null);

    //console.log(space.urlImage)
    const { data: spaceData, isLoading: cargandoSpace } = useQuery({
        queryKey: ['get-Space'],
        queryFn: () => getSpaceById(id!),
        enabled: !!id,
    });

    // Rangos “hardcodeados” solo a modo de guía
    const { isLoading: cargandoSlots, data: timeSlotsM, refetch } = useQuery({
        queryKey: ['get-time-space', spaceData?.id],
        queryFn: () => getTimeSlotDaySpaceIdALL(spaceData!.id.toString()),
        enabled: !!spaceData?.id,
    });

    const getWeekDay = (date: Date): WeekDay => {
        const days: WeekDay[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        return days[date.getDay()];
    };


    const shiftDate = (dateStr: string, hours: number) => {
        const d = new Date(dateStr);
        d.setHours(d.getHours() + hours);
        return d;
    };

    const hardcodedSchedules = React.useMemo(() => {
        if (!timeSlotsM) return [];

        return timeSlotsM.map(slot => {
            const dayDate = shiftDate(slot.day, 5);
            const startDate = shiftDate(slot.startHour, 5);
            const endDate = shiftDate(slot.endHour, 5);
            const price = slot.pricePerBlock
            return {
                day: getWeekDay(dayDate),
                start: format(startDate, "HH:mm"),
                end: format(endDate, "HH:mm"),
                price: price
            };
        });
    }, [timeSlotsM]);




    const triggerFileSelect = () => {
        fileInputRef.current?.click();
    };
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


    const form = useForm<EventFormValues>({
        resolver: zodResolver(eventSchema),
        criteriaMode: 'all',
        mode: 'onSubmit',
        defaultValues: {
            name: '',
            reference: '',
            capacity: 0,
            description: '',
            isReservable: false,
            urlImage: '',
            spaceType: '',
            schedules: [],
        },
    });

    const { reset, control, formState, getValues } = form;
    const { fields, append, remove } = useFieldArray({
        name: "schedules",
        control,
    });

    useEffect(() => {
        if (spaceData) {
            setImageSrc(spaceData.urlImage);
            reset({
                name: spaceData.name,
                reference: spaceData.reference,
                capacity: spaceData.capacity,
                description: spaceData.description,
                isReservable: spaceData.canBeReserved,
                urlImage: spaceData.urlImage,
                spaceType: spaceData.type,
                schedules: [], // Se actualizará en otro efecto
            });
        }
    }, [spaceData, reset]);

    useEffect(() => {
        if (timeSlotsM) {
            const updatedSchedules = timeSlotsM.map(slot => {
                const dayDate = shiftDate(slot.day, 5);
                const startDate = shiftDate(slot.startHour, 5);
                const endDate = shiftDate(slot.endHour, 5);
                const price = slot.pricePerBlock;

                return {
                    day: getWeekDay(dayDate),
                    start: format(startDate, "HH:mm"),
                    end: format(endDate, "HH:mm"),
                    price: price
                };
            });

            reset({
                ...getValues(), // conserva otros campos ya llenados
                schedules: updatedSchedules,
            });
        }
    }, [timeSlotsM, reset, getValues]);


    useEffect(() => {
        if (spaceData?.id) {
            refetch();
        }
    }, [spaceData?.id, refetch]);


    const allErrors = getAllErrorMessages(formState.errors)
    const { formState: { errors } } = form;
    const [isEditing, setIsEditing] = useState(false)
    const [prevValues, setPrevValues] = useState<EventFormValues | null>(null)

    const openModal = () => {
        setShowModal(true);
    };
    const navigate = useNavigate();

    const closeSuccess = () => {
        setShowModal(false);
        queryClient.invalidateQueries({ queryKey: ['get-Space'] });
        queryClient.invalidateQueries({ queryKey: ['get-space-id', id] });
        setIsEditing(false);
    };

    const [isSubmitting, setIsSubmitting] = useState(false);

    const onSubmit = async (values: EventFormValues) => {
        // Aquí manejar el envío del formulario
        //console.log("Formulario enviado:", values);

        setIsSubmitting(true);
        try {

            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/space/${space.id}`, {
                method: "PUT",

                credentials: "include",

                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: values.name,
                    type: values.spaceType,
                    capacity: values.capacity,
                    urlImage: uploadedUrl,
                    isAvailable: true,
                    description: values.description,
                    reference: values.reference,
                    canBeReserved: values.isReservable,
                })
            });
            if (!res.ok) {
                throw new Error("error")
            }

            openModal();
        }
        catch (err) {
            console.error("Error al crear el espacio", err);
        }
        finally {
            setIsSubmitting(false);
        }
    };


    const daysOfWeek = [
        { value: "monday", label: "Lunes", order: 1 },
        { value: "tuesday", label: "Martes", order: 2 },
        { value: "wednesday", label: "Miércoles", order: 3 },
        { value: "thursday", label: "Jueves", order: 4 },
        { value: "friday", label: "Viernes", order: 5 },
        { value: "saturday", label: "Sábado", order: 6 },
        { value: "sunday", label: "Domingo", order: 7 },
    ];




    //paginación
    const [currentPage, setCurrentPage] = useState(1)
    const pageSize = 5
    const totalItems = fields.length
    const pageCount = Math.ceil(totalItems / pageSize)

    const sortedSchedules = fields
        .map((f, idx) => ({ ...f, idx }))
        .sort((a, b) => {
            const od = daysOfWeek.find(d => d.value === a.day)!.order
            const bd = daysOfWeek.find(d => d.value === b.day)!.order
            if (od !== bd) return od - bd
            return a.start.localeCompare(b.start)
        })

    const pagedSchedules = sortedSchedules.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    )
    React.useEffect(() => {
        // Calcula cuántas páginas hay ahora (como mínimo 1)
        const newPageCount = Math.max(1, Math.ceil(fields.length / pageSize));
        // Si la página actual ya no existe, llévala a la última válida
        if (currentPage > newPageCount) {
            setCurrentPage(newPageCount);
        }
    }, [fields.length, pageSize, currentPage]);


    if (cargandoSpace) return <div>Cargando espacio...</div>;
    if (cargandoSlots) return <div>Cargando horarios...</div>;

    return (
        <div className="flex flex-col items-start lg:flex-col w-full">
            <div className="flex justify-between items-center w-full px-0 py-5">
                <h1 className="font-bold text-[var(--brand)] text-3xl leading-normal dark:text-[var(--primary)]">
                    Información del espacio
                </h1>
                <Button
                    className="bg-[var(--brand)] text-white font-bold rounded-lg border-0 button3-custom"
                    onClick={() => {
                        if (!isEditing) {
                            // antes de entrar en edición, guarda tanto los valores del form…
                            setPrevValues(getValues());
                            // …como la imagen actual y su uploadedUrl
                            setPrevImageSrc(imageSrc);
                            setPrevUploadedUrl(uploadedUrl);
                            setIsEditing(true);
                        } else {
                            // al cancelar, restablece form *y* imagen
                            if (prevValues) reset(prevValues);
                            setImageSrc(prevImageSrc);
                            setUploadedUrl(prevUploadedUrl);
                            setIsEditing(false);
                        }
                    }}
                >
                    {isEditing ? "Cancelar" : "Editar"}
                </Button>
            </div>


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
                                variant="outline"
                                className="w-[242px] h-[43px] text-white font-bold border-0 rounded-lg button4-custom"
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
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} >
                            <div className="flex flex-wrap  w-full gap-x-11 gap-y-5">
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
                                                        disabled={!isEditing}
                                                        // borde normal incluso si hay error
                                                        className="h-10 bg-white rounded-lg border-[#cccccc]"
                                                        {...field}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        );
                                    }}
                                />
                                {/* Referencia */}
                                <FormField
                                    control={form.control}
                                    name="reference"
                                    render={({ field, fieldState }) => {
                                        const hasError = Boolean(fieldState.error);
                                        return (
                                            <FormItem className="-space-y-1 w-[200px]">
                                                <FormLabel
                                                    htmlFor="reference"

                                                    className={`font-normal text-base ${hasError ? "text-red-500" : ""}`}
                                                >
                                                    Referencia
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        id="reference"
                                                        placeholder="Referencia"
                                                        disabled={!isEditing}
                                                        className="h-10 bg-white rounded-lg border-[#cccccc]"
                                                        {...field}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        );
                                    }}
                                />

                                {/* Espacio */}
                                <FormField
                                    control={form.control}
                                    name="spaceType"
                                    render={({ field, fieldState }) => {
                                        const hasError = !!fieldState.error
                                        return (
                                            <FormItem className="-space-y-1 w-[191px]">
                                                <FormLabel
                                                    htmlFor="spaceType"
                                                    className={`font-normal text-base ${hasError ? "text-red-500" : ""}`}
                                                >
                                                    Tipo de espacio
                                                </FormLabel>
                                                <FormControl>
                                                    <Select
                                                        value={field.value}
                                                        onValueChange={field.onChange}
                                                        disabled
                                                    >
                                                        <SelectTrigger
                                                            id="spaceType"
                                                            className={`h-10 bg-white rounded-lg border px-2 w-[192px] ${hasError ? "border-red-500" : "border-[#cccccc]"}`}
                                                        >
                                                            <SelectValue placeholder="Seleccionar tipo de espacio" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {data.map((space) => (
                                                                <SelectItem key={space.id} value={space.name}>
                                                                    {space.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </FormControl>
                                            </FormItem>
                                        )
                                    }}
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
                                                <Input id="capacity" type="number" disabled={!isEditing} placeholder="Capacidad" {...field} className="h-10 bg-white rounded-lg border-[#cccccc]" />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={control}
                                    name="isReservable"            // nuevo campo booleano en tu schema
                                    render={({ field }) => (
                                        <FormItem className="flex items-center gap-2 mb-0">
                                            <FormLabel className="font-normal text-base m-0">
                                                ¿Reservable?
                                            </FormLabel>
                                            <FormControl>
                                                <Switch
                                                    id="isReservable"
                                                    checked={field.value}
                                                    disabled={!isEditing}
                                                    onCheckedChange={field.onChange}
                                                    className="h-6 w-14 data-[state=checked]:bg-[#318161] [&>span]:h-5 [&>span]:w-5 [&>span]:data-[state=checked]:translate-x-8"
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>


                            <div className="flex flex-col gap-y-3 md:gap-y-4">
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
                                                <Textarea id="description" disabled={!isEditing} {...field} maxLength={200} className="h-25 bg-white rounded-lg border-[#cccccc] break-all" />
                                            </FormControl>
                                            <p className="text-sm text-muted-foreground text-right">
                                                {field.value.length}/200
                                            </p>
                                        </FormItem>
                                    )}
                                />
                                <ErrorSummary messages={allErrors} />
                                {/* Botón Acción */}
                                {isEditing && (
                                    <div className="flex flex-col sm:flex-row gap-4 mt-2 justify-center w-full">
                                        <Button disabled={isSubmitting} type="submit" className="h-[43px] bg-[var(--brand)] text-white font-bold rounded-lg border-0 button3-custom" >
                                            Guardar Cambios
                                        </Button>
                                    </div>
                                )}
                                {/* TABLA ORDENADA DE HORARIOS */}
                                {fields.length > 0 && (
                                    <>
                                        <h3 className="text-lg font-semibold ">
                                            Horarios
                                        </h3>
                                        <Table >
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="text-[var(--brand)] font-semibold">Día</TableHead>
                                                    <TableHead className="text-[var(--brand)] font-semibold">Inicio</TableHead>
                                                    <TableHead className="text-[var(--brand)] font-semibold" >Fin</TableHead>
                                                    <TableHead className="text-[var(--brand)] font-semibold">Precio (S/)</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {pagedSchedules.map(({ idx, day, start, end, price }) => (
                                                    <TableRow key={fields[idx].id}>
                                                        <TableCell>{daysOfWeek.find(d => d.value === day)!.label}</TableCell>
                                                        <TableCell>{start}</TableCell>
                                                        <TableCell>{end}</TableCell>
                                                        <TableCell>{price}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>

                                        {/* Paginación */}
                                        {pageCount > 1 && (
                                            <Pagination className="flex justify-center">
                                                <PaginationContent>
                                                    <PaginationItem>
                                                        <PaginationPrevious
                                                            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
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

                                                    {Array.from({ length: pageCount }).map((_, i) => (
                                                        <PaginationItem key={i}>
                                                            <PaginationLink
                                                                onClick={() => setCurrentPage(i + 1)}
                                                                isActive={currentPage === i + 1}
                                                            >
                                                                {i + 1}
                                                            </PaginationLink>
                                                        </PaginationItem>
                                                    ))}

                                                    <PaginationItem>
                                                        <PaginationNext
                                                            onClick={() => setCurrentPage(p => Math.min(p + 1, pageCount))}
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
                                    </>
                                )}

                            </div>
                        </form>
                    </Form>
                </div>
            </CardContent >
            <div className="inline-flex items-center gap-2.5 px-0 py-5 ">
                <h1 className="w-fit mt-[-1.00px]  font-bold text-[var(--brand)] text-3xl tracking-[0] leading-normal dark:text-[var(--primary)]">
                    Lista de Reservas
                </h1>
            </div>
            <Card className="flex flex-col lg:flex-row gap-8 w-full card-custom">
                <CardContent className="w-full">
                    <ReservationSpacesSection space={space} onRequestDeleteReservation={onRequestDeleteReservation} />
                </CardContent>
            </Card>
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={closeSuccess}>
                    <MensajeDeAviso onClose={closeSuccess} />
                </div>
            )}
        </div >
    );
}
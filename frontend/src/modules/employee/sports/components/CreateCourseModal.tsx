import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea2";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormControl,
} from "@/components/ui/form";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationPrevious,
    PaginationLink,
    PaginationNext,
} from "@/components/ui/pagination";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ca, es } from "date-fns/locale";
import { cn } from "@/lib/utils";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import React, { useState, useMemo, useEffect, useRef } from "react";
import { Switch } from "@/components/ui/switch";
import { NumericFormat } from "react-number-format";

import { useQuery } from "@tanstack/react-query";
import { getSpace } from "@/lib/api/apiSpace";
import { toast } from "sonner"
import { parseISO, getDay } from "date-fns";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import AcademyCourses from "@/modules/member/academy/pages/academy-courses/AcademyCourses";
import { url } from "inspector";
import { useQueryClient } from "@tanstack/react-query";
export type courseType = {
    id: number;
    name: string;
};

const data: courseType[] = [
    { id: 1, name: "FIXED" },
    { id: 2, name: "FLEXIBLE" },
]

const reservations = [];

const mapDay = (num: number): WeekDay => {
    switch (num) {
        case 1: return "MONDAY";
        case 2: return "TUESDAY";
        case 3: return "WEDNESDAY";
        case 4: return "THURSDAY";
        case 5: return "FRIDAY";
        case 6: return "SATURDAY";
        case 0:
        default:
            return "SUNDAY";
    }
};

function findConflictingReservation(
    newSch: Schedule,
    spacesData: Array<{ id: number; name: string }>,
    reservations: Array<{
        id: number;
        name: string;
        date: string;
        start_hour: string;
        end_hour: string;
        description: string;
        space_id: number;
    }>,
    courseStart: Date,
    courseEnd: Date
): {
    id: number;
    name: string;
    date: string;
    start_hour: string;
    end_hour: string;
    description: string;
    space_id: number;
    // Opcionalmente, podemos regresar también las horas en formato “HH:mm”:
    horaInicioRes: string;
    horaFinRes: string;
} | null {
    if (!courseStart || !courseEnd) return null;

    // 1) Obtener id de espacio según newSch.spaceUsed
    const espacioObj = spacesData.find((sp) => sp.name === newSch.spaceUsed);
    if (!espacioObj) return null;
    const spaceId = espacioObj.id;

    // 2) Filtrar solo reservas de ese espacio
    const mismasReservas = reservations.filter((r) => r.space_id === spaceId);

    for (const res of mismasReservas) {
        // 3) Parsear fecha “YYYY-MM-DD” → Date
        const fechaReserva = parseISO(res.date);

        // 4) Verificar que esté dentro del rango del curso
        if (fechaReserva < courseStart || fechaReserva > courseEnd) {
            continue;
        }

        // 5) Día de la semana de la reserva
        const weekdayNum = getDay(fechaReserva);
        const weekdayStr = mapDay(weekdayNum);
        if (weekdayStr !== newSch.day) continue;

        // 6) Extraer horas “HH:mm”
        const horaInicioRes = res.start_hour.slice(11);
        const horaFinRes = res.end_hour.slice(11);

        // 7) Si hay overlap: res.start < newSch.end && newSch.start < res.end
        if (horaInicioRes < newSch.endHour && newSch.startHour < horaFinRes) {
            // Devolver la reserva conflictiva junto con horas formateadas
            return {
                ...res,
                horaInicioRes,
                horaFinRes,
            };
        }
    }

    return null;
}

export const courseSchema = z
    .object({
        name: z.string().min(2, { message: "El nombre del curso debe tener al menos 2 caracteres." }),
        nameSchedule: z.string().min(2, { message: "El nombre del horario debe tener al menos 2 caracteres." }),
        startDate: z.date({ required_error: "La fecha de inicio es obligatoria." }),
        endDate: z.date({ required_error: "La fecha de fin es obligatoria." }),
        capacity: z.coerce
            .number({
                // Este mensaje se mostrará si el campo está vacío (porque "" o undefined se convierten a NaN)
                invalid_type_error: "La capacidad es obligatoria.",
            })
            .min(1, { message: "La capacidad debe ser al menos 1." }),
        allowOutsiders: z.boolean(),
        description: z.string().nonempty({ message: "La descripción es obligatoria." }),
        courseType: z.string().nonempty({ message: "Selecciona un tipo de espacio." }),
        registerCount: z.number().optional(), // opcional, para el conteo de inscripciones
        urlImage: z.string().optional(), // opcional, para la URL de la imagen
    })
    .refine((data) => data.endDate > data.startDate, {
        message: "La fecha de fin debe ser posterior a la de inicio.",
        path: ["endDate"],
    });
type CourseFormValues = z.infer<typeof courseSchema>;

// --------------------------------------------------------
// 2) Tipo y lista para días de la semana
// --------------------------------------------------------

type WeekDay = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";
const daysOfWeek: { value: WeekDay; label: string }[] = [
    { value: "MONDAY", label: "Lunes" },
    { value: "TUESDAY", label: "Martes" },
    { value: "WEDNESDAY", label: "Miércoles" },
    { value: "THURSDAY", label: "Jueves" },
    { value: "FRIDAY", label: "Viernes" },
    { value: "SATURDAY", label: "Sábado" },
    { value: "SUNDAY", label: "Domingo" },
];

// --------------------------------------------------------
// 3) Interface para cada horario
// --------------------------------------------------------
export interface Schedule {
    day: WeekDay;
    startHour: string; // "HH:mm"
    endHour: string;   // "HH:mm"
    spaceUsed: string; // por ejemplo: nombre de espacio seleccionado
}

// --------------------------------------------------------
// 4) Interface para cada precio
// --------------------------------------------------------
export interface PriceEntry {
    numberDays: number;
    inscriptionPriceMember: string;
    inscriptionPriceGuest: string; // puede estar vacío si no se permite externos
}
// --------------------------------------------------------

interface CreateCourseModalProps {
    onClose: () => void;
    academyId: number;
    onSave?: (data: CourseFormValues & { schedules: Schedule[]; prices: PriceEntry[] }) => void;
    initialData?: (CourseFormValues & { schedules: Schedule[]; prices: PriceEntry[] });
    readOnly?: boolean;
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

// Suponiendo que la fecha es "2025-07-31T00:00:00.000Z"
const fixUTCDate = (isoString: string) => {
    const date = new Date(isoString);
    return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
};

export default function CreateCourseModal({ onClose, academyId, onSave, initialData, readOnly = false, }: CreateCourseModalProps) {
    const queryClient = useQueryClient();
    //console.log("initialData en modal:", initialData);
    const form = useForm<CourseFormValues>({
        resolver: zodResolver(courseSchema),
        defaultValues: initialData
            ? {
                name: initialData.name.split("-")[0],
                startDate:
                    typeof initialData.startDate === "string"
                        ? new Date(new Date(initialData.startDate).getTime() + 5 * 60 * 60 * 1000)
                        : new Date(initialData.startDate.getTime() + 5 * 60 * 60 * 1000),


                endDate:
                    typeof initialData.endDate === "string"
                        ? new Date(new Date(initialData.endDate).getTime() + 5 * 60 * 60 * 1000)
                        : new Date(initialData.endDate.getTime() + 5 * 60 * 60 * 1000),



                capacity: initialData.capacity,
                allowOutsiders: initialData.allowOutsiders,
                description: initialData.description,
                courseType: initialData.courseType,
                urlImage: initialData.urlImage,
                nameSchedule: initialData.name.split("-")[1]
            }
            : {
                name: "",
                startDate: undefined,
                endDate: undefined,
                capacity: undefined,
                allowOutsiders: true,
                description: "",
                courseType: "FIXED",
                urlImage: undefined,
                nameSchedule: "",
            },
        criteriaMode: "all",
        mode: "onSubmit",
    });

    const {
        control,
        watch,
        formState: { errors },
        handleSubmit,
    } = form;
    const allErrors = getAllErrorMessages(errors)
    const courseTypeValue = watch("courseType");
    const courseStartDate: Date | undefined = watch("startDate");
    const courseEndDate: Date | undefined = watch("endDate");
    // b) Estado para manejar la lista de horarios y paginación
    const [schedules, setSchedules] = useState<Schedule[]>(initialData?.schedules || []);
    const [currentPage, setCurrentPage] = useState(1);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [imageSrc, setImageSrc] = useState<string | null>(initialData?.urlImage || null);










    const initialImageName = initialData?.urlImage
        ? initialData?.urlImage.split("/").pop() || null
        : null;

    const [uploadedUrl, setUploadedUrl] = useState<string | null>(initialImageName || null)

    const pageSize = 3;

    // c) Estado para los campos del “mini-form” de horario
    const [newSch, setNewSch] = useState<Schedule>({
        day: "MONDAY",
        startHour: "",
        endHour: "",
        spaceUsed: "",
    });


    const { isLoading, data: espacios } = useQuery({
        queryKey: ['get-all-space'],
        queryFn: () => getSpace(),
    });

    const spacesData = espacios ?? [];
    const originalTypeRef = useRef<string | undefined>(initialData?.courseType);

    const spaces = spacesData?.map(space => space.name) ?? [];
    // d) Lista de espacios de ejemplo 
    // const spaces = ["Sala Conferencias A", "Auditorio Principal", "Patio Externo"];

    // e) Validar que hora de fin sea posterior a la de inicio
    const isEndBeforeStart = React.useMemo(() => {
        if (!newSch.startHour || !newSch.endHour) return false;
        return newSch.endHour <= newSch.startHour;
    }, [newSch]);
    const triggerFileSelect = () => {
        fileInputRef.current?.click();
    };
    const hasOverlap = React.useMemo(() => {
        if (!newSch.day) return false;
        // Si ya existe un schedule con el mismo día, impedimos agregar uno nuevo
        return schedules.some((sch) => sch.day === newSch.day);
    }, [newSch, schedules]);

    // g) Ordenamos alfabéticamente primero por día, luego por hora de inicio
    const sortedSchedules = useMemo(() => {
        return [...schedules].sort((a, b) => {
            const dayOrder = daysOfWeek.map((d) => d.value);
            const diffDay = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
            if (diffDay !== 0) return diffDay;
            return a.startHour.localeCompare(b.startHour);
        });
    }, [schedules]);

    // h) Rebanamos para paginación
    const pageCount = Math.ceil(sortedSchedules.length / pageSize);
    const pagedSchedules = useMemo(() => {
        const startIdx = (currentPage - 1) * pageSize;
        return sortedSchedules.slice(startIdx, startIdx + pageSize).map((sch, idx) => ({
            idx: startIdx + idx,
            ...sch,
        }));
    }, [sortedSchedules, currentPage]);


    // i) Funciones para agregar/eliminar horario
    const addSchedule = () => {
        // Validaciones previas (campos completos, rango de fechas, solapamientos internos, etc.)
        if (
            !newSch.day ||
            !newSch.startHour ||
            !newSch.endHour ||
            isEndBeforeStart ||
            hasOverlap
        ) {
            return;
        }

        // Verificar que las fechas del curso existan y sean válidas
        if (!courseStartDate || !courseEndDate) {
            toast.error("Primero selecciona la fecha de inicio y fin del curso.");
            return;
        }
        if (courseEndDate < courseStartDate) {
            toast.error("La fecha de fin debe ser posterior a la fecha de inicio del curso.");
            return;
        }

        // Buscar reserva conflictiva en TODO el rango de fechas
        const reservaConflictiva = findConflictingReservation(
            newSch,
            spacesData,
            reservations,
            courseStartDate,
            courseEndDate
        );

        if (reservaConflictiva) {
            // Construir un mensaje que incluya info de la reserva:
            const { name, date, horaInicioRes, horaFinRes, description } = reservaConflictiva;
            toast.error(
                `No se puede agregar este horario: choca con la reserva “${name}” del ${date} ` +
                `entre ${horaInicioRes} y ${horaFinRes}. ${description}`
            );
            return;
        }

        // Si no hay conflicto, agregar el horario normalmente
        setSchedules((prev) => [...prev, newSch]);
        setCurrentPage(1);
        setNewSch({ day: "MONDAY", startHour: "", endHour: "", spaceUsed: "" });
    };




    const removeSchedule = (toRemove: Schedule) => {
        setSchedules(prev =>
            prev.filter(s =>
                !(
                    s.day === toRemove.day &&
                    s.startHour === toRemove.startHour &&
                    s.endHour === toRemove.endHour &&
                    s.spaceUsed === toRemove.spaceUsed
                )
            ));
    };

    // --- PRECIOS DEL CURSO  ---
    type PriceEntry = { numberDays: number; inscriptionPriceMember: string; inscriptionPriceGuest: string };
    const [prices, setPrices] = useState<PriceEntry[]>(initialData?.prices || []);
    const [currentPagePr, setCurrentPagePr] = useState(1);
    const pageSizePr = 3;
    const hasChangedType = useRef(false);
    const [newPrice, setNewPrice] = useState<PriceEntry>({
        numberDays: 0,
        inscriptionPriceMember: "",
        inscriptionPriceGuest: "",
    });

    // Para desactivar inscripción externo, miramos el switch:
    const allowOutsidersValue = watch("allowOutsiders");

    // Ordenamos precios por número de días ascendente:
    const sortedPrices = useMemo(() => {
        return [...prices].sort((a, b) => a.numberDays - b.numberDays);
    }, [prices]);
    const pageCountPr = Math.ceil(sortedPrices.length / pageSizePr);
    const pagedPrices = useMemo(() => {
        const startIdx = (currentPagePr - 1) * pageSizePr;
        return sortedPrices.slice(startIdx, startIdx + pageSizePr).map((pr, idx) => ({
            idx: startIdx + idx,
            ...pr,
        }));
    }, [sortedPrices, currentPagePr]);
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
    const canAddPrice = React.useMemo(() => {
        // Si es FIXED:
        if (courseTypeValue === "FIXED") {
            // 1) Necesito al menos 1 horario agregado para permitir precio en FIXED
            if (schedules.length === 0) return false;
            // 2) Solo permitir un único precio
            if (prices.length > 0) return false;
            // 3) Validar que Member price exista
            if (!newPrice.inscriptionPriceMember) return false;
            // 4) Si permite externos, validar que Guest price exista
            if (allowOutsidersValue && !newPrice.inscriptionPriceGuest) return false;
            return true;
        }

        // Si es FLEXIBLE:
        // numberDays debe ser >=1 y <= schedules.length
        if (newPrice.numberDays < 1) return false;
        if (newPrice.numberDays > schedules.length) return false;
        // Member price obligatorio
        if (!newPrice.inscriptionPriceMember) return false;
        // Si permite externos, Guest price obligatorio
        if (allowOutsidersValue && !newPrice.inscriptionPriceGuest) return false;
        // No repetir días
        const duplicate = prices.some((p) => p.numberDays === newPrice.numberDays);
        return !duplicate;
    }, [newPrice, prices, allowOutsidersValue, courseTypeValue, schedules]);
    // En cuanto se desactiva “Permitir externos”, forzamos inscriptionPriceGuest a "0"
    useEffect(() => {
        if (!allowOutsidersValue) {
            setNewPrice(p => ({
                ...p,
                inscriptionPriceGuest: ""
            }));
        }
    }, [allowOutsidersValue]);

    /*
    useEffect(() => {
        if (!initialData) {
            // modo “nuevo curso”: siempre limpio al cambiar fechas
            setSchedules([]);
            setPrices([]);
        } else {
            // modo “editar”: limpio únicamente si cambió la fecha de inicio o fin
            const origStart = new Date(initialData.startDate).getTime();
            const origEnd = new Date(initialData.endDate).getTime();
            const newStart = new Date(courseStartDate)?.getTime();
            const newEnd = new Date(courseEndDate)?.getTime();
            if (
                (newStart !== undefined && newStart !== origStart) ||
                (newEnd !== undefined && newEnd !== origEnd)
            ) {
                setSchedules([]);
                setPrices([]);
            }
        }
    }, [courseStartDate, courseEndDate, initialData]);
*/
    const addPrice = () => {
        if (!canAddPrice) return;
        setPrices((prev) => [...prev, newPrice]);
        setCurrentPagePr(1);
        // Reiniciar newPrice: si es FIXED, mantenemos numberDays = 0; si es FLEXIBLE, lo ponemos a 1 por defecto
        setNewPrice({
            numberDays: courseTypeValue === "FIXED" ? 0 : 1,
            inscriptionPriceMember: "",
            inscriptionPriceGuest: "",
        });
    };


    const removePrice = (toRemove: PriceEntry) => {
        setPrices(prev =>
            prev.filter(p =>
                !(
                    p.numberDays === toRemove.numberDays &&
                    p.inscriptionPriceMember === toRemove.inscriptionPriceMember &&
                    p.inscriptionPriceGuest === toRemove.inscriptionPriceGuest
                )
            )
        );
    };

    // ————— ESTADOS PARA ERRORES PERSONALIZADOS —————
    const [scheduleError, setScheduleError] = useState<string | null>(null);
    const [priceError, setPriceError] = useState<string | null>(null);

    // ————— useEffect para limpiar scheduleError tan pronto haya al menos 1 horario —————
    useEffect(() => {
        if (courseTypeValue === "FLEXIBLE") {
            setPrices((prev) =>
                prev.filter((p) => p.numberDays <= schedules.length)
            );
        }

        if (courseTypeValue === "FIXED" && schedules.length === 0) {
            // En FIXED: si se eliminaron todos los horarios, borrar todos los precios
            setPrices([]);
        }
    }, [schedules, scheduleError]);
    // ————— useEffect para limpiar priceError tan pronto haya al menos 1 precio —————
    useEffect(() => {
        if (prices.length > 0 && priceError) {
            setPriceError(null);
        }
    }, [prices, priceError]);

    useEffect(() => {
        if (initialData) {
            setSchedules(initialData.schedules);
            setPrices(initialData.prices);
        }
    }, [initialData]);

    // 3) Efecto que limpia precios SOLO cuando el usuario cambia realmente el tipo:
    useEffect(() => {
        // Si aún no hay valor (por ejemplo al montar en creación), o
        // si es igual al original (modo edición sin tocar selector), no hago nada:
        if (
            courseTypeValue === undefined ||
            courseTypeValue === originalTypeRef.current
        ) {
            return;
        }

        // En cualquier otro caso (usuario cambió el selector):
        setPrices([]);
        setNewPrice({
            numberDays: courseTypeValue === "FIXED" ? 0 : 1,
            inscriptionPriceMember: "",
            inscriptionPriceGuest: "",
        });
    }, [courseTypeValue]);


    const [isSubmitting, setIsSubmitting] = useState(false);

    // j) Al guardar el curso, enviamos también los schedules
    const submitHandler = async (values: CourseFormValues) => {
        if (readOnly) {
            onClose();
            return;
        }
        let hasError = false;

        // 1) Validar que haya al menos un horario
        if (schedules.length === 0) {
            setScheduleError("Debes agregar al menos un horario antes de guardar.");
            hasError = true;
        } else {
            setScheduleError(null);
        }

        // 2) Validar que haya al menos un precio
        if (prices.length === 0) {
            setPriceError("Debes agregar al menos un precio antes de guardar.");
            hasError = true;
        } else {
            setPriceError(null);
        }
        // 3) Si es FLEXIBLE: validar que número de precios === número de horarios
        if (courseTypeValue === "FLEXIBLE") {
            if (prices.length < 1 || prices.length > schedules.length) {
                toast.error("En modo flexible, debes crear al menos un precio y como máximo tantos precios como horarios agregaste.");
                setPriceError("En modo flexible, la cantidad de precios debe ser entre 1 y la cantidad de horarios.");
                hasError = true;
            }
        }
        // Si hubo cualquiera de los dos errores, detenemos el envío
        if (hasError) return;


        //console.log("Datos del curso guardados:", { ...values, schedules, prices, academyId });

        try {
            setIsSubmitting(true);
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/academyCourse/addCoursesByAcademyId`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: 'include',
                body: JSON.stringify({
                    academyId,
                    academyCourse: {
                        ...values,                 // campos como name, startDate, etc.
                        name: values.name + '-' + values.nameSchedule,
                        urlImage: uploadedUrl,     // imagen
                        prices,  // los precios deben estar AQUÍ
                        schedules, // los horarios deben estar AQUÍ
                    },
                }),

            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => null); // <- muy importante
                throw new Error(errorData?.message || "Error desconocido");
            }
            toast.success(
                <>
                    <strong>Curso creado correctamente.</strong>
                </>
            );
            // Si llegamos aquí, todo está bien
            onSave({ ...values, schedules, prices });
            onClose();
            queryClient.invalidateQueries({ queryKey: ['get-courses-by-academy-id', academyId] }); // Actualiza si tienes esta query

        }
        catch (error) {
            console.error("Error al guardar el curso:", error);
            toast.error(
                <>
                    <strong>Error al guardar el curso.</strong>
                    <div>{error?.message || "Error desconocido"}</div>
                </>
            );

        }
        finally {
            setIsSubmitting(false);
        }
    };
    /*
   ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣾⠓⠶⣤⠀⠀⠀⠀⣠⠶⣄⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⠇⠀⢠⡏⠀⠀⢀⡔⠉⠀⢈⡿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠩⠤⣄⣼⠁⠀⣠⠟⠀⠀⣠⠏⠀⠀⢀⣀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⢀⣀⣀⣀⣀⣀⣀⣀⠀⠀⠀⠁⠀⠀⠣⣤⣀⡼⠃⠀⢀⡴⠋⠈⠳⡄⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣠⣴⣶⣿⡿⠿⠿⠟⠛⠛⠛⠛⠿⠿⣿⣿⣶⣤⣄⠀⠀⠀⠉⠀⢀⡴⠋⠀⠀⣠⠞⠁⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣴⣾⣿⠿⠋⠉⢀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠉⠻⢿⣿⣶⣄⠀⠀⠳⣄⠀⣠⠞⢁⡠⢶⡄⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⣾⣿⠿⠋⠀⠀⢀⣴⠏⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠑⢤⡈⠛⢿⣿⣦⡀⠈⠛⢡⠚⠃⠀⠀⢹⡆⠀⠀⠀MODO EDIT
⠀⠀⠀⠀⠀⠀⠀⠀⢀⣼⣿⠟⠁⠀⠀⠀⢀⣾⠃⠀⠀⢀⡀⠀⠀⠀⠀⠀⠀⠀⠀⢻⡆⠀⠀⢻⣦⠀⠙⢿⣿⣦⡀⠈⢶⣀⡴⠞⠋⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⣠⣿⡿⠃⠀⠀⠀⠀⢀⣾⡇⢀⡄⠀⢸⡇⠀⠀⠀⠀⠀⠀⣀⠀⢸⣷⡀⠀⠀⠹⣷⡀⠀⠙⢿⣷⡀⠀⠉⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⣰⣿⡟⠀⠀⠀⠀⠀⠀⣾⣿⠃⣼⡇⠀⢸⡇⠀⠀⠀⠀⠀⠀⣿⠀⢸⣿⣷⡀⠀⢀⣾⣿⡤⠐⠊⢻⣿⡀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⢠⣿⣿⣼⡇⠀⠀⠀⠀⢠⣿⠉⢠⣿⠧⠀⣸⣇⣠⡄⠀⠀⠀⠀⣿⠠⢸⡟⠹⣿⡍⠉⣿⣿⣧⠀⠀⠀⠻⣿⣶⣄⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⢸⣿⣿⡟⠀⠀⠀⠀⠀⣼⡏⢠⡿⣿⣦⣤⣿⡿⣿⡇⠀⠀⠀⢸⡿⠻⣿⣧⣤⣼⣿⡄⢸⡿⣿⡇⠀⠀⢠⣌⠛⢿⣿⣶⣤⣤⣄⡀
⠀⠀⠀⣀⣤⣿⣿⠟⣀⠀⠀⠀⠀⠀⣿⢃⣿⠇⢿⣯⣿⣿⣇⣿⠁⠀⠀⠀⣾⡇⢸⣿⠃⠉⠁⠸⣿⣼⡇⢻⡇⠀⠀⠀⢿⣷⣶⣬⣭⣿⣿⣿⠇
⣾⣿⣿⣿⣿⣻⣥⣾⡇⠀⠀⠀⠀⠀⣿⣿⠇⠀⠘⠿⠋⠻⠿⠿⠶⠶⠾⠿⠿⠍⢛⣧⣰⠶⢀⣀⣼⣿⣴⡸⣿⠀⠀⠀⠸⣿⣿⣿⠉⠛⠉⠀⠀
⠘⠛⠿⠿⢿⣿⠉⣿⠁⠀⠀⠀⠀⢀⣿⡿⣶⣶⣶⣤⣤⣤⣀⣀⠀⠀⠀⠀⠀⠀⢀⣭⣶⣿⡿⠟⠋⠉⠀⠀⣿⠀⡀⡀⠀⣿⣿⣿⡆⠀⠀⠀⠀
⠀⠀⠀⠀⣼⣿⠀⣿⠀⠀⠸⠀⠀⠸⣿⠇⠀⠀⣈⣩⣭⣿⡿⠟⠃⠀⠀⠀⠀⠀⠙⠛⠛⠛⠛⠻⠿⠷⠆⠀⣯⠀⠇⡇⠀⣿⡏⣿⣧⠀⠀⠀⠀
⠀⠀⠀⠀⢿⣿⡀⣿⡆⠀⠀⠀⠀⠀⣿⠰⠿⠿⠛⠋⠉⠀⠀⢀⣴⣶⣶⣶⣶⣶⣦⠀⠀⠀⠀⠀⠀⠀⠀⠀⢹⣧⠀⠀⠀⣿⡇⣿⣿⠀⠀⠀⠀
⠀⠀⠀⠀⢸⣿⡇⢻⣇⠀⠘⣰⡀⠀⣿⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⠀⠀⠀⠀⢸⡿⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⣿⠀⠀⠀⣿⣧⣿⡿⠀⠀⠀⠀
⠀⠀⠀⠀⠈⣿⣧⢸⣿⡀⠀⡿⣧⠀⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⣿⡄⠀⠀⠀⣼⡇⠀⠀⠀⠀⠀⠀⢀⣤⣾⡟⢡⣶⠀⢠⣿⣿⣿⠃⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠹⣿⣿⣿⣷⠀⠇⢹⣷⡸⣿⣶⣦⣄⣀⡀⠀⠀⠀⣿⡇⠀⠀⢠⣿⠁⣀⣀⣠⣤⣶⣾⡿⢿⣿⡇⣼⣿⢀⣿⣿⠿⠏⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠈⠛⠛⣿⣷⣴⠀⢹⣿⣿⣿⡟⠿⠿⣿⣿⣿⣿⣾⣷⣶⣿⣿⣿⣿⡿⠿⠟⠛⠋⠉⠀⢸⣿⣿⣿⣿⣾⣿⠃⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢿⣿⣦⣘⣿⡿⣿⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⠛⠛⠻⠿⠋⠁⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⠻⣿⣿⣿⠈⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    */
    const editSubmitHandler = async (values: CourseFormValues) => {
        if (readOnly) {
            onClose();
            return;
        }
        let hasError = false;

        // 1) Validar que haya al menos un horario
        if (schedules.length === 0) {
            setScheduleError("Debes agregar al menos un horario antes de guardar.");
            hasError = true;
        } else {
            setScheduleError(null);
        }

        // 2) Validar que haya al menos un precio
        if (prices.length === 0) {
            setPriceError("Debes agregar al menos un precio antes de guardar.");
            hasError = true;
        } else {
            setPriceError(null);
        }
        // 3) Si es FLEXIBLE: validar que número de precios === número de horarios
        if (courseTypeValue === "FLEXIBLE") {
            if (prices.length < 1 || prices.length > schedules.length) {
                toast.error("En modo flexible, debes crear al menos un precio y como máximo tantos precios como horarios agregaste.");
                setPriceError("En modo flexible, la cantidad de precios debe ser entre 1 y la cantidad de horarios.");
                hasError = true;
            }
        }
        // Si hubo cualquiera de los dos errores, detenemos el envío
        if (hasError) return;

        // Aquí pones la lógica de actualización (PUT/PATCH), distinta de la de creación
        try {
            //console.log(initialData.name)
            setIsSubmitting(true);
            const res = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/api/academyCourse/editCourseById`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        academyId,
                        courseName: initialData.name,
                        academyCourse: {
                            ...values,
                            name: values.name + '-' + values.nameSchedule,
                            urlImage: uploadedUrl,
                            schedules,
                            prices,
                        },
                    }),
                }
            );
            if (!res.ok) {
                const errorData = await res.json().catch(() => null); // <- muy importante
                throw new Error(errorData?.message || "Error desconocido");
            }
            toast.success(
                <>
                    <strong>Curso editado correctamente.</strong>
                </>
            );

            onSave && onSave({ ...values, schedules, prices });
            onClose();

            queryClient.invalidateQueries({ queryKey: ['get-courses-by-academy-id', academyId] }); // Actualiza si tienes esta query

        } catch (error: any) {
            console.error("Error al guardar el curso:", error);
            toast.error(
                <>
                    <strong>Error al editar el curso.</strong>
                    <div>{error?.message || "Error desconocido"}</div>
                </>
            );
        }
        finally {
            setIsSubmitting(false)
        }
    };


    const combinedErrors = [
        ...allErrors,
        ...(scheduleError ? [scheduleError] : []),
        ...(priceError ? [priceError] : []),
    ];
    return (
        <Card className=" flex rounded-xl border-none background-custom max-w-full p-6 relative" onClick={(e) => e.stopPropagation()}>

            {/* Botón de cerrar */}
            <button
                onClick={onClose}
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
                ✕
            </button>


            <h2 className="text-2xl font-bold text-[var(--brand)] dark:text-[var(--primary)] text-center">{readOnly ? "Detalles del Curso" : initialData ? "Editar curso" : "Agregar nuevo curso"}</h2>
            <Form {...form}>
                <form onSubmit={initialData ? (e) => e.preventDefault() : form.handleSubmit(submitHandler)} className="space-y-4">
                    <div className="flex flex-wrap w-full items-center">
                        <div className="w-full flex flex-col md:w-1/3  p-4 justify-items-center space-y-4">
                            {/* Preview */}

                            <AspectRatio ratio={16 / 9} className="w-full bg-muted rounded-lg overflow-hidden">
                                <img
                                    src={imageSrc ?? `${import.meta.env.VITE_BACKEND_URL_MEDIA}/preview.jpg`}
                                    alt="Event preview"
                                    className="h-full w-full object-cover"
                                />
                            </AspectRatio>

                            {/* Botón que abre el file picker */}
                            <Button
                                type="button"
                                className="  text-white font-bold border-0 rounded-lg  button4-custom "
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
                        </div>
                        <div className="w-full flex flex-col  md:w-2/3  p-4 gap-y-3 md:gap-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-5 gap-y-3 md:gap-y-5">
                                {/* Nombre del Curso */}
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
                                                    Nombre del Curso
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        id="name"
                                                        placeholder="Nombre del Curso"
                                                        // borde normal incluso si hay error
                                                        className="h-10 bg-white rounded-lg border-[#cccccc]"
                                                        {...field}
                                                        disabled={readOnly}
                                                        onChange={(e) => {
                                                            // Solo permite letras y espacios, y convierte a mayúsculas
                                                            const processedValue = e.target.value.replace(/[^a-zA-Z0-9\s]/g, '').toUpperCase();
                                                            field.onChange(processedValue);
                                                        }}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        );
                                    }}
                                />
                                {/* Nombre del Horario */}
                                <FormField
                                    control={form.control}
                                    name="nameSchedule"

                                    render={({ field, fieldState }) => {
                                        const hasError = Boolean(fieldState.error);
                                        return (
                                            <FormItem className="-space-y-1 w-full">
                                                <FormLabel
                                                    htmlFor="nameSchedule"
                                                    // Solo la etiqueta se tiñe de rojo cuando hay error
                                                    className={`font-normal text-base ${hasError ? "text-red-500" : ""}`}
                                                >
                                                    Nombre del Horario
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        id="nameSchedule"
                                                        placeholder="Nombre del Horario"
                                                        // borde normal incluso si hay error
                                                        className="h-10 bg-white rounded-lg border-[#cccccc]"
                                                        {...field}
                                                        onChange={(e) => {
                                                            // Solo permite letras y espacios, y convierte a mayúsculas
                                                            const processedValue = e.target.value.replace(/[^a-zA-Z0-9\s]/g, '').toUpperCase();
                                                            field.onChange(processedValue);
                                                        }}
                                                        disabled={readOnly}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        );
                                    }}
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
                                                <Input id="capacity" type="number" placeholder="Capacidad" disabled={readOnly} {...field} className="h-10 bg-white rounded-lg border-[#cccccc]" />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="startDate"
                                    render={({ field }) => (
                                        <FormItem className="-space-y-1 w-full">
                                            <FormLabel htmlFor="startDate" className="font-normal text-base">
                                                Fecha de inicio
                                            </FormLabel>
                                            <FormControl>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            id="startDate"
                                                            variant="outline"
                                                            className={cn(
                                                                `h-10 w-full bg-white rounded-lg border-[#cccccc] pr-10 text-left font-normal ${errors.startDate ? 'border-red-500 dark:border-red-500' : 'border-[#cccccc] dark:border-[#cccccc]'}`,
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                            onBlur={field.onBlur}
                                                            disabled={readOnly}
                                                        >
                                                            <CalendarIcon className="mr-2 h-4 w-4 " />
                                                            {field.value ? format(field.value, "dd-MM-yyyy", { locale: es }) : <span>dd-mm-yyyy</span>}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            onSelect={field.onChange}
                                                            locale={es}
                                                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}

                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                {/* Fecha de fin */}
                                <FormField
                                    control={form.control}
                                    name="endDate"
                                    render={({ field }) => (
                                        <FormItem className="-space-y-1 w-full">
                                            <FormLabel htmlFor="endDate" className="font-normal text-base">
                                                Fecha de fin
                                            </FormLabel>
                                            <FormControl>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            id="endDate"
                                                            variant="outline"
                                                            className={cn(
                                                                `h-10 w-full bg-white rounded-lg border-[#cccccc] pr-10 text-left font-normal ${errors.endDate ? 'border-red-500 dark:border-red-500' : 'border-[#cccccc] dark:border-[#cccccc]'}`,
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                            onBlur={field.onBlur}
                                                            disabled={readOnly}
                                                        >
                                                            <CalendarIcon className="mr-2 h-4 w-4 " />
                                                            {field.value ? format(field.value, "dd-MM-yyyy", { locale: es }) : <span>dd-mm-yyyy</span>}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            onSelect={field.onChange}
                                                            locale={es}
                                                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                {/* Tipo de Espacio */}
                                <FormField
                                    control={form.control}
                                    name="courseType"
                                    render={({ field, fieldState }) => {
                                        const hasError = !!fieldState.error
                                        return (
                                            <FormItem className="-space-y-1 w-full">
                                                <FormLabel
                                                    htmlFor="courseType"
                                                    className={`font-normal text-base ${hasError ? "text-red-500" : ""}`}
                                                >
                                                    Tipo de inscripción
                                                </FormLabel>
                                                <FormControl>
                                                    <Select
                                                        value={field.value}
                                                        onValueChange={field.onChange}
                                                        disabled={readOnly}
                                                    >
                                                        <SelectTrigger
                                                            id="courseType"
                                                            className={`h-10 bg-white rounded-lg border px-2 w-full ${hasError ? "border-red-500" : "border-[#cccccc]"}`}
                                                        >
                                                            <SelectValue placeholder="Seleccione tipo" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {data.map((course) => (
                                                                <SelectItem key={course.id} value={course.name} disabled={readOnly}>
                                                                    {course.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </FormControl>
                                            </FormItem>
                                        )
                                    }}
                                />



                            </div>
                            {/* Permitir externos */}
                            <FormField
                                control={control}
                                name="allowOutsiders"
                                render={({ field }) => (
                                    <FormItem className="flex items-center gap-2 mb-0">
                                        <FormLabel className="font-normal text-base m-0">
                                            Permitir externos
                                        </FormLabel>
                                        <FormControl>
                                            <Switch
                                                id="allowOutsiders"
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                                className=" data-[state=checked]:bg-[#318161]"
                                                disabled={readOnly}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    {/* Descripción */}
                    <div className="flex flex-col w-full  items-center min-w-0">
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem className="-space-y-1 w-full min-w-0">
                                    <FormLabel htmlFor="description" className="font-normal text-base">
                                        Descripción
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea id="description" {...field} maxLength={200} wrap="soft" disabled={readOnly} className="h-min w-full bg-white rounded-lg border-[#cccccc] break-all resize-y" />
                                    </FormControl>
                                    <p className="text-sm text-muted-foreground text-right">
                                        {field.value.length}/200
                                    </p>
                                </FormItem>
                            )}
                        />

                    </div>
                    {/* ———————————————— */}
                    {/* 4) MINI-FORM PARA AGREGAR HORARIO  */}
                    {/* ———————————————— */}
                    {!readOnly && (
                        <div className="border-t border-gray-300 pt-4">
                            <h3 className="text-lg font-semibold  mb-2">Agregar nuevo día</h3>
                            <div className="flex flex-wrap items-center gap-4">
                                {/* Día */}
                                <FormLabel className="font-normal text-base">Día</FormLabel>
                                <div className="flex-1 min-w-[120px]">
                                    <Select
                                        value={newSch.day}
                                        onValueChange={(val) => setNewSch((s) => ({ ...s, day: val as WeekDay }))}
                                    >
                                        <SelectTrigger className="w-full bg-white rounded-lg border-gray-300">
                                            <SelectValue placeholder="Seleccione día" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {daysOfWeek.map((d) => (
                                                <SelectItem key={d.value} value={d.value}>
                                                    {d.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Inicio */}
                                <FormLabel className="font-normal text-base">Inicio</FormLabel>
                                <Input
                                    type="time"
                                    className="flex-1 min-w-[100px] bg-white rounded-lg border-gray-300"
                                    value={newSch.startHour}
                                    onChange={(e) => setNewSch((s) => ({ ...s, startHour: e.target.value }))}
                                />

                                {/* Fin */}
                                <FormLabel className="font-normal text-base">Fin</FormLabel>
                                <Input
                                    type="time"
                                    className="flex-1 min-w-[100px] bg-white rounded-lg border-gray-300"
                                    value={newSch.endHour}
                                    onChange={(e) => setNewSch((s) => ({ ...s, endHour: e.target.value }))}
                                />

                                {/* Espacio */}
                                <FormLabel className="font-normal text-base">Espacio</FormLabel>
                                <div className="flex-1 min-w-[120px]">
                                    <Select
                                        value={newSch.spaceUsed}
                                        onValueChange={(val) => setNewSch((s) => ({ ...s, spaceUsed: val }))}
                                    >
                                        <SelectTrigger className="w-full bg-white rounded-lg border-gray-300">
                                            <SelectValue placeholder="Seleccione espacio" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {spaces.map((sp) => (
                                                <SelectItem key={sp} value={sp}>
                                                    {sp}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Botón “Agregar” */}
                                <Button
                                    className="bg-[var(--brand)] text-white font-bold rounded-lg border-0 button3-custom"
                                    onClick={addSchedule}
                                    type="button"
                                    disabled={
                                        !newSch.day ||
                                        !newSch.startHour ||
                                        !newSch.endHour ||
                                        !newSch.spaceUsed ||
                                        isEndBeforeStart ||
                                        hasOverlap
                                    }
                                >
                                    Agregar
                                </Button>
                            </div>
                        </div>
                    )}
                    {/* ———————————————— */}
                    {/* 5) MINI-FORM PARA AGREGAR PRECIOS  */}
                    {/* ———————————————— */}
                    {!readOnly && (
                        <div className="border-t border-gray-300 pt-4 ">
                            <h3 className="text-lg font-semibold  mb-2">Agregar nuevo precio</h3>
                            <div className="flex flex-wrap items-center gap-4 justify-between">
                                {/* Número de días (solo si es FLEXIBLE) */}
                                {courseTypeValue === "FLEXIBLE" && (
                                    <>
                                        <FormLabel className="font-normal text-base"># Días</FormLabel>
                                        <Input
                                            type="number"
                                            className="flex-1 w-[60px] bg-white rounded-lg border-gray-300"
                                            value={newPrice.numberDays}
                                            onChange={(e) =>
                                                setNewPrice((s) => ({
                                                    ...s,
                                                    numberDays: Number(e.target.value),
                                                }))
                                            }
                                            min={0} // En flexible no puede ser 0
                                        />
                                    </>
                                )}

                                {/* Inscripción Socio */}
                                <FormLabel className="font-normal text-base">Inscripción Socio</FormLabel>
                                <NumericFormat
                                    className="flex-1 h-10 w-[100px] bg-white border-1 rounded-lg border-[#cccccc] px-2 dark:bg-[var(--color-gray-800)] "
                                    value={newPrice.inscriptionPriceMember}
                                    onValueChange={({ value }) =>
                                        setNewPrice((s) => ({ ...s, inscriptionPriceMember: value }))
                                    }
                                    decimalSeparator="."
                                    decimalScale={2}
                                    fixedDecimalScale
                                    prefix="S/ "
                                    placeholder="S/ 0.00"
                                />

                                {/* Inscripción Externo (solo si permite externos) */}
                                <FormLabel className="font-normal text-base">Inscripción Externo</FormLabel>
                                <NumericFormat
                                    className={cn(
                                        `flex-1 h-10 w-[100px]  bg-white border-1 rounded-lg border-[#cccccc] px-2 dark:bg-[var(--color-gray-800)]`,
                                        !allowOutsidersValue && "opacity-50 cursor-not-allowed"
                                    )}
                                    value={newPrice.inscriptionPriceGuest}
                                    onValueChange={({ value }) =>
                                        setNewPrice((s) => ({ ...s, inscriptionPriceGuest: value }))
                                    }
                                    decimalSeparator="."
                                    decimalScale={2}
                                    fixedDecimalScale
                                    prefix="S/ "
                                    placeholder="S/ 0.00"
                                    disabled={!allowOutsidersValue}
                                />



                                {/* Botón “Agregar” */}
                                <Button
                                    className="bg-[var(--brand)] text-white font-bold rounded-lg border-0 button3-custom"
                                    onClick={addPrice}
                                    type="button"
                                    disabled={!canAddPrice}
                                >
                                    Agregar
                                </Button>
                            </div>
                        </div>
                    )}
                    {/* ———————————————— */}
                    {/* 6) TABLA ORDENADA DE HORARIOS y PRECIOS  */}
                    {/* ———————————————— */}
                    <div className="flex flex-col md:flex-row gap-6 mt-4">
                        <div className="flex-1 border-t border-gray-300 ">
                            {schedules.length > 0 && (
                                <div className="mt-6 w-full">
                                    <h3 className="text-lg font-semibold mb-2">Días añadidos</h3>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="font-bold text-[var(--brand)] dark:text-[var(--primary)] ">Día</TableHead>
                                                <TableHead className="text-center font-bold text-[var(--brand)] dark:text-[var(--primary)]">Inicio</TableHead>
                                                <TableHead className="text-center font-bold text-[var(--brand)] dark:text-[var(--primary)]">Fin</TableHead>
                                                <TableHead className="font-bold text-[var(--brand)] dark:text-[var(--primary)]">Espacio</TableHead>
                                                <TableHead className="text-center font-bold text-[var(--brand)] dark:text-[var(--primary)]">{readOnly ? "" : "Acciones"}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {pagedSchedules.map(({ day, startHour, endHour, spaceUsed }, i) => (
                                                <TableRow key={i}>
                                                    <TableCell>{daysOfWeek.find((d) => d.value === day)!.label}</TableCell>
                                                    <TableCell className="text-center">{startHour}</TableCell>
                                                    <TableCell className="text-center">{endHour}</TableCell>
                                                    <TableCell>{spaceUsed}</TableCell>
                                                    <TableCell className="text-center">
                                                        {!readOnly && (
                                                            <Button
                                                                size="sm"
                                                                type="button"
                                                                className="text-white bg-red-500 hover:bg-red-600 font-bold border-0 rounded-lg shadow-[0_0_5px_0px_rgba(0,0,0,0)] shadow-gray-400"
                                                                onClick={() => removeSchedule({ day, startHour, endHour, spaceUsed })}
                                                            >
                                                                Eliminar
                                                            </Button>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>

                                    {/* Paginación (si hay más de una página) */}
                                    {pageCount > 1 && (
                                        <Pagination className="flex justify-center mt-4">
                                            <PaginationContent>
                                                <PaginationItem>
                                                    <PaginationPrevious
                                                        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                                                        aria-disabled={currentPage === 1}
                                                        tabIndex={currentPage === 1 ? -1 : undefined}
                                                        className={currentPage === 1 ? "pointer-events-none opacity-50" : undefined}
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
                                                        onClick={() => setCurrentPage((p) => Math.min(p + 1, pageCount))}
                                                        aria-disabled={currentPage === pageCount}
                                                        tabIndex={currentPage === pageCount ? -1 : undefined}
                                                        className={currentPage === pageCount ? "pointer-events-none opacity-50" : undefined}
                                                    >
                                                        Siguiente
                                                    </PaginationNext>
                                                </PaginationItem>
                                            </PaginationContent>
                                        </Pagination>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 border-t border-gray-300">
                            {prices.length > 0 && (
                                <div className="mt-6 w-full">
                                    <h3 className="text-lg font-semibold mb-2">
                                        {courseTypeValue === "FIXED" ? "Precio añadido" : "Precios añadidos"}
                                    </h3>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                {courseTypeValue === "FLEXIBLE" && (
                                                    <TableHead className="font-bold text-[var(--brand)] dark:text-[var(--primary)]">
                                                        # Días
                                                    </TableHead>
                                                )}
                                                <TableHead className="text-center font-bold text-[var(--brand)] dark:text-[var(--primary)]">Socio (S/)</TableHead>
                                                <TableHead className="text-center font-bold text-[var(--brand)] dark:text-[var(--primary)]">Externo (S/)</TableHead>
                                                <TableHead className="text-center font-bold text-[var(--brand)] dark:text-[var(--primary)]">{readOnly ? "" : "Acciones"}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {pagedPrices.map((pr, i) => (
                                                <TableRow key={i}>
                                                    {courseTypeValue === "FLEXIBLE" && (
                                                        <TableCell>{pr.numberDays}</TableCell>
                                                    )}
                                                    <TableCell className="text-center">{pr.inscriptionPriceMember}</TableCell>
                                                    <TableCell className="text-center">
                                                        {allowOutsidersValue ? pr.inscriptionPriceGuest : "-"}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {!readOnly && (
                                                            <Button
                                                                size="sm"
                                                                type="button"
                                                                className="text-white bg-red-500 hover:bg-red-600 font-bold border-0 rounded-lg shadow-[0_0_5px_0px_rgba(0,0,0,0)] shadow-gray-400"
                                                                onClick={() => removePrice({
                                                                    numberDays: pr.numberDays,
                                                                    inscriptionPriceMember: pr.inscriptionPriceMember,
                                                                    inscriptionPriceGuest: pr.inscriptionPriceGuest,
                                                                })}
                                                            >
                                                                Eliminar
                                                            </Button>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>

                                    {/* Paginación Precios */}
                                    {pageCountPr > 1 && (
                                        <Pagination className="flex justify-center mt-4">
                                            <PaginationContent>
                                                <PaginationItem>
                                                    <PaginationPrevious
                                                        onClick={() => setCurrentPagePr((p) => Math.max(p - 1, 1))}
                                                        aria-disabled={currentPagePr === 1}
                                                        tabIndex={currentPagePr === 1 ? -1 : undefined}
                                                        className={currentPagePr === 1 ? "pointer-events-none opacity-50" : ""}
                                                    >
                                                        Anterior
                                                    </PaginationPrevious>
                                                </PaginationItem>

                                                {Array.from({ length: pageCountPr }).map((_, i) => (
                                                    <PaginationItem key={i}>
                                                        <PaginationLink
                                                            onClick={() => setCurrentPagePr(i + 1)}
                                                            isActive={currentPagePr === i + 1}
                                                        >
                                                            {i + 1}
                                                        </PaginationLink>
                                                    </PaginationItem>
                                                ))}

                                                <PaginationItem>
                                                    <PaginationNext
                                                        onClick={() => setCurrentPagePr((p) => Math.min(p + 1, pageCountPr))}
                                                        aria-disabled={currentPagePr === pageCountPr}
                                                        tabIndex={currentPagePr === pageCountPr ? -1 : undefined}
                                                        className={currentPagePr === pageCountPr ? "pointer-events-none opacity-50" : ""}
                                                    >
                                                        Siguiente
                                                    </PaginationNext>
                                                </PaginationItem>
                                            </PaginationContent>
                                        </Pagination>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>



                    {/* ——— Contenedor de botones + errores ——— */}
                    <div className="flex flex-col w-full items-center">
                        {/* ErrorSummary: en edición usa allErrors, en creación combinedErrors */}

                        <ErrorSummary messages={combinedErrors} />

                        <div className="flex gap-20 mt-8 w-full justify-center">
                            {/* Cancelar siempre presente */}
                            <Button
                                type="button"
                                disabled={isSubmitting}
                                onClick={onClose}
                                className="max-w-[200px] w-full text-white font-bold border-0 rounded-lg button4-custom"
                            >
                                Cancelar
                            </Button>

                            {/* Guardar o Guardar cambios */}
                            {initialData && !readOnly ? (
                                <Button
                                    type="button"
                                    disabled={isSubmitting}
                                    onClick={form.handleSubmit(editSubmitHandler)}
                                    className="max-w-[200px] w-full bg-[var(--brand)] text-white font-bold rounded-lg border-0 button3-custom"
                                >
                                    Guardar cambios
                                </Button>
                            ) : (
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="max-w-[200px] w-full bg-[var(--brand)] text-white font-bold rounded-lg border-0 button3-custom"
                                >
                                    {isSubmitting ? "Guardando..." : "Guardar"}
                                </Button>
                            )}
                        </div>
                    </div>



                </form>
            </Form>
        </Card >
    );
}


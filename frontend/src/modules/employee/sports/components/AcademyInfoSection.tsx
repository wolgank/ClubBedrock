import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AspectRatio } from "@/components/ui/aspect-ratio"

import { NumericFormat } from "react-number-format";
import ReservationSpacesSection from "./ReservationSpacesSection";
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button";
import React, { useRef, useState, useMemo, useEffect } from "react";
import MensajeDeAviso from "./EditSpaceModal";
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray, useWatch } from "react-hook-form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { z } from "zod"
import { useQuery } from "@tanstack/react-query";
import { getAllEventsByAcademy } from "@/lib/api/apiAcademy";
import { useParams } from 'react-router-dom';
import { useQueryClient } from "@tanstack/react-query";
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
import { AcademyFormValues, AcademySchema } from "../components/AcademyFormSection";
import { CourseFormValues, CourseWithSchedules } from "./FormAssignAcademyCourse";
import { courseSchema } from "./CreateCourseModal";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import CreateCourseModal from "./CreateCourseModal";
import ParticipantsSection from "./ParticipantsSection";
import { getOneAcademy } from "@/lib/api/apiAcademy";

interface Props {
    academy: AcademyFormValues
    onRequestDeleteReservation: (id: number, name: string, curso: string, correo: string) => void;
    urlImage: string;
    idAcademy: number;
    onNameChange: (newName: string) => void;
}

export type Space = {
    id: number;
    name: string;
};

export type RawCourse = {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
    description: string;
    capacity: number;
    allowOutsiders: boolean;
    isActive: boolean;
    courseType: string;
    academyName: string;
    schedule: {
        day: string;
        startTime: string;
        endTime: string;
    }[];
    pricing: {
        id: number;
        numberDays: string;
        inscriptionPriceMember: string;
        inscriptionPriceGuest: string;
    }[];
};

type FormattedCourse = {
    name: string;
    startDate: Date;
    endDate: Date;
    capacity: number;
    allowOutsiders: boolean;
    courseType: string;
    description: string;
    schedules: {
        day: string;
        startHour: string;
        endHour: string;
        spaceUsed: string;
    }[];
    prices: {
        numberDays: number;
        inscriptionPriceMember: string;
        inscriptionPriceGuest: string;
    }[];
};

export function transformCourses(rawCourses: RawCourse[]): FormattedCourse[] {
    return rawCourses.map((course) => ({
        name: course.name,
        startDate: new Date(course.startDate),
        endDate: new Date(course.endDate),
        capacity: course.capacity,
        allowOutsiders: course.allowOutsiders,
        courseType: course.courseType,
        description: course.description,
        schedules: course.schedule.map((s) => ({
            day: s.day,
            startHour: s.startTime.slice(0, 5), // "10:00:00" -> "10:00"
            endHour: s.endTime.slice(0, 5),
            spaceUsed: "", // Lo llenas tú si tienes el dato
        })),
        prices: course.pricing.map((p) => ({
            numberDays: Number(p.numberDays),
            inscriptionPriceMember: p.inscriptionPriceMember,
            inscriptionPriceGuest: p.inscriptionPriceGuest,
        })),
    }));
}


const data: Space[] = [
    { id: 1, name: "Sala de Conferencias A" },
    { id: 2, name: "Auditorio Principal" },
    { id: 3, name: "Patio Externo" },
];

const hardcodedCourses: CourseWithSchedules[] = [
    {
        name: "Taekwondo Infantil Básico",
        startDate: new Date("2025-03-01"),
        endDate: new Date("2025-05-01"),
        capacity: 20,
        allowOutsiders: true,
        courseType: "FIXED",
        description: "Taekwondo para niños, enfoque en disciplina y fundamentos básicos.",
        schedules: [
            { day: "WEDNESDAY", startHour: "17:00", endHour: "18:00", spaceUsed: "Dojo Principal" },
            { day: "FRIDAY", startHour: "17:00", endHour: "18:00", spaceUsed: "Dojo Principal" },
        ],
        prices: [
            { numberDays: 60, inscriptionPriceMember: "130.00", inscriptionPriceGuest: "170.00" },
        ],
    },
    {
        name: "Taekwondo Adultos Avanzado",
        startDate: new Date("2025-06-01"),
        endDate: new Date("2025-09-01"),
        capacity: 15,
        allowOutsiders: false,
        courseType: "FLEXIBLE",
        description: "Formación avanzada en Taekwondo para adultos con experiencia previa.",
        schedules: [
            { day: "TUESDAY", startHour: "19:00", endHour: "21:00", spaceUsed: "Dojo Avanzado" },
            { day: "THURSDAY", startHour: "19:00", endHour: "21:00", spaceUsed: "Dojo Avanzado" },
        ],
        prices: [
            { numberDays: 90, inscriptionPriceMember: "300.00", inscriptionPriceGuest: "" },
        ],
    },
];



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


export default function EventInfoSection({ academy, urlImage, idAcademy, onRequestDeleteReservation, onNameChange }: Props) {
    const queryClient = useQueryClient();
    const { id } = useParams<{ id: string }>();

    // const { isLoading, data: dataAcademy, refetch } = useQuery({
    //     queryKey: ['get-all-academy-courses-info', idAcademy],
    //     queryFn: () => getAllEventsByAcademy(idAcademy.toString()),
    //     enabled: !!idAcademy,
    // });

    const { error: errorTimeSlot, data, isLoading: cargandoAcademia } = useQuery({
        queryKey: ['get-Academy', id],
        queryFn: () => getOneAcademy(id.toString()),
        enabled: !!id,
    });


    // useEffect(() => {
    //     //console.log(dataAcademy)
    // }, [dataAcademy])

    // Form field data
    // Estado para manejar imagen ...
    const [imageSrc, setImageSrc] = useState<string | null>(urlImage || null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const initialImageName = urlImage
        ? urlImage.split("/").pop() || null
        : null;

    const [uploadedUrl, setUploadedUrl] = useState<string | null>(initialImageName || null)


    // Modal de éxito / confirmación
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showModal, setShowModal] = useState(false);


    // Modal para Crear/Editar Curso
    const [showCourseModal, setShowCourseModal] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    // Cursos en estado, inicializados con los dos “hardcoded”
    const [courses, setCourses] = useState<CourseWithSchedules[]>(hardcodedCourses);
    const [coursesError, setCoursesError] = useState<string | null>(null);

    // Paginación de la tabla de cursos
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 5;
    const sortedCourses = useMemo(
        () => [...courses].sort((a, b) => a.name.localeCompare(b.name)),
        [courses]
    );
    const pageCount = Math.ceil(sortedCourses.length / pageSize);
    const pagedCourses = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return sortedCourses.slice(start, start + pageSize);
    }, [sortedCourses, currentPage]);

    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Hookform para la parte “Información de Academia”
    const form = useForm<AcademyFormValues>({
        resolver: zodResolver(AcademySchema),
        criteriaMode: "all",
        mode: "onSubmit",
        defaultValues: {
            name: academy.name,
            deporte: academy.deporte,
            description: academy.description,
            urlImage: academy.urlImage,
        },
    });

    const { control, reset, formState, getValues } = form;
    const { errors } = formState;


    useEffect(() => {
        if (data) {
            setImageSrc(data.urlImage);
            reset({
                name: data.name,
                description: data.description,
                urlImage: data.urlImage,
                deporte: data.sport,
            });
        }
    }, [data, reset]);


    // 4. Funciones de carga de imagen
    const triggerFileSelect = () => fileInputRef.current?.click();
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

    // Efecto para limpiar errores de cursos si ya hay cursos cargados
    React.useEffect(() => {
        if (courses.length > 0 && coursesError) {
            setCoursesError(null);
        }
    }, [courses, coursesError]);

    const allErrors = getAllErrorMessages(formState.errors)


    // 5. Handlers del modal “Éxito” de creación de academia
    const openSuccessModal = () => setShowSuccessModal(true);
    const closeSuccessModal = () => {







        queryClient.invalidateQueries({ queryKey: ['get-Academy', id] });
        queryClient.invalidateQueries({ queryKey: ['get-one-academy', id] });
        setIsEditing(false);





        setShowSuccessModal(false);
    };

    const onSubmitAcademy = (values: AcademyFormValues) => {
        // 1) Validación: debe haber al menos un curso
        if (courses.length === 0) {
            setCoursesError("Debes agregar al menos un curso antes de crear la academia.");
            return; // Abortamos el envío
        }
        // Si aquí llegamos, hay al menos un curso: limpiamos el posible error
        setCoursesError(null);

        // Aquí podrías hacer un POST a tu servidor con:
        // { ...values, courses } si quieres enviarlos juntos
        //console.log("Datos de Academia:", values);
        //console.log("Cursos asignados:", courses);
        openSuccessModal();
    };

    // 7. Funciones para el modal de “Crear curso”
    // Para crear:
    const openCreateCourseModal = () => {
        setEditingIndex(null);
        setShowCourseModal(true);
    };

    // Para editar:
    const openEditCourseModal = (index: number) => {
        setEditingIndex(index);
        setShowCourseModal(true);
    };
    const closeCourseModal = () => setShowCourseModal(false);

    const handleSaveCourse = (courseAndSchedulesAndPrices: CourseWithSchedules) => {
        if (editingIndex === null) {
            setCourses((prev) => [...prev, courseAndSchedulesAndPrices]);
        } else {
            setCourses((prev) => {
                const copy = [...prev];
                copy[editingIndex] = courseAndSchedulesAndPrices;
                return copy;
            });
        }
        setCurrentPage(1);
    };

    // 8. Función para eliminar un curso de la lista
    const handleRemoveCourse = (idx: number) => {
        setCourses((prev) => {
            const next = prev.filter((_, i) => i !== idx);
            // Si al eliminar se vaciaron los cursos de la última página, retrocedemos una página
            const newPageCount = Math.ceil(next.length / pageSize) || 1;
            if (currentPage > newPageCount) {
                setCurrentPage(newPageCount);
            }
            return next;
        });
    };
    const combinedErrors = [
        ...allErrors,
        ...(coursesError ? [coursesError] : []),
    ];

    const [isEditing, setIsEditing] = useState(false)
    const [prevValues, setPrevValues] = useState<AcademyFormValues | null>(null)
    const [prevCourses, setPrevCourses] = useState<CourseWithSchedules[]>([]);


    const onSubmit = async (values: AcademyFormValues) => {

        //console.log("Datos de la Academia:", values);

        try {
            setIsSubmitting(true)
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/academy/editAcademyById/${id}`, {
                method: "PUT",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ values, urlImage: uploadedUrl })
            });
            if (!res.ok) {
                throw new Error("error")
            }
            onNameChange(values.name)
            openModal();

        }
        catch (error) {
            console.error("Error al enviar los datos de la academia:", error);
            return;
        }
        finally {
            setIsEditing(false)
            setIsSubmitting(false)
        }

    };

    const openModal = () => {
        setShowModal(true);
    };

    const closeSuccess = () => {
        setShowModal(false);
    };

    const toggleEditMode = () => {
        if (!isEditing) {
            // Entramos en modo edición: guardamos “snapshot” de academia + cursos
            setPrevValues(getValues());

            // CLONAMOS cursos preservando Date:
            setPrevCourses(structuredClone(courses));
            setIsEditing(true);
        } else {
            // Cancelar edición: restauramos valores anteriores
            if (prevValues) {
                reset(prevValues);
            }
            setCourses(prevCourses);
            setIsEditing(false);
        }
    };

    if (cargandoAcademia) {
        return <div>Cargando...</div>;
    }
    return (
        <div className="flex flex-col items-start lg:flex-col w-full">
            <div className="flex justify-between items-center w-full px-0 py-5">
                <h1 className="font-bold text-[var(--brand)] text-3xl leading-normal dark:text-[var(--primary)]">
                    Información de la Academia
                </h1>
                <Button
                    className="bg-[var(--brand)] text-white font-bold rounded-lg border-0 button3-custom"
                    onClick={toggleEditMode}
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
                                className="w-[242px] h-[43px] text-white font-bold rounded-lg button4-custom"
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
                        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 md:gap-x-20 gap-y-3 md:gap-y-5 w-full">
                                {/* Nombre */}
                                <FormField
                                    control={form.control}
                                    name="name"

                                    render={({ field, fieldState }) => {
                                        const hasError = Boolean(fieldState.error);
                                        return (
                                            <FormItem className="-space-y-1 w-full ">
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
                                <FormField
                                    control={form.control}
                                    name="deporte"

                                    render={({ field, fieldState }) => {
                                        const hasError = Boolean(fieldState.error);
                                        return (
                                            <FormItem className="-space-y-1 w-full">
                                                <FormLabel
                                                    htmlFor="deporte"
                                                    // Solo la etiqueta se tiñe de rojo cuando hay error
                                                    className={`font-normal text-base ${hasError ? "text-red-500" : ""}`}
                                                >
                                                    Deporte
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        id="deporte"
                                                        placeholder="Deporte"
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
                            </div>


                            <div className="flex flex-col gap-y-3 md:gap-y-4 w-full">
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
                                                <Textarea id="description" {...field} disabled={!isEditing} maxLength={200} className="w-full h-25 bg-white rounded-lg border-[#cccccc] break-all" />
                                            </FormControl>
                                            <p className="text-sm text-muted-foreground text-right">
                                                {field.value.length}/200
                                            </p>
                                        </FormItem>
                                    )}
                                />

                                {/* Tabla que lista los cursos agregados */}
                                {courses.length == 110 && (
                                    <>
                                        <h3 className="text-lg font-semibold">Cursos añadidos</h3>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="text-[var(--brand)] font-semibold">Nombre</TableHead>
                                                    <TableHead className="text-center text-[var(--brand)] font-semibold">Inicio</TableHead>
                                                    <TableHead className="text-center text-[var(--brand)] font-semibold"># Horarios</TableHead>
                                                    <TableHead className="text-center text-[var(--brand)] font-semibold">
                                                        # Precios
                                                    </TableHead>
                                                    <TableHead className="text-center text-[var(--brand)] font-semibold">
                                                        Acciones
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {pagedCourses.map((curso, idx) => {
                                                    // idx aquí corresponde al índice dentro de `pagedCourses`.
                                                    // Para eliminar, calculamos el índice real en `courses`:
                                                    const realIndex = courses.findIndex((c) => c === curso);
                                                    return (
                                                        <TableRow key={realIndex}>
                                                            <TableCell >{curso.name}</TableCell>
                                                            <TableCell className="text-center">{curso.startDate.toLocaleDateString()}</TableCell>
                                                            <TableCell className="text-center">
                                                                <Badge className="bg-[#318161] dark:text-white" >{curso.schedules.length}</Badge>
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                <Badge className="bg-[#318161] dark:text-white">{curso.prices.length}</Badge>
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                <Button
                                                                    size="sm"
                                                                    type="button"
                                                                    className="bg-[var(--brand)] text-white font-bold rounded-lg border-0 button3-custom mr-2"
                                                                    onClick={() => {
                                                                        setEditingIndex(realIndex);
                                                                        setShowCourseModal(true);
                                                                    }}
                                                                >
                                                                    Ver

                                                                </Button>

                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>

                                        {/* —— Paginación —— */}
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
                                                            className={
                                                                currentPage === pageCount ? "pointer-events-none opacity-50" : undefined
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
                                <ErrorSummary messages={allErrors} />
                                {/* Botón Acción */}
                                {isEditing && (
                                    <div className="flex flex-col sm:flex-row gap-4 mt-2 justify-center w-full">
                                        <Button disabled={isSubmitting} type="submit" className="h-[43px] bg-[var(--brand)] text-white font-bold rounded-lg border-0 button3-custom" >
                                            {isSubmitting? "Creando..." : "Guardar Cambios"}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </form>
                    </Form>
                </div>
            </CardContent >
            <div className="inline-flex items-center gap-2.5 px-0 py-5 ">
                <h1 className="w-fit mt-[-1.00px]  font-bold text-[var(--brand)] text-3xl tracking-[0] leading-normal dark:text-[var(--primary)]">
                    Lista de Inscritos
                </h1>
            </div>
            <Card className="flex flex-col lg:flex-row gap-8 w-full card-custom">
                <CardContent className="w-full">
                    <ParticipantsSection academy={academy} idAcademy={idAcademy} onRequestDeleteReservation={onRequestDeleteReservation} />
                </CardContent>
            </Card>
            {
                showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={closeSuccess}>
                        <MensajeDeAviso onClose={closeSuccess} />
                    </div>
                )
            }
            {
                showCourseModal && (
                    <div
                        className="fixed inset-0 bg-black/50 z-50 overflow-y-auto flex justify-center items-start py-10"
                        onClick={closeCourseModal}
                    >
                        <CreateCourseModal
                            onClose={closeCourseModal}
                            initialData={editingIndex !== null ? courses[editingIndex] : undefined}
                            {...(isEditing
                                ? {
                                    onSave: (fullData: CourseWithSchedules) => {
                                        handleSaveCourse(fullData);
                                        closeCourseModal();
                                    },
                                }
                                : {
                                    // En caso de solo lectura, no pasamos onSave.
                                    onSave: undefined,
                                })}
                            readOnly={!isEditing}
                            academyId={idAcademy}
                        />
                    </div>
                )
            }
            {/* Modal para crear curso */}
            {
                showSuccessModal && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
                        onClick={closeSuccessModal}
                    >
                        <MensajeDeAviso onClose={closeSuccessModal} />
                    </div>
                )
            }
        </div >
    );
}
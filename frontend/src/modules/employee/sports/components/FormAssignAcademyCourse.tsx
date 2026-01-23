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
import { Download } from "lucide-react"
import { exportTableToExcel, MyColumnDef } from "@/shared/utils/export"
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

import React, { useRef, useState, useMemo, useEffect } from "react";
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
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { z } from "zod";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner"
import type { Schedule, PriceEntry, courseSchema } from "./CreateCourseModal";
import { Badge } from "@/components/ui/badge";
import CreateCourseModal from "./CreateCourseModal";
import { useMutation } from "@tanstack/react-query";

import { useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { getAllBasicAcademyInfo } from "@/lib/api/apiAcademy";
import { url } from "inspector";


type ExportableCourse = {
    name: string;
    registerCapacity: string;
    startDate: string;
    endDate: string;
    courseType: string;
    schedulesCount: number;
    pricesCount: number;
};

export type Space = {
    id: number;
    name: string;
};


const data: Space[] = [
    { id: 1, name: "Sala de Conferencias A" },
    { id: 2, name: "Auditorio Principal" },
    { id: 3, name: "Patio Externo" },
];


export const AcademiaSchema = z.object({
    id: z.number(),
    name: z.string(),
    description: z.string(),
    sport: z.string(),
    urlImage: z.string().optional(),
});

export type CourseFormValues = z.infer<typeof courseSchema>;
export type AcademiaItem = z.infer<typeof AcademiaSchema>;
export type CourseWithSchedules = CourseFormValues & { schedules: Schedule[]; prices: PriceEntry[] };

import { getCoursesByAcademyId } from "@/lib/api/apiAcademyCourse";


const initialCourses: CourseWithSchedules[] = [
    {
        name: "Academia de Tenis Elite",
        startDate: new Date("2025-06-01"),
        endDate: new Date("2025-07-01"),
        capacity: 20,
        allowOutsiders: false,
        description: "Programa intensivo de tenis dirigido a jóvenes y adultos.",
        courseType: "FIXED",
        schedules: [
            { day: "MONDAY", startHour: "09:00", endHour: "11:00", spaceUsed: "Sala A" },
        ],
        prices: [
            { numberDays: 0, inscriptionPriceMember: "100.00", inscriptionPriceGuest: "" },
        ],
    },
    {
        name: "Escuela Nacional de Natación",
        startDate: new Date("2025-06-05"),
        endDate: new Date("2025-08-05"),
        capacity: 15,
        allowOutsiders: true,
        description: "Clases de natación recreativa y competitiva.",
        courseType: "FLEXIBLE",
        schedules: [
            { day: "WEDNESDAY", startHour: "10:00", endHour: "12:00", spaceUsed: "Piscina" },
            { day: "FRIDAY", startHour: "14:00", endHour: "16:00", spaceUsed: "Piscina" },
        ],
        prices: [
            { numberDays: 1, inscriptionPriceMember: "50.00", inscriptionPriceGuest: "70.00" },
            { numberDays: 2, inscriptionPriceMember: "90.00", inscriptionPriceGuest: "120.00" },
        ],
    },
];

export default function FormAssignScheduleSpace() {

    const queryClient = useQueryClient();
    const { isLoading: cargandoAcademias, error, data: dataAllBasicInfoAcademias } = useQuery({
        queryKey: ['get-all-academies-basic-info'],
        queryFn: () => getAllBasicAcademyInfo(),
    });

    const [dataAcademias, setDataAcademias] = useState<AcademiaItem[]>([]);
    const [AcademyId, setAcademyId] = useState<number>(0);
    const [courses, setCourses] = useState<CourseWithSchedules[]>([]);

    const { isLoading: cargandoCursos, error: errorCursos, data: dataCursosAcademia } = useQuery({
        queryKey: ['get-courses-by-academy-id', AcademyId],
        queryFn: () => getCoursesByAcademyId(AcademyId.toString()),
        enabled: AcademyId > 0,
    });

    useEffect(() => {
        if (AcademyId > 0) {
            setCourses([]); // limpia cursos anteriores mientras carga
        }
    }, [AcademyId]);


    useEffect(() => {
        if (dataCursosAcademia) {
            try {
                setCourses(dataCursosAcademia);
            } catch (e) {
                toast.error("Error al validar datos de cursos");
                console.error(e);
            }
            console.log("Datos de cursos cargados:", dataCursosAcademia);
        }
    }, [dataCursosAcademia]);


    useEffect(() => {
        if (dataAllBasicInfoAcademias) {
            try {
                const parsed = dataAllBasicInfoAcademias.map((item) =>
                    AcademiaSchema.parse(item)
                );
                setDataAcademias(parsed);
            } catch (e) {
                toast.error("Error al validar datos de academias");
                console.error(e);
            }
            //console.log("Datos de academias cargados:", dataAllBasicInfoAcademias);
        }
    }, [dataAllBasicInfoAcademias]);



    // ------------------------------------------
    // Select Space state
    // ------------------------------------------
    const [AcademyName, setAcademyName] = useState<string>("");
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [showCourseModal, setShowCourseModal] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [coursesError, setCoursesError] = useState<string | null>(null);
    // Estados de paginación para la tabla de cursos:
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10; // puedes ajustar cuántos cursos mostrar por página

    const sortedCourses = useMemo(() => {
        if (!Array.isArray(courses)) return [];
        return [...courses].sort((a, b) => a.name.localeCompare(b.name));
    }, [courses]);

    // Rebanamos según la página actual
    const pageCount = Math.ceil(sortedCourses.length / pageSize);
    const pagedCourses = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return sortedCourses.slice(start, start + pageSize);
    }, [sortedCourses, currentPage]);


    const navigate = useNavigate();

    // When a space is chosen, fill in the info
    const [selectedAcademyInfo, setSelectedAcademyInfo] = useState<AcademiaItem | null>(null);

    useEffect(() => {
        if (AcademyName) {
            const found = dataAcademias.find((s) => s.name === AcademyName);
            setSelectedAcademyInfo(found ?? null);
            if (found) {
                setImageSrc(found.urlImage || `${import.meta.env.VITE_BACKEND_URL_MEDIA}/preview.jpg`);
            }
        } else {
            setSelectedAcademyInfo(null);
            setImageSrc(null);
        }
    }, [AcademyName]);

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
            setCourses((prev) => {
                const safePrev = Array.isArray(prev) ? prev : [];
                return [...safePrev, courseAndSchedulesAndPrices];
            });

        } else {
            setCourses((prev) => {
                const safePrev = Array.isArray(prev) ? prev : [];
                const copy = [...safePrev];
                copy[editingIndex] = courseAndSchedulesAndPrices;
                return copy;
            });

        }
        setCurrentPage(1);
    };










    const mutation = useMutation({
        mutationFn: async ({ idAcademy, courseName }: { idAcademy: number; courseName: string }) => {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/academyCourse/removeCourse/${idAcademy}`, {
                method: "PUT",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ courseName }),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => null); // <- muy importante
                throw new Error(errorData?.message || "Error desconocidow");
            }
            return res.json();
        },

        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['get-courses-by-academy-id', AcademyId] }); // Actualiza si tienes esta query
            toast.success("Curso eliminado correctamente");
        },

        onError: (error: any) => {
            toast.error("Error al eliminar curso: " + (error.message || "Error desconocido"));
            console.error("Error en la eliminación:", error);
        },
    });





    // 8. Función para eliminar un curso de la lista
    const handleRemoveCourse = async (idx: number, realName: string) => {
        try {
            await mutation.mutateAsync({ idAcademy: AcademyId, courseName: realName });

            setCourses((prev) => {
                const next = prev.filter((_, i) => i !== idx);
                // Si al eliminar se vaciaron los cursos de la última página, retrocedemos una página
                const newPageCount = Math.ceil(next.length / pageSize) || 1;
                if (currentPage > newPageCount) {
                    setCurrentPage(newPageCount);
                }
                return next;
            });
        }
        catch { error } {
            //console.log(error)
        }
    };

    React.useEffect(() => {
        if (courses.length > 0 && coursesError) {
            setCoursesError(null);
        }
    }, [courses, coursesError]);

    if (cargandoAcademias) {
        return <div className="text-center py-20">Cargando academias...</div>;
    }
    const exportColumns: MyColumnDef<ExportableCourse>[] = [
        { headerText: "Nombre-Horario", accessorKey: "name" },
        { headerText: "Inscritos", accessorKey: "registerCapacity" },
        { headerText: "Inicio", accessorKey: "startDate" },
        { headerText: "Fin", accessorKey: "endDate" },
        { headerText: "Tipo", accessorKey: "courseType" },
        { headerText: "# Horarios", accessorKey: "schedulesCount" },
        { headerText: "# Precios", accessorKey: "pricesCount" },
    ];

    const buildExportData = (source: CourseWithSchedules[]): ExportableCourse[] =>
        source.map((c) => ({
            name: c.name,
            registerCapacity: `${c.registerCount}`,
            startDate: new Date(c.startDate).toLocaleDateString("es-PE", { timeZone: "UTC" }),
            endDate: new Date(c.endDate).toLocaleDateString("es-PE", { timeZone: "UTC" }),
            courseType: c.courseType,
            schedulesCount: c.schedules.length,
            pricesCount: c.prices.length,
        }));
    return (
        <div className="flex flex-col gap-8 w-full items-center">
            {/* -----------------------------------
          Sección: Selección de Espacio
      ----------------------------------- */}
            <Card className="w-full bg-white rounded-2xl overflow-hidden card-custom border-0 dark:text-[var(--primary)]">
                <CardHeader className="pb-0">
                    <CardTitle className="text-2xl font-bold text-[#222222] dark:text-[var(--primary)]">
                        Selección de Academia
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 md:gap-x-20 gap-y-5 w-full justify-center items-center">
                        <div className="flex flex-col gap-y-5 w-full">
                            <div>
                                <Label className="font-semibold text-base">Academia</Label>
                                <Select
                                    value={AcademyName}
                                    onValueChange={(val) => {

                                        const selected = dataAcademias.find((a) => a.name === val);
                                        if (selected) {
                                            setAcademyId(selected.id);
                                            setAcademyName(selected.name);
                                        }

                                    }}                                >
                                    <SelectTrigger className="h-10 w-full bg-white rounded-lg border border-[#cccccc] px-2">
                                        <SelectValue placeholder="Seleccionar Academia" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {dataAcademias
                                            .map((sp) => (
                                                <SelectItem key={sp.id} value={sp.name}>
                                                    {sp.name}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Vista previa de imagen*/}
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
            {AcademyName && selectedAcademyInfo && (
                <>
                    <Card className="w-full bg-[var(--brand)] md:w-1/2 rounded-2xl overflow-hidden text-white card-custom border-0">
                        <CardHeader className="pb-0">
                            <CardTitle className="text-2xl font-bold text-white">
                                Información de la Academia Elegida
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col gap-y-3">
                                <div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 md:gap-x-20 gap-y-3 md:gap-y-5 w-full">
                                        {/* Referencia */}
                                        <div className="flex flex-col gap-y-1">
                                            <Label className="font-semibold text-base">Deporte</Label>
                                            <Input
                                                value={selectedAcademyInfo.sport}
                                                disabled
                                                className="h-10 bg-[#efefef] rounded-lg p-2 text-[12.8px]  text-black leading-[15px] border border-[#cccccc] resize-none overflow-auto dark:text-[var(--primary)] dark:bg-[var(--color-gray-700)]"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex flex-col gap-y-1">
                                        <Label className="font-semibold text-base">Descripción</Label>
                                        <Textarea
                                            value={selectedAcademyInfo.description}
                                            disabled
                                            maxLength={200}
                                            className="h-28 bg-[#efefef] rounded-lg p-2 text-[12.8px]  text-black leading-[15px] border border-[#cccccc] resize-none overflow-auto dark:text-[var(--primary)] dark:bg-[var(--color-gray-700)]"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="w-full bg-white rounded-2xl overflow-hidden card-custom border-0 dark:text-[var(--primary)]">
                        <CardHeader className="w-full flex items-center justify-between">
                            <CardTitle className="text-2xl font-bold text-[#222222] dark:text-[var(--primary)]">
                                Editar Cursos
                            </CardTitle>
                            <Button className="h-full text-white font-bold rounded-lg border-0 button3-custom flex items-center"
                                onClick={() => {
                                    // 👉 cambia `courses` a `pagedCourses` si solo quieres la página actual
                                    const exportData = buildExportData(courses);
                                    exportTableToExcel(
                                        exportData,
                                        exportColumns,
                                        `Cursos ${AcademyName || "Academia"}.xlsx`
                                    );
                                }}>
                                <Download className="mr-2 h-4 w-4" />
                                Exportar
                            </Button>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-y-5">

                            {/* Tabla que lista los cursos agregados */}


                            {cargandoCursos && (
                                <div className="text-center py-20">Cargando cursos...</div>
                            )}

                            {courses.length > 0 && (
                                <>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="text-[var(--brand)] font-semibold">Nombre-Horario</TableHead>
                                                <TableHead className="text-center text-[var(--brand)] font-semibold">Inscritos</TableHead>
                                                <TableHead className="text-center text-[var(--brand)] font-semibold">Inicio</TableHead>
                                                <TableHead className="text-center text-[var(--brand)] font-semibold">Fin</TableHead>
                                                <TableHead className="text-center text-[var(--brand)] font-semibold">Tipo</TableHead>
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
                                                const realName = curso.name
                                                return (
                                                    <TableRow key={realIndex}>
                                                        <TableCell >{curso.name}</TableCell>
                                                        <TableCell className="text-center">
                                                            <Badge className="bg-[#318161] dark:text-white" >  {(curso.registerCount ?? 0)}</Badge>
                                                        </TableCell>
                                                        <TableCell className="text-center">{new Date(curso.startDate).toLocaleDateString("es-PE", { timeZone: "UTC" })}</TableCell>
                                                        <TableCell className="text-center">{new Date(curso.endDate).toLocaleDateString("es-PE", { timeZone: "UTC" })} </TableCell>
                                                        <TableCell className="text-center">{curso.courseType}</TableCell>
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
                                                                disabled={mutation.isPending}
                                                                className="bg-[var(--brand)] text-white font-bold rounded-lg border-0 button3-custom mr-2"
                                                                onClick={() => openEditCourseModal(realIndex)}
                                                            >
                                                                Editar
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                type="button"
                                                                disabled={mutation.isPending}
                                                                className="text-white bg-red-500 hover:bg-red-600 font-bold border-0 rounded-lg shadow-[0_0_5px_0px_rgba(0,0,0,0)] shadow-gray-400"
                                                                onClick={() => handleRemoveCourse(realIndex, realName)}
                                                            >
                                                                Eliminar
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

                            {/* Botón de “Agregar curso” (abre modal) */}
                            <div className="flex justify-start ">
                                <Button
                                    type="button"
                                    className="bg-[var(--brand)] text-white font-bold rounded-lg border-0 button3-custom"
                                    onClick={openCreateCourseModal}
                                >
                                    + Agregar Curso
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                </>
            )}

            {showCourseModal && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 overflow-y-auto flex justify-center items-start py-10"
                >
                    <CreateCourseModal
                        onClose={closeCourseModal}
                        academyId={AcademyId}
                        initialData={editingIndex !== null ? courses[editingIndex] : undefined}
                        onSave={(fullData) => {
                            handleSaveCourse(fullData);
                            closeCourseModal();
                        }}
                    />
                </div>
            )}
        </div>
    );
}
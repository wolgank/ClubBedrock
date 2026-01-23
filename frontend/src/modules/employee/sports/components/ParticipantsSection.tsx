import * as React from "react"


import { ArrowUpDown, } from "lucide-react"
import {
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table"
import {
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronsLeftIcon,
    ChevronsRightIcon,
} from "lucide-react"
import { z } from "zod"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useNavigate } from 'react-router-dom';
import { Download } from "lucide-react"
import { AcademyFormValues, AcademySchema } from "../components/AcademyFormSection";
import { useQuery } from "@tanstack/react-query";
import { getAcademyInscriptionById } from "@/lib/api/apiAcademy"
import { exportTableToExcel, MyColumnDef } from "@/shared/utils/export"
import CourseSchedule from "../../../member/academy/pages/academy-inscription/components/CourseSchedule";
import { AcademyCourse, CourseTimeSlot } from "@/shared/types/Activities";

interface Props {
    academy: AcademyFormValues;
    onRequestDeleteReservation: (id: number, name: string, curso: string, correo: string) => void;
    idAcademy?: number;
}


export type AcademyItem = z.infer<typeof AcademySchema>

export const participantSchema = z.object({
    id: z.number(),
    nombre: z.string(),
    curso: z.string(),
    esSocio: z.boolean(),
    correo: z.string().optional()
})

type participantsItem = z.infer<typeof participantSchema>
export type InscriptionEVent = {
    academyInscriptionId: number;
    name: string;
    lastname: string;
    courseName: string;
    correo: string;
}


const rawParticipants = [
    { id: 1, nombre: "Juan Pérez", curso: "Taekwondo Infantil Básico", esSocio: true },
    { id: 2, nombre: "María Ramírez", curso: "Taekwondo Infantil Básico", esSocio: false },
    { id: 3, nombre: "Carlos López", curso: "Taekwondo Adultos Avanzado", esSocio: true },
    { id: 4, nombre: "Lucía Fernández", curso: "Taekwondo Adultos Avanzado", esSocio: false },
    { id: 5, nombre: "Pedro Gómez", curso: "Taekwondo Infantil Básico", esSocio: true },
    { id: 6, nombre: "Ana Torres", curso: "Taekwondo Adultos Avanzado", esSocio: true },
    { id: 7, nombre: "Diego Castillo", curso: "Taekwondo Infantil Básico", esSocio: false },
    { id: 8, nombre: "Carmen Sánchez", curso: "Taekwondo Adultos Avanzado", esSocio: false },
    { id: 9, nombre: "Miguel Herrera", curso: "Taekwondo Infantil Básico", esSocio: true },
    { id: 10, nombre: "Isabel Peña", curso: "Taekwondo Adultos Avanzado", esSocio: false },
    { id: 11, nombre: "José Aguilar", curso: "Taekwondo Infantil Básico", esSocio: true },
    { id: 12, nombre: "Verónica Navarro", curso: "Taekwondo Adultos Avanzado", esSocio: true },
    { id: 13, nombre: "Raúl Mendoza", curso: "Taekwondo Infantil Básico", esSocio: false },
    { id: 14, nombre: "Gloria Rojas", curso: "Taekwondo Adultos Avanzado", esSocio: false },
    { id: 15, nombre: "Alberto Muñoz", curso: "Taekwondo Infantil Básico", esSocio: true },
    { id: 16, nombre: "Patricia Varela", curso: "Taekwondo Adultos Avanzado", esSocio: true },
    { id: 17, nombre: "Sergio Herrera", curso: "Taekwondo Infantil Básico", esSocio: false },
    { id: 18, nombre: "Yolanda Castro", curso: "Taekwondo Adultos Avanzado", esSocio: false },
    { id: 19, nombre: "Ricardo Molina", curso: "Taekwondo Infantil Básico", esSocio: true },
    { id: 20, nombre: "Elena Miranda", curso: "Taekwondo Adultos Avanzado", esSocio: true },
    { id: 21, nombre: "Fernando Silva", curso: "Taekwondo Infantil Básico", esSocio: false },
    { id: 22, nombre: "Marisol Paredes", curso: "Taekwondo Adultos Avanzado", esSocio: false },
    { id: 23, nombre: "Óscar Velasco", curso: "Taekwondo Infantil Básico", esSocio: true },
    { id: 24, nombre: "Andrea Lozano", curso: "Taekwondo Adultos Avanzado", esSocio: true },
    { id: 25, nombre: "Eduardo Rivas", curso: "Taekwondo Infantil Básico", esSocio: false },
    { id: 26, nombre: "Marta Gil", curso: "Taekwondo Adultos Avanzado", esSocio: false },
    { id: 27, nombre: "Javier Cortés", curso: "Taekwondo Infantil Básico", esSocio: true },
    { id: 28, nombre: "Sandra Cabrera", curso: "Taekwondo Adultos Avanzado", esSocio: true },
    { id: 29, nombre: "Héctor Espinoza", curso: "Taekwondo Infantil Básico", esSocio: false },
    { id: 30, nombre: "Lorena Valdez", curso: "Taekwondo Adultos Avanzado", esSocio: false },
] as const

// Parse and validate hardcoded data
const dataParticipants: participantsItem[] = rawParticipants.map(item => participantSchema.parse(item))

// DataTable component
export default function DataTable({ academy, idAcademy, onRequestDeleteReservation }: Props) {
    // Table states
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})

    const { error: errorTimeSlot, data } = useQuery({
        queryKey: ['get-academy-inscriptions', idAcademy],
        queryFn: () => getAcademyInscriptionById(idAcademy.toString()),
        enabled: !!idAcademy,
    });

    const dataReserv: participantsItem[] = React.useMemo(() => {
        return (
            data?.map((item: InscriptionEVent) => ({
                id: item.academyInscriptionId,
                nombre: `${item.name} ${item.lastname}`,
                curso: item.courseName,
                esSocio: false, // Asumiendo que todos son socios por defecto
                correo: item.correo
            })) ?? []
        );
    }, [data]);

    // Columns configuration
    const columns: MyColumnDef<participantsItem>[] = [

        {
            accessorKey: "nombre",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="text-[var(--brand)] font-semibold"
                    >
                        Nombre
                        <ArrowUpDown />
                    </Button>
                )
            },
            headerText: "Nombre",
            cell: ({ row }) => (
                <div className="text-left pl-3 ">
                    <span>
                        {row.getValue("nombre")}
                    </span>
                </div>
            )
        },

        {
            accessorKey: "curso",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="text-[var(--brand)] font-semibold"
                    >
                        Curso
                        <ArrowUpDown />
                    </Button>
                )
            },
            headerText: "Curso",
            cell: ({ row }) => (
                <div className="text-left pl-3 ">
                    <span>
                        {row.getValue("curso").toString().split('-')[0]}
                    </span>
                </div>
            )
        },
        {
            accessorKey: "horario",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="text-[var(--brand)] font-semibold"
                    >
                        Horario
                        <ArrowUpDown />
                    </Button>
                )
            },
            headerText: "Horario",
            cell: ({ row }) => (
                <div className="text-left pl-3 ">
                    <span>
                        {row.getValue("curso").toString().split('-')[1]}
                    </span>
                </div>
            )
        },
        // {
        //     accessorKey: "timeSlotsSelected",
        //     header: () => <div className="text-[var(--brand)] font-semibold pl-3 text-center">Dias inscritos</div>,
        //     cell: ({ row }) => {

        //         const sampleSchedule: CourseTimeSlot[] = [
        //             { day: 'MONDAY', startTime: '10:00', endTime: '11:00' },
        //             { day: 'WEDNESDAY', startTime: '10:00', endTime: '11:00' },
        //             { day: 'FRIDAY', startTime: '10:00', endTime: '11:00' },
        //         ];

        //         const sampleCourse: AcademyCourse = {
        //             id: 1,
        //             name: "CURSO DE NATACIÓN",
        //             courseType: 'FLEXIBLE',
        //             schedule: sampleSchedule,
        //             academyId: 10,
        //             startDate: '2025-01-01',
        //             endDate: '2025-12-31',
        //             capacity: 20,
        //             description: 'Descripción de prueba',
        //             allowOutsiders: true,
        //             isActive: true,
        //             pricing: [],
        //             registerCount: 5,
        //             urlImage: ''
        //         };

        //         const sampleTimeSlotsSelected: CourseTimeSlot[] = [
        //             sampleSchedule[0], // Lunes
        //             sampleSchedule[2]  // Viernes
        //         ];

        //         return (
        //             <div className="pl-3">
        //                 <CourseSchedule
        //                     course={sampleCourse}
        //                     timeSlotsSelected={sampleTimeSlotsSelected}
        //                 />
        //             </div>
        //         )
        //     }
        // },
        {
            accessorKey: "esSocio",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="text-[var(--brand)] font-semibold"
                    >
                        Socio
                        <ArrowUpDown />
                    </Button>
                )
            },
            headerText: "Socio",
            cell: ({ row }) => (
                <div className="text-left pl-8">
                    <span>
                        {row.original.esSocio ? "No" : "Sí"}
                    </span>
                </div>
            ),
            sortingFn: (rowA, rowB, columnId) => {
                // convertimos booleanos a 1/0 para poder restarlos
                const a = rowA.getValue<boolean>(columnId) ? 1 : 0;
                const b = rowB.getValue<boolean>(columnId) ? 1 : 0;
                return a - b;
            },
        },
        {
            id: "acciones",
            cell: ({ row }) => (
                <div className="flex gap-2">
                    <Button size="sm" className="button3-custom text-white" onClick={() => onRequestDeleteReservation(row.original.id, row.original.nombre, row.original.curso, row.original.correo)}>
                        Eliminar
                    </Button>
                </div>
            ),
        },
    ]
    const dataReservMemo = React.useMemo(() => dataReserv, [dataReserv]);

    const table = useReactTable({
        data: dataReservMemo,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
        },
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    })
    const navigate = useNavigate();


    return (
        <div className="w-full ">
            <div className="w-full flex items-center justify-between ">
                <Input
                    placeholder="Filtrar por nombre..."
                    value={(table.getColumn("nombre")?.getFilterValue() as string) ?? ""}
                    onChange={(event) =>
                        table.getColumn("nombre")?.setFilterValue(event.target.value)
                    }
                    className="max-w-sm"
                />
                <Button className="h-full text-white font-bold rounded-lg border-0 button3-custom flex items-center"
                    onClick={() =>
                        exportTableToExcel(
                            dataReservMemo.map((item) => ({
                                ...item,
                                esSocio: !item.esSocio,
                                curso: item.curso?.split("-")[0]?.trim() ?? "No disponible", // ← aquí el valor por defecto
                                horario: item.curso?.split("-")[1]?.trim() ?? "No disponible", // ← aquí el valor por defecto
                            })),
                            columns,
                            "Academias Lista de Inscritos - " + academy.name + ".xlsx"
                        )
                    }>
                    <Download className="mr-2 h-4 w-4" />
                    Exportar
                </Button>
            </div>
            <div className="overflow-auto rounded-lg py-10">
                <Table>
                    <TableHeader >
                        {table.getHeaderGroups().map(headerGroup => (
                            <TableRow key={headerGroup.id}  >
                                {headerGroup.headers.map(header => (
                                    <TableHead key={header.id}>{flexRender(
                                        header.column.columnDef.header,
                                        header.getContext()
                                    )}</TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody >
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map(row => (
                                <TableRow key={row.id}>
                                    {row.getVisibleCells().map(cell => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))

                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    No se encontraron resultados.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex items-center  px-4 justify-end">
                <div className="flex w-full items-center gap-8 lg:w-fit">
                    <div className="hidden items-center gap-2 lg:flex">
                        <Label htmlFor="rows-per-page" className="text-sm font-medium">
                            Filas por página
                        </Label>
                        <Select
                            value={`${table.getState().pagination.pageSize}`}
                            onValueChange={(value) => {
                                table.setPageSize(Number(value))
                            }}
                        >
                            <SelectTrigger className="w-20" id="rows-per-page">
                                <SelectValue
                                    placeholder={table.getState().pagination.pageSize}
                                />
                            </SelectTrigger>
                            <SelectContent side="top">
                                {[10, 20, 30].map((pageSize) => (
                                    <SelectItem key={pageSize} value={`${pageSize}`}>
                                        {pageSize}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex w-fit items-center justify-center text-sm font-medium">
                        Página {table.getState().pagination.pageIndex + 1} de{" "}
                        {table.getPageCount()}
                    </div>
                    <div className="ml-auto flex items-center gap-2 lg:ml-0">
                        <Button
                            variant="outline"
                            className="hidden h-8 w-8 p-0 lg:flex "
                            onClick={() => table.setPageIndex(0)}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <span className="sr-only">Ir a la primera página</span>
                            <ChevronsLeftIcon />
                        </Button>
                        <Button
                            variant="outline"
                            className="size-8 "
                            size="icon"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <span className="sr-only">Ir a la página anterior</span>
                            <ChevronLeftIcon />
                        </Button>
                        <Button
                            variant="outline"
                            className="size-8 "
                            size="icon"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            <span className="sr-only">Ir a la página siguiente</span>
                            <ChevronRightIcon />
                        </Button>
                        <Button
                            variant="outline"
                            className="hidden size-8 lg:flex"
                            size="icon"
                            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                            disabled={!table.getCanNextPage()}
                        >
                            <span className="sr-only">Ir a la última página</span>
                            <ChevronsRightIcon />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
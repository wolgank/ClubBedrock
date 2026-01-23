/* eslint-disable react-refresh/only-export-components */
import * as React from "react"


import { ArrowUpDown, CalendarIcon } from "lucide-react"
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
import { es } from "date-fns/locale";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO } from "date-fns";
import {
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronsLeftIcon,
    ChevronsRightIcon,
} from "lucide-react"
import { z } from "zod"
import { DateRange } from "react-day-picker"
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
import { useQuery } from "@tanstack/react-query";
import { getEventSpace, deleteEvent } from "@/lib/api/apiEvent"
import { Download } from "lucide-react"
import { exportTableToExcel, MyColumnDef } from "@/shared/utils/export"
import {
    AlertDialog,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Trash2 as TrashIcon } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
// Schema definition
export const schema = z.object({
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
    numberOfAssistans: z.number()
})

type EventItem = z.infer<typeof schema>

import { toast } from "sonner"

export type EventoSpace = {
    id: number,
    name: string,
    date: string,
    startHour: string,
    endHour: string,
    spaceUsed: string,
    ticketPriceMember: number,
    ticketPriceGuest: number,
    capacity: number,
    urlImage: string,
    isActive: boolean,
    description: string,
    allowOutsiders: boolean,
    numberOfAssistants: number,
    reservationId: number,
    spaceName: string,
    spaceId: number,
    registerCount: number
}



// DataTable component
export default function DataTable() {
    const queryClient = useQueryClient();

    const { data: dataEvento } = useQuery({
        queryKey: ['get-Event-Space'],
        queryFn: getEventSpace,
    });


    const dataEvent = React.useMemo(() => {
        if (!Array.isArray(dataEvento)) return [];
        return dataEvento.map(evento => ({
            id: evento.id,
            name: evento.name,
            date: evento.date.split("T")[0],
            spaceUsed: evento.spaceName,
            capacity: evento.capacity,
            allowOutsiders: evento.allowOutsiders,
            startHour: evento.startHour,
            endHour: evento.endHour,
            ticketPriceMember: evento.ticketPriceMember,
            ticketPriceGuest: evento.ticketPriceGuest,
            description: evento.description,
            numberOfAssistans: evento.registerCount,
        }));
    }, [dataEvento]);


    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
        []
    )
    const [columnVisibility, setColumnVisibility] =
        React.useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = React.useState({})
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>(
        undefined
    );





















    const deleteMutation = useMutation({
        mutationFn: deleteEvent,

        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['get-Event-Space'] });

            toast.success(
                <>
                    <strong>
                        Evento eliminado correctamente.</strong>
                </>
            );

        },
        onError: (error: any) => {
            console.error("Error al eliminar evento:", error);
            toast.error(
                <>
                    <strong>Error al eliminar evento.</strong>
                    <div>{error?.message || "Error desconocido"}</div>
                </>
            );
        },
    });







































    // Columns configuration
    const columns: MyColumnDef<EventItem>[] = [

        {
            accessorKey: "name",
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
                        {row.getValue("name")}
                    </span>
                </div>
            )
        },
        {
            accessorKey: "date",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="text-[var(--brand)] font-semibold"
                    >
                        Fecha
                        <ArrowUpDown />
                    </Button>
                )
            },
            headerText: "Fecha",
            filterFn: (row, columnId, filterValue: DateRange) => {
                if (!filterValue?.from) {
                    return true; // No hay filtro, muestra todo
                }

                const rowDateStr = row.getValue(columnId) as string;
                const rowDate = new Date(rowDateStr + "T00:00:00");

                // --- INICIO DE LA CORRECCIÓN ---

                // 1. Crea una NUEVA fecha para el inicio y la normaliza a las 00:00
                const startDate = new Date(filterValue.from);
                startDate.setHours(0, 0, 0, 0);

                // 2. Crea una NUEVA fecha para el fin. Usa la fecha 'to' si existe, si no, usa 'from'.
                const endDate = new Date(filterValue.to || filterValue.from);
                endDate.setHours(23, 59, 59, 999); // La normaliza al final del día.

                // --- FIN DE LA CORRECCIÓN ---

                // Ahora la comparación funciona para rangos y días únicos
                return rowDate >= startDate && rowDate <= endDate;
            },
            cell: ({ row }) => {
                // ...tu código de 'cell' no necesita cambios...
                const dateString = row.getValue("date") as string;
                // Se suma T00:00:00 para asegurar que se interprete en la zona horaria local correcta
                const dateObj = new Date(dateString + "T00:00:00");
                return (
                    <div className="text-left pl-1">
                        <span>{format(dateObj, "dd/MM/yyyy")}</span>
                    </div>
                );
            }
        },
        {
            accessorKey: "spaceUsed",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="text-[var(--brand)] font-semibold"
                    >
                        Espacio
                        <ArrowUpDown />
                    </Button>
                )
            },
            headerText: "Espacio",
            cell: ({ row }) => (
                <div className="text-left pl-3">
                    <span>
                        {row.original.spaceUsed}
                    </span>
                </div>

            )
        },
        {
            accessorKey: "capacity",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="text-[var(--brand)] font-semibold"
                    >
                        Inscritos/Capacidad
                        <ArrowUpDown />
                    </Button>
                )
            },
            headerText: "Inscritos/Capacidad",
            cell: ({ row }) => (
                <div className="text-center pr-17">
                    <Badge className="bg-[#318161] dark:text-white">{row.original.numberOfAssistans + "/" + row.getValue("capacity")}</Badge>
                </div>
            )
        },
        {
            accessorKey: "allowOutsiders",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="text-[var(--brand)] font-semibold"
                    >
                        Solo Socios
                        <ArrowUpDown />
                    </Button>
                )
            },
            headerText: "Solo Socios",
            cell: ({ row }) => (
                <div className="text-left pl-12">
                    <span>
                        {row.original.allowOutsiders ? "No" : "Sí"}
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
            accessorKey: "acciones",
            header: ({ }) => {
                return (
                    <Label className="text-[var(--brand)] font-semibold pl-6">
                        Acciones
                    </Label>
                )
            },
            headerText: "Acciones",
            cell: ({ row }) => (
                <div className="flex gap-2 items-center ">
                    <Button size="sm" className="button3-custom text-white" onClick={() => {
                        window.location.href = `/employee-event/eventos/${row.original.id}`;
                    }} >
                        Ver más
                    </Button>
                    {/* Dialogo de confirmación para eliminar */}
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button size="icon" disabled={deleteMutation.isPending} className="text-white bg-red-500 hover:bg-red-600 font-bold border-0 rounded-lg shadow-[0_0_5px_0px_rgba(0,0,0,0)] shadow-gray-400">
                                <TrashIcon />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="background-custom">
                            <AlertDialogHeader>
                                <AlertDialogTitle>Eliminar Evento</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta acción no se puede deshacer. ¿Seguro que quieres eliminar <span className="font-bold">{row.original.name}</span>?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className="text-white hover:text-white rounded-lg border-0 font-bold  button4-custom">Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                    className="bg-[var(--brand)] text-white font-bold rounded-lg border-0 button3-custom"
                                    onClick={() => deleteMutation.mutate(row.original.id.toString())}
                                >
                                    Eliminar
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            ),
        },
    ]

    const table = useReactTable({
        data: dataEvent,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
    })
    const navigate = useNavigate();
    React.useEffect(() => {
        // Cuando dateRange cambia, se lo pasamos como filtro a la columna 'date'
        table.getColumn("date")?.setFilterValue(dateRange);
    }, [dateRange, table]);

    return (
        <div className="w-full ">
            <div className="w-full flex items-center justify-between ">
                <div className="w-full flex items-center gap-4">
                    <Input
                        placeholder="Filtrar por nombre..."
                        value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                        onChange={(event) =>
                            table.getColumn("name")?.setFilterValue(event.target.value)
                        }
                        className="max-w-sm"
                    />
                    <div className="flex items-center gap-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full bg-transparent flex items-center gap-4 ">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateRange?.from ? (
                                        dateRange.to ? (
                                            <>
                                                {format(dateRange.from, "dd/MM/yy")} - {format(dateRange.to, "dd/MM/yy")}
                                            </>
                                        ) : (
                                            format(dateRange.from, "dd/MM/yyyy")
                                        )
                                    ) : (
                                        <span>Filtrar por rango de fechas</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="range" // 👈 MODO RANGO
                                    selected={dateRange}
                                    onSelect={setDateRange}
                                    locale={es}
                                />
                            </PopoverContent>
                        </Popover>
                        {dateRange && (
                            <Button className="h-full text-white font-bold rounded-lg border-0 button3-custom flex items-center" onClick={() => setDateRange(undefined)}>
                                Limpiar
                            </Button>
                        )}
                    </div>
                </div>

                <Button
                    className="h-full text-white font-bold rounded-lg border-0 button3-custom flex items-center"
                    onClick={() => exportTableToExcel(dataEvent, columns, "eventos.xlsx")}
                >
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
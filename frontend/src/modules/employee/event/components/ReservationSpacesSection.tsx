import * as React from "react"

import { useQuery } from "@tanstack/react-query"
import { getReservationsBySpaceId } from "@/lib/api/apiSpace"
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
import { DateRange } from "react-day-picker";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronsLeftIcon,
    ChevronsRightIcon,
} from "lucide-react"
import { z } from "zod"
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
import { format, parseISO } from "date-fns";
import { exportTableToExcel, MyColumnDef } from "@/shared/utils/export"


// Schema definition
export const reservationSchema = z.object({
    id: z.number(),
    name: z.string(),
    date: z.date(),
    startHour: z.string(),  // formato "HH:MM"
    endHour: z.string(),  // formato "HH:MM"
    capacity: z.number(),
    allowOutsiders: z.boolean(),
    description: z.string(),
    correo: z.string().optional(), // correo es opcional
});

export type reservationItem = z.infer<typeof reservationSchema>

export type ReservationInfo = {
    id: number;
    name: string;
    lastname: string;
    startHour: string;  // ISO date string, p.ej. "2025-05-30T20:00:00.000Z"
    endHour: string;    // ISO date string
    isCancelled: boolean;
    correo: string
};



export const spaceSchema = z.object({
    id: z.number(),
    name: z.string(),
    description: z.string(),
    reference: z.string(),
    capacity: z.number(),
    costPerHour: z.string(),
    canBeReserved: z.boolean(),
    isAvailable: z.boolean(),
    type: z.enum(["SPORTS", "LEISURE"]),
})

type spaceItem = z.infer<typeof spaceSchema>

interface Props {
    space: spaceItem
    onRequestDeleteReservation: (id: number, name: string, espacio: string, correo: string) => void;
}



// DataTable component
export default function DataTable({ space, onRequestDeleteReservation }: Props) {
    // Table states
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);
    const { error: errorTimeSlot, data } = useQuery({
        queryKey: ['get-space-reservations', space.id],
        queryFn: () => getReservationsBySpaceId(space.id.toString()),
        enabled: !!space.id,
    });


    const dataReserv: reservationItem[] = React.useMemo(() => {
        return (
            data?.map((item: ReservationInfo) => ({
                id: item.id,
                name: `${item.name} ${item.lastname}`,
                date: new Date(new Date(item.startHour).getTime() + 5 * 60 * 60 * 1000),
                startHour: item.startHour.slice(11, 16),
                endHour: item.endHour.slice(11, 16),
                capacity: 0,
                allowOutsiders: item.isCancelled,
                description: "no hay descripcion",
                correo: item.correo,
            })) ?? []
        );
    }, [data]);

    // Columns configuration
    const allColumns: MyColumnDef<reservationItem>[] = [
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

                const rowDate = row.getValue(columnId) as Date; // Ya es un objeto Date

                // --- Lógica para el rango ---

                const startDate = new Date(filterValue.from);
                startDate.setHours(0, 0, 0, 0);

                const endDate = new Date(filterValue.to || filterValue.from);
                endDate.setHours(23, 59, 59, 999);

                // Devuelve true si la fecha de la fila está dentro del rango
                return rowDate >= startDate && rowDate <= endDate;
            },
            cell: ({ row }) => {
                // row.getValue("date") puede ser Date o ISO string, lo convertimos a Date
                const raw = row.getValue<unknown>("date");
                const dateObj = raw instanceof Date
                    ? raw
                    : parseISO(String(raw));
                return (
                    <div className="text-left pl-1">
                        <span>{format(dateObj, "dd/MM/yyyy")}</span>
                    </div>
                );
            }
        },
        {
            accessorKey: "startHour",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="text-[var(--brand)] font-semibold"
                    >
                        Hora Inicio
                        <ArrowUpDown />
                    </Button>
                )
            },
            headerText: "Hora Inicio",
            cell: ({ row }) => (
                <div className="text-left pl-10">
                    <span>
                        {row.getValue("startHour")}
                    </span>
                </div>

            )
        },
        {
            accessorKey: "endHour",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="text-[var(--brand)] font-semibold"
                    >
                        Hora Fin
                        <ArrowUpDown />
                    </Button>
                )
            },
            headerText: "Hora Fin",
            cell: ({ row }) => (
                <div className="text-left pl-10">
                    <span>{row.getValue("endHour")}</span>
                </div>
            )
        },
        {
            id: "acciones",
            cell: ({ row }) => (
                <div className="flex gap-2">
                    <Button size="sm" className="button3-custom text-white" onClick={() => onRequestDeleteReservation(row.original.id, row.original.name, space.name, row.original.correo)}>
                        Eliminar
                    </Button>
                </div>
            ),
        },
    ]
    const columns = React.useMemo(() => {
        return allColumns;
    }, [space.type]);

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

    React.useEffect(() => {
        // Pasa el objeto de rango de fechas como valor de filtro
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
                                <Button variant="outline" className="w-[300px] justify-start text-left font-normal border-gray-300 bg-white">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {/* Lógica para mostrar el rango seleccionado */}
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
                                    mode="range"
                                    selected={dateRange}
                                    onSelect={setDateRange}
                                    locale={es}
                                />
                            </PopoverContent>
                        </Popover>
                        {/* Botón para limpiar el filtro de rango de fecha */}
                        {dateRange && (
                            <Button className="h-full text-white font-bold rounded-lg border-0 button3-custom flex items-center" onClick={() => setDateRange(undefined)}>
                                Limpiar
                            </Button>
                        )}
                    </div>
                </div>
                <Button className="h-full text-white font-bold rounded-lg border-0 button3-custom flex items-center"
                    onClick={() => exportTableToExcel(dataReservMemo, columns, "Reservas Space.xlsx")}>
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
import * as React from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query";

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
import { getAllInscription } from "@/lib/api/apiEvent"
import { Download } from "lucide-react"
import { exportTableToExcel, MyColumnDef } from "@/shared/utils/export"
//--------------------------data Personas--------------------------
// Schema definition
export const schema = z.object({
    id: z.number(),
    name: z.string(),
    dni: z.string(),
    sociosInscritos: z.number(),
    externosInscritos: z.number(),
    dateInscripcion: z.string(),
    correo: z.string().optional(),
})

import { useQuery } from "@tanstack/react-query"
type EventItem = z.infer<typeof schema>

type FilaInscripcion = {
    id: number;
    name: string;
    dni: string;
    sociosInscritos: number;
    externosInscritos: number;
    dateInscripcion: string;
};

//--------------------------data Evento--------------------------
// Schema definition
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
})
type EventItem2 = z.infer<typeof schema2>

interface Props {
    evento: EventItem2
    onRequestDeleteParticipant: (id: number, name: string, eve: string, correo: string) => void;
}

//--------------------------data Fin--------------------------
// DataTable component


export type MiembrosInscritos = {
    eventInscriptionId: number,
    nombre: string,
    apellido: string,
    fechaPago: string
    dni: string,
    correo: string,
}



const DataTable = ({ evento, onRequestDeleteParticipant }: Props) => {
    const { data: dataInscriptions } = useQuery({
        queryKey: ['get-all-inscriptions', evento?.id],
        queryFn: () => getAllInscription(evento!.id.toString()),
        enabled: !!evento?.id, // Se hizo el cambio, para que exista un evento.id
    });
    // EventInscription -> InscriptionXUser => nombe, apellido, idEventInscription, 
    // Bill -> fechaInscripcion

    const filasInscripcion = React.useMemo(() => {
        return dataInscriptions?.map((item: MiembrosInscritos) => ({
            id: item.eventInscriptionId,
            name: `${item.nombre} ${item.apellido}`,
            dni: item.dni,
            sociosInscritos: 1,
            externosInscritos: 0,
            dateInscripcion: (() => {
      const fecha = new Date(new Date(item.fechaPago).getTime() - 5 * 60 * 60 * 1000);
      const dia = String(fecha.getDate()).padStart(2, '0');
      const mes = String(fecha.getMonth() + 1).padStart(2, '0');
      const anio = fecha.getFullYear();
      return `${dia}/${mes}/${anio}`;
    })(),
            correo: item.correo
        })) ?? [];
    }, [dataInscriptions]);

    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
        []
    )
    const [columnVisibility, setColumnVisibility] =
        React.useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = React.useState({})
    // Columns configuration
    const allColumns: MyColumnDef<EventItem>[] = [

        {
            id: "name",
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
            id: "dni",
            accessorKey: "dni",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="text-[var(--brand)] font-semibold"
                    >
                        DNI
                        <ArrowUpDown />
                    </Button>
                )
            },
            headerText: "DNI",
            cell: ({ row }) => (
                <div className="text-left pl-3">
                    <span>
                        {row.getValue("dni")}
                    </span>
                </div>
            )
        },
        /*
        {
            id: "sociosInscritos",
            accessorKey: "sociosInscritos",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="text-[var(--brand)] font-semibold"
                    >
                        Socios Inscritos
                        <ArrowUpDown />
                    </Button>
                )
            },
            headerText: "Socios Inscritos",
            cell: ({ row }) => (
                <div className="text-left pl-15">
                    <Badge className="bg-[#318161] dark:text-white">{row.getValue("sociosInscritos")}</Badge>
                </div>
            )
        },
        */
        {
            id: "correo",
            accessorKey: "correo",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="text-[var(--brand)] font-semibold"
                    >
                        Correo
                        <ArrowUpDown />
                    </Button>
                )
            },
            headerText: "Correo",
            cell: ({ row }) => (
                <div className="text-left pl-3">
                    <span>{row.getValue("correo")}</span>
                </div>
            )
        },
        {
            id: "dateInscripcion",
            accessorKey: "dateInscripcion",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="text-[var(--brand)] font-semibold"
                    >
                        Fecha Inscripcion
                        <ArrowUpDown />
                    </Button>
                )
            },
            headerText: "Fecha Inscripcion",
            cell: ({ row }) => (
                <div className="text-left pl-10">
                    <span>
                        {row.getValue("dateInscripcion")}
                    </span>
                </div>
            )
        },
        // {
        //     id: "correo",
        //     accessorKey: "correo",
        //     header: ({ column }) => {
        //         return (
        //             <Button
        //                 variant="ghost"
        //                 onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        //                 className="text-[var(--brand)] font-semibold"
        //             >
        //                 Correo
        //                 <ArrowUpDown />
        //             </Button>
        //         )
        //     },
        //     headerText: "Correo",
        //     cell: ({ row }) => (
        //         <div className="text-left pl-10">
        //             <span>
        //                 {row.getValue("correo")}
        //             </span>
        //         </div>
        //     )
        // },
        {
            id: "acciones",
            cell: ({ row }) => (
                <div className="flex gap-2">
                    <Button size="sm" className="button3-custom text-white" onClick={() => onRequestDeleteParticipant(row.original.id, row.original.name, evento.name, row.original.correo)}>
                        Eliminar
                    </Button>
                </div>
            ),
        },
    ]

    const columns = React.useMemo(() => {
        return allColumns
    }, [])



    // const columns = evento.allowOutsiders ? allColumns.filter(col => col.id !== "externosInscritos") : allColumns
    const table = useReactTable({
        data: filasInscripcion,
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


    return (
        <div className="w-full">
            <div className="w-full flex items-center justify-between ">
                <Input
                    placeholder="Filtrar por nombre..."
                    value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                    onChange={(event) =>
                        table.getColumn("name")?.setFilterValue(event.target.value)
                    }
                    className="max-w-sm"
                />
                <Button className="h-full text-white font-bold rounded-lg border-0 button3-custom flex items-center"
                    onClick={() => exportTableToExcel(filasInscripcion, columns, "Lista de participantes.xlsx")}>
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


const areEqual = (prevProps: Props, nextProps: Props) => {
    return prevProps.evento.id === nextProps.evento.id &&
        prevProps.evento.allowOutsiders === nextProps.evento.allowOutsiders;
};

export default React.memo(DataTable)

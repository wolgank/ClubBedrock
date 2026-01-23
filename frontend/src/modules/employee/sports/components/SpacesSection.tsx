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
import { useQuery } from "@tanstack/react-query"
import { getSpace, disableSpaceById, getSpaceSports } from "@/lib/api/apiSpace"
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
import { toast } from "sonner"

// Schema definition
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

export type SpaceItem = z.infer<typeof spaceSchema>

type rawSpace = {
    id: number;
    name: string;
    description: string;
    reference: string;
    capacity: number;
    costPerHour: number;
    canBeReserved: boolean;
    isAvailable: boolean;
    type: "SPORTS" | "LEISURE";
};

type Space = {
    id: number;
    name: string;
    description: string;
    reference: string;
    capacity: number;
    urlImage: string;
    costPerHour: number;
    canBeReserved: boolean;
    isAvailable: boolean;
    type: "SPORTS" | "LEISURE";
};

// Parse and validate hardcoded data
async function deleteSpace(id: number) {
    // Simulación de borrado
    //console.log(`[SIMULACIÓN] borrar espacio con id=${id}`);
    return Promise.resolve();
}

// DataTable component
export default function DataTable() {

    const queryClient = useQueryClient();

    // Table states
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
    // const deleteMutation = useMutation({
    //     mutationFn: (id: number) => deleteSpace(id),
    //     onSuccess: () => {
    //         // Aquí invalidarías la query real; 
    //         // mientras tanto sólo imprime
    //         //console.log("[SIMULACIÓN] Datos invalidados");
    //     },
    // });
    const deleteMutation = useMutation({
        mutationFn: disableSpaceById,

        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['get-Space-Sports'] });

            toast.success(
                <>
                    <strong>Espacio eliminado correctamente.</strong>
                </>
            );

        },
        onError: (error: any) => {
            console.error("Error al eliminar espacio:", error);
            toast.error(
                <>
                    <strong>Error al eliminar espacio.</strong>
                    <div>{error?.message || "Error desconocido"}</div>
                </>
            );
        },
    });





    const { isPending, error, data: dataSpace } = useQuery({
        queryKey: ['get-Space-Sports'],
        queryFn: getSpaceSports,
    });

    const rawSpaces = React.useMemo(() => {
        if (!Array.isArray(dataSpace)) return [];
        return dataSpace.map(space => ({
            id: space.id,
            name: space.name,
            description: space.description,
            reference: space.reference,
            capacity: space.capacity,
            costPerHour: space.costPerHour,
            canBeReserved: space.canBeReserved,
            isAvailable: space.isAvailable,
            type: space.type,
        }));
    }, [dataSpace]);

    const dataEvent = React.useMemo(() => {
        return rawSpaces
            .map(item => spaceSchema.safeParse(item))
            .filter(result => result.success)
            .map(result => result.data)
    }, [rawSpaces]);

    // Columns configuration
    const columns: MyColumnDef<SpaceItem>[] = [

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
            accessorKey: "reference",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="text-[var(--brand)] font-semibold"
                    >
                        Referencia
                        <ArrowUpDown />
                    </Button>
                )
            },
            headerText: "Referencia",
            cell: ({ row }) => (
                <div className="text-left pl-3">
                    <span>
                        {row.getValue("reference")}
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
                        Capacidad
                        <ArrowUpDown />
                    </Button>
                )
            },
            headerText: "Capacidad",
            cell: ({ row }) => (
                <div className="text-left pl-10">
                    <Badge className="bg-[#318161] dark:text-white">{row.getValue("capacity")}</Badge>
                </div>
            )
        },
        {
            accessorKey: "canBeReserved",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="text-[var(--brand)] font-semibold"
                    >
                        ¿Reservable?
                        <ArrowUpDown />
                    </Button>
                )
            },
            headerText: "¿Reservable?",
            cell: ({ row }) => (
                <div className="text-left pl-12">
                    <span>
                        {!row.original.canBeReserved ? "No" : "Sí"}
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
                    <Label className="text-[var(--brand)] font-semibold pl-1">
                        Acciones
                    </Label>
                )
            },
            headerText: "Acciones",
            cell: ({ row }) => (
                <div className="flex gap-2 items-center ">
                    <Button size="sm" className="button3-custom text-white" onClick={() => {
                        window.location.href = `/employee-sport/espacios/${row.original.id}`;
                    }}>
                        Ver más
                    </Button>

                </div>
            ),
        },
    ]

    const table = useReactTable({
        data: dataEvent,
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
                    value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                    onChange={(event) =>
                        table.getColumn("name")?.setFilterValue(event.target.value)
                    }
                    className="max-w-sm"
                />
                <Button className="h-full text-white font-bold rounded-lg border-0 button3-custom flex items-center"
                    onClick={() => exportTableToExcel(dataEvent, columns, "Espacios Deportivos.xlsx")}>
                    <Download className="mr-2 h-4 w-4" />
                    Exportar
                </Button>
            </div>
            <div className="overflow-x-auto rounded-lg py-10">
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
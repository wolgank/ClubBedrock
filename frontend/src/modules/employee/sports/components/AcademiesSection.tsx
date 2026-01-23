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
import { getAllAcademies } from "@/lib/api/apiAcademy"
import { url } from "inspector"
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
import { deleteAcademyById } from "@/lib/api/apiAcademy";
import { toast } from "sonner";
import { QueryClient } from "@tanstack/react-query"
// Schema definition
export const AcademySchema = z.object({
    id: z.number(),
    name: z.string(),
    deporte: z.string(),
    numeroCursos: z.number(),
    numeroInscritos: z.number(),
    description: z.string(),
    urlImage: z.string().optional(),
})

export type AcademyType = {
    id: number,
    name: string,
    sport: string,
    urlImage?: string,
    description: string,
    numeroInscritos: string,
    numeroCursos: number,
}

export type AcademyItem = z.infer<typeof AcademySchema>

async function deleteAcademy(id: number) {
    // Simulación de borrado
    //console.log(`[SIMULACIÓN] borrar Academia con id=${id}`);
    return Promise.resolve();
}

// DataTable component
export default function DataTable() {

    const queryClient = useQueryClient();

    // Table states
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})

    const { isLoading, data: dataAca, refetch } = useQuery({
        queryKey: ['get-all-academy'],
        queryFn: () => getAllAcademies(),
    });


    const deleteMutation = useMutation({
        mutationFn: (id: number) => deleteAcademyById(id.toString()),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['get-all-academy'],
            });
            toast.success(
                <>
                    <strong>Academia eliminada correctamente.</strong>
                </>
            );
        },
        onError: (error: Error) => {
            toast.error(
                <>
                    <strong>Error al eliminar academia.</strong>
                    <div>{error?.message || "Error desconocido"}</div>
                </>
            );
        },
    });


    const rawAcademy = React.useMemo(() => {
        if (!Array.isArray(dataAca)) return [];
        return dataAca.map(academy => ({
            id: academy.id,
            name: academy.name,
            deporte: academy.sport,
            numeroCursos: academy.numeroCursos,
            numeroInscritos: Number(academy.numeroInscritos),
            description: academy.description,
        }));
    }, [dataAca]);


    const dataAcademy = React.useMemo(() => {
        return rawAcademy
            .map(item => AcademySchema.safeParse(item))
            .filter(result => result.success)
            .map(result => result.data)
    }, [rawAcademy]);

    // const dataAcademy: AcademyItem[] = rawAcademy.map(item => AcademySchema.parse(item))

    // Columns configuration
    const columns: MyColumnDef<AcademyItem>[] = [

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
            accessorKey: "deporte",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="text-[var(--brand)] font-semibold"
                    >
                        Deporte
                        <ArrowUpDown />
                    </Button>
                )
            },
            headerText: "Deporte",
            cell: ({ row }) => (
                <div className="text-left pl-3 ">
                    <span>
                        {row.getValue("deporte")}
                    </span>
                </div>
            )
        },
        {
            accessorKey: "numeroCursos",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="text-[var(--brand)] font-semibold"
                    >
                        N° Cursos
                        <ArrowUpDown />
                    </Button>
                )
            },
            headerText: "N° Cursos",
            cell: ({ row }) => (
                <div className="text-left pl-10">
                    <Badge className="bg-[#318161] dark:text-white">{row.original.numeroCursos}</Badge>
                </div>
            )
        },
        {
            accessorKey: "numeroInscritos",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="text-[var(--brand)] font-semibold"
                    >
                        N° Inscritos
                        <ArrowUpDown />
                    </Button>
                )
            },
            headerText: "N° Inscritos",
            cell: ({ row }) => (
                <div className="text-left pl-10">
                    <Badge className="bg-[#318161] dark:text-white">{row.original.numeroInscritos}</Badge>
                </div>
            )
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
                    <Button size="sm" className="button3-custom text-white" onClick={() => navigate(`/employee-sport/academias/${row.original.id}`)}>
                        Ver más
                    </Button>
                    {/* Dialogo de confirmación para eliminar */}
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button size="icon" disabled={deleteMutation.isPending}className="text-white bg-red-500 hover:bg-red-600 font-bold border-0 rounded-lg shadow-[0_0_5px_0px_rgba(0,0,0,0)] shadow-gray-400">
                                <TrashIcon />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="background-custom">
                            <AlertDialogHeader>
                                <AlertDialogTitle>Eliminar Academia</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta acción no se puede deshacer. ¿Seguro que quieres eliminar <span className="font-bold">{row.original.name}</span>?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className="text-white hover:text-white rounded-lg border-0 font-bold  button4-custom">Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                    className="bg-[var(--brand)] text-white font-bold rounded-lg border-0 button3-custom"
                                    onClick={() => deleteMutation.mutate(row.original.id)}
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
        data: dataAcademy,
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
                    onClick={() => exportTableToExcel(dataAcademy, columns, "Academias Deportivas.xlsx")}>
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
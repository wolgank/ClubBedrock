import { Pencil, Trash , Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  getPaginationRowModel,
  SortingState,
  ColumnFiltersState,
  getFilteredRowModel,
  FilterFn,
} from "@tanstack/react-table";
import { useState, useEffect} from "react";
import { Account } from "../schema/AccountSchema";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface AccountsTableProps {
  data: Account[];
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onView: (id:number) => void;
}

export function AccountsTable({ data, onEdit, onDelete, onView }: AccountsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [searchCriteria, setSearchCriteria] = useState<'name' | 'email'>('name');
  const [searchValue, setSearchValue] = useState('');


  const columns: ColumnDef<Account>[] = [
    {
      accessorKey: "auth.id",
      header: "ID",
      enableSorting: true
    },
    {
        accessorFn: (row) => `${row.user.name} ${row.user.lastname}`,
        header: "Nombre",
        enableSorting: true,
        id: "fullName", // Identificador único necesario cuando usas accessorFn
    },
    {
        id:"email",
        accessorFn: (row) => row.auth.email,
        header: "Correo",
        enableSorting: true,
    },
    {
        accessorFn: (row) => row.auth.role,
        header: "Rol",
        enableSorting: true,
        id: "role",
        sortingFn: (a, b) => a.original.auth.role.localeCompare(b.original.auth.role), // Función personalizada
        cell: ({ row }) => mapRole(row.original.auth.role),
        filterFn: (row, columnId, filterValue) => {
            const value = row.getValue(columnId);  // Obtener el valor de la columna
            // Compara si el valor de la columna 'role' coincide con el filtro
            return filterValue === 'all' || value === filterValue;
        }
    },
    {
        id: "status",
        header: "Estado",
        enableSorting: true,
        cell: ({ row }) => row.original.auth.isActive ? "Activo" : "Inactivo",
        sortingFn: (a, b) => (a.original.auth.isActive === b.original.auth.isActive ? 0 : a.original.auth.isActive ? 1 : -1),
        accessorFn: (row) => row.auth.isActive,
        filterFn: (row, columnId, filterValue) => {
        const value = row.getValue(columnId);
        return filterValue === undefined || value === filterValue;
    }
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => (
        <div className="flex gap-2">
            {/* Editar */}
        <Button onClick={() => onEdit(row.original.auth.id)} size="icon" variant="outline">
            <Pencil className="h-4 w-4" />
        </Button>

        {/* Eliminar */}
        <Button onClick={() => onDelete(row.original.auth.id)} size="icon" variant="destructive">
            <Trash className="h-4 w-4" />
        </Button>

        {/* Ver detalles */}
        <Button onClick={() => onView(row.original.auth.id)} size="icon" variant="outline">
            <Eye className="h-4 w-4" />
        </Button>
        </div>
      ),
    },
  ];

    // Efecto para aplicar el filtro de búsqueda según el criterio seleccionado
  useEffect(() => {
    if (searchValue) {
      if (searchCriteria === 'name') {
        table.getColumn('fullName')?.setFilterValue(searchValue);
        table.getColumn('email')?.setFilterValue(undefined);
      } else {
        table.getColumn('email')?.setFilterValue(searchValue);
        table.getColumn('fullName')?.setFilterValue(undefined);
      }
    } else {
      table.getColumn('fullName')?.setFilterValue(undefined);
      table.getColumn('email')?.setFilterValue(undefined);
    }
  }, [searchValue, searchCriteria]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    sortDescFirst: false,
  });

  return (
    <div className="space-y-4">
      {/* Controles de filtrado avanzado */}
      <div className="flex flex-col sm:flex-row gap-4 py-4">
        {/* Selector de criterio de búsqueda + Input */}
        <div className="flex gap-2 flex-1">
          <Select 
            value={searchCriteria}
            onValueChange={(value: 'name' | 'email') => setSearchCriteria(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Buscar por..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Nombre</SelectItem>
              <SelectItem value="email">Correo</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder={`Buscar por ${searchCriteria === 'name' ? 'nombre' : 'correo'}...`}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="max-w-md"
          />
        </div>

        {/* Filtro por Rol */}
        <Select
            value={(table.getColumn('role')?.getFilterValue() as string) ?? 'all'}
            onValueChange={(value) => {
                if (value === 'all') {
                table.getColumn('role')?.setFilterValue(undefined);  // Limpia el filtro de rol
                } else {
                table.getColumn('role')?.setFilterValue(value);
                //console.log(value)  // Usa el valor real del rol
                }
            }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Todos los roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los roles</SelectItem>
            <SelectItem value="ADMIN">Administrador</SelectItem>
            <SelectItem value="SPORTS">Responsable de deportes</SelectItem>
            <SelectItem value="EVENTS">Responsable de eventos</SelectItem>
            <SelectItem value="MEMBERSHIP">Responsable de membresías</SelectItem>
            <SelectItem value="MEMBER">Miembro</SelectItem>
            <SelectItem value="GUEST">Invitado</SelectItem>
          </SelectContent>
        </Select>

        {/* Filtro por Estado */}
        <Select
          value={(table.getColumn('status')?.getFilterValue() as string) ?? 'all'}
          onValueChange={(value) => {
            const boolValue = value === 'active' ? true : value === 'inactive' ? false : undefined;
            table.getColumn('status')?.setFilterValue(boolValue);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Todos los estados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="active">Activo</SelectItem>
            <SelectItem value="inactive">Inactivo</SelectItem>
          </SelectContent>
        </Select>
      </div>

        
      {/* Tabla */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No hay resultados
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Controles de paginación */}
      <div className="flex items-center justify-between px-2">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} registros en total
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Siguiente
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Filas por página</p>
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => {
                table.setPageSize(Number(e.target.value));
              }}
              className="h-8 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {[5, 10, 20, 30, 40, 50].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

function mapRole(role: string) {
  return {
    SPORTS: "Responsable de deportes",
    EVENTS: "Responsable de eventos",
    MEMBERSHIP: "Responsable de membresías",
    ADMIN: "Administrador",
    MEMBER: "Miembro",
    GUEST: "Invitado"
  }[role];
}
import { EventInfo } from "@/shared/types/Activities";
import useUserEvents from "../hooks/UseUserEvents";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ColumnDef, flexRender, getCoreRowModel, getFilteredRowModel, useReactTable } from "@tanstack/react-table";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { useCallback, useMemo, useState } from "react";
import EventDetails from "../../event-list/modals/EventDetails";
import useMemberType from "@/shared/hooks/UseMemberType";
import { isAllowedMember, transformDate } from "@/shared/utils/utils";
import { useNavigate } from "react-router-dom";
import { EventPageState } from "../../../utils/Events";
import { Input } from "@/components/ui/input";
import { FilterFn } from "@tanstack/react-table";
import { useUser } from "@/shared/context/UserContext";

const dateRangeFilter: FilterFn<EventInfo> = (row, columnId, value) => {
  const [start, end] = value as [string | null, string | null];
  const rowDate = (row.getValue(columnId) as string).slice(0, 10);

  if (!rowDate) return false;
  if (start && rowDate < start) return false;
  if (end && rowDate > end) return false;
  return true;
};

const columnClassMap: Record<string, string> = {
  name: "w-sm md:w-md",
  spaceUsed: "w-sm md:w-md",
  date: "w-32",
  acciones: "w-32 text-center",
};

export default function UserEventsTable() {
  const navigate = useNavigate();
  
  const [eventToShow, setEventToShow] = useState<EventInfo | null>(null);
  const { userEvents: data, loadingUserEvents } = useUserEvents();
  
  const { memberType, loadingMemberType } = useMemberType();
  const { membership, loading: loadingUser } = useUser();
  
  const canInscribeAndPay = useMemo(() => {
      if(loadingMemberType || loadingUser) return false;
      return membership?.active && isAllowedMember(memberType);
  }, [loadingMemberType, loadingUser, memberType, membership?.active]);

  
  const handleGoToInscription = useCallback(() => {
    navigate("/eventos/inscripcion", {
      state: {
        stateEvent: eventToShow
      } as EventPageState
    })
  }, [eventToShow, navigate]);

  const columns: ColumnDef<EventInfo>[] = useMemo(() => [
    {
      accessorKey: "name",
      header: () => <div className="text-[var(--brand)] font-semibold pl-3 md:w-sm">Nombre</div>,
      cell: ({ row }) => (
        <div className="text-left pl-3 truncate text-ellipsis">
          {row.getValue("name")}
        </div>
      )
    },
    {
      accessorKey: "spaceUsed",
      header: () => <div className="text-[var(--brand)] font-semibold pl-3">Espacio</div>,
      cell: ({ row }) => (
        <div className="text-left pl-3 truncate text-ellipsis">
          {row.getValue("spaceUsed")}
        </div>
      )
    },
    {
      accessorKey: "date",
      filterFn: dateRangeFilter,
      header: () => <div className="text-[var(--brand)] font-semibold text-center pl-3">Fecha</div>,
      cell: ({ row }) => (
        <div className="text-center pl-3">
          {transformDate(row.getValue("date"))}
        </div>
      )
    },
    {
      accessorKey: "capacity",
      header: () => <div className="text-[var(--brand)] font-semibold pl-3">Inscritos/Capacidad</div>,
      cell: ({ row }) => (
        <div className="text-center m-auto">
          <Badge className="bg-[#318161] dark:text-white">
            {row.original.registerCount + " / " + row.getValue("capacity")}
          </Badge>
        </div>
      ),
    },
    {
      id: "acciones",
      cell: ({ row }) => (
        <div>
          <Button
            size="sm"
            className="button3-custom text-white pl-3"
            onClick={() => setEventToShow(row.original)}
          >
            Ver más
          </Button>
        </div>
      ),
    },
  ], []);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel()
  });

  const dateRange = table?.getColumn("date")?.getFilterValue() as [string | null, string | null] | undefined;

  if(loadingUserEvents) {
    return (
        <div>
            Cargando...
        </div>
    )
  }

  return (
    <>
      <div className="w-full max-w-[1339px] p-[30px] rounded-2xl background-custom">
        {/* Sección de filtros */}
        <div className="w-full flex items-end justify-between gap-6">
          {/* FILTROS */}
          <div className="flex flex-wrap gap-6">
            {/* Filtro por nombre */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-muted-foreground mb-1">Buscar por nombre</label>
              <Input
                placeholder="Ej: Cine al aire libre"
                value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                onChange={(event) =>
                  table.getColumn("name")?.setFilterValue(event.target.value)
                }
                className="w-[250px] shadow-md"
              />
            </div>

            {/* Rango de fechas */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-muted-foreground mb-1">Rango de fechas</label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={dateRange?.[0] ?? ""}
                  onChange={(e) => {
                    const newStart = e.target.value || null;
                    const oldEnd = dateRange?.[1];
                    table.getColumn("date")?.setFilterValue([newStart, oldEnd]);
                  }}
                  className="w-[160px] shadow-md"
                />
                <span className="self-center text-muted-foreground">–</span>
                <Input
                  type="date"
                  value={dateRange?.[1] ?? ""}
                  onChange={(e) => {
                    const oldStart = dateRange?.[0];
                    const newEnd = e.target.value || null;
                    table.getColumn("date")?.setFilterValue([oldStart, newEnd]);
                  }}
                  className="w-[160px] shadow-md"
                />
              </div>
            </div>
          </div>
          {/* Botón reestablecer */}
          <div>
            <Button
                size="sm"
                className="button4-custom text-[var(--text-light)]"
                onClick={() => {
                    table.getColumn("name")?.setFilterValue("");
                    table.getColumn("date")?.setFilterValue([null, null]);
                }}
            >
                Reestablecer filtros
            </Button>
            </div>
        </div>
        <div className="overflow-auto rounded-lg py-2 mt-4">
            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map(headerGroup => (
                        <TableRow key={headerGroup.id}  >
                            {headerGroup.headers.map(header => (
                                <TableHead key={header.id} className={columnClassMap[header.column.id] ?? ""}>{flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                )}</TableHead>
                            ))}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map(row => (
                            <TableRow key={row.id}>
                                {row.getVisibleCells().map(cell => (
                                    <TableCell key={cell.id} className={columnClassMap[cell.column.id] ?? ""}>
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
                                No hay inscripciones activas.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
      </div>
      
      { eventToShow &&
        <EventDetails
          event={eventToShow}
          canInscribeAndPay={canInscribeAndPay}
          onGoToInscription={handleGoToInscription}
          onClose={() => setEventToShow(null)}
        />
      }
    </>
    );
}

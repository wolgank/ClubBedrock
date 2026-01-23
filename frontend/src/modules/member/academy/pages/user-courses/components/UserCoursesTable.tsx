import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCallback, useMemo, useState } from "react";
import useUserCourses from "../hooks/UseUserCourses";
import { ColumnDef, flexRender, getCoreRowModel, getFilteredRowModel, useReactTable } from "@tanstack/react-table";
import CourseDetails from "../../academy-courses/modals/CourseDetails";
import { AcademyPageState, UserCourseInscription } from "../../../utils/Academies";
import CourseSchedule from "../../academy-inscription/components/CourseSchedule";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import useMemberType from "@/shared/hooks/UseMemberType";
import { isAllowedMember } from "@/shared/utils/utils";
import { Input } from "@/components/ui/input";
import { useUser } from "@/shared/context/UserContext";

const columnClassMap: Record<string, string> = {}

export default function UserCoursesTable() {
    const navigate = useNavigate();
    const [userCourseToShow, setUserCourseToShow] = useState<UserCourseInscription | null>(null);
    const { userCourses: data, loadingUserCourses } = useUserCourses();
    const { membership, loading: loadingUser } = useUser();

    const handleGoToInscription = useCallback(() => {
        navigate("/academias/inscripcion", {
            state: {
                selectedAcademy: userCourseToShow.academy,
                hasCourseInfo: true,
                selectedCourse: userCourseToShow.course
            } as AcademyPageState
        })
    }, [navigate, userCourseToShow?.academy, userCourseToShow?.course]);

    const { memberType, loadingMemberType } = useMemberType();

    const canInscribeAndPay = useMemo(() => {
        if(loadingMemberType || loadingUser) return false;
        return membership?.active && isAllowedMember(memberType);
    }, [loadingMemberType, loadingUser, memberType, membership?.active]);

    const columns: ColumnDef<UserCourseInscription>[] = useMemo(() => [
        {
            accessorFn: row => row.course.name,
            id: "name",
            filterFn: "includesString",
            header: () => <div className="text-[var(--brand)] font-semibold pl-3">Curso</div>,
            cell: ({ row }) => (
                <div className="text-left pl-3 truncate text-ellipsis">
                    {row.original.course.name}
                </div>
            )
        },
        {
            accessorFn: row => `${row.academy.name} (${row.academy.sport ?? "Sin deporte definido"})`,
            id: "academy",
            filterFn: "includesString",
            header: () => <div className="text-[var(--brand)] font-semibold pl-3">Academia (deporte)</div>,
            cell: ({ row }) => (
                <div className="text-left pl-3 truncate text-ellipsis">
                    {`${row.original.academy.name} (${row.original.academy.sport ?? "Sin deporte definido"})`}
                </div>
            )
        },
        {
            accessorKey: "timeSlotsSelected",
            header: () => <div className="text-[var(--brand)] font-semibold pl-3 text-center">Horario inscrito</div>,
            cell: ({ row }) => (
                <div className="pl-3">
                    <CourseSchedule
                        course={row.original.course}
                        timeSlotsSelected={row.original.timeSlotsSelected}
                    />
                </div>
            )
        },
        {
            id: "acciones",
            cell: ({ row }) => (
            <div>
                <Button
                    size="sm"
                    className="button3-custom text-white pl-3"
                    onClick={() => setUserCourseToShow(row.original)}
                >
                Ver más
                </Button>
            </div>
            ),
        }
    ], []);


    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel()
    });
    
    if(loadingUserCourses) {
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
                {/* Filtro por nombre de curso */}
                <div className="flex flex-col">
                    <label className="text-sm font-medium text-muted-foreground mb-1">Buscar por nombre de curso</label>
                    <Input
                    placeholder="Ej: Fútbol infantil"
                    value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                    onChange={(event) =>
                        table.getColumn("name")?.setFilterValue(event.target.value)
                    }
                    className="w-[250px] shadow-md"
                    />
                </div>
                {/* Filtro por nombre de academia (o deporte) */}
                <div className="flex flex-col">
                    <label className="text-sm font-medium text-muted-foreground mb-1">Buscar por academia / deporte</label>
                    <Input
                    placeholder="Ej: Academia de fútbol"
                    value={(table.getColumn("academy")?.getFilterValue() as string) ?? ""}
                    onChange={(event) =>
                        table.getColumn("academy")?.setFilterValue(event.target.value)
                    }
                    className="w-[250px] shadow-md"
                    />
                </div>
            </div>
            {/* Botón reestablecer */}
            <div>
                <Button
                    size="sm"
                    className="button4-custom text-[var(--text-light)]"
                    onClick={() => {
                        table.getColumn("name")?.setFilterValue("");
                        table.getColumn("academy")?.setFilterValue("");
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
      
      { userCourseToShow &&
        <CourseDetails
            course={userCourseToShow.course}
            canInscribeAndPay={canInscribeAndPay}
            onGoToInscription={handleGoToInscription}
            onClose={() => setUserCourseToShow(null)}
        />
      }
    </>
    );
}
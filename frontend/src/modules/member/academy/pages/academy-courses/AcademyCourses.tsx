import { useLocation, useNavigate } from "react-router-dom"
import { type Academy, type AcademyCourse } from "@/shared/types/Activities";
import { type AcademyPageState } from "../../utils/Academies";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import CourseCard from "./components/CourseCard";
import CourseDetails from "./modals/CourseDetails";
import useMemberType from "@/shared/hooks/UseMemberType";
import { isAllowedMember } from "@/shared/utils/utils";
import useAcademyCourses from "./hooks/UseAcademyCourses";
import { useUser } from "@/shared/context/UserContext";

export default function AcademyCourses() {
    const navigate = useNavigate();
    const location = useLocation();
    
    // STATES y HOOKS
    const [loadingPage, setLoadingPage] = useState(true);
    
    // Datos de la academia (traído del nav state)
    const [academy, setAcademy] = useState<Academy | null>(null);
    
    // Datos de los cursos (traído de llamada al backend)
    const { courses, loadingCourses } = useAcademyCourses(academy);
    
    // State que indica que curso se selecciono y se mostrará sus detalles
    const [courseToShow, setCourseToShow] = useState<AcademyCourse | null>(null);

    // Tipo de miembro
    const { memberType, loadingMemberType } = useMemberType();
    const { membership, loading: loadingUser } = useUser();
    
    // un memo que ha determinado si el usuario actual puede, o no, realizar acciones
    // inscripción/edición (o sea si es titular o cónyugue)
    const canInscribeAndPay = useMemo(() => {
        if(loadingMemberType || loadingUser) return false;
        return membership?.active && isAllowedMember(memberType);
    }, [loadingMemberType, loadingUser, memberType, membership?.active]);
    

    // cargar page state
    const loadPageState = useCallback(async () => {
        const state = location.state as AcademyPageState | null;
        if(!state || state.hasCourseInfo) {
            setAcademy(null);
        } else {
            setAcademy(state.selectedAcademy);
        }
        return state?.selectedAcademy;
    }, [location.state]);

    // effect
    useEffect(() => {
        const loadData = async () => {
            setLoadingPage(true);
            await loadPageState();
            setLoadingPage(false);
        }

        loadData();
    }, [loadPageState]);

    const navigateToCourseInscription = useCallback(() => {
        const state : AcademyPageState = {
            selectedAcademy: academy,
            hasCourseInfo: true,
            selectedCourse: courseToShow,
        }

        navigate("/academias/inscripcion",{ state });
    }, [academy, courseToShow, navigate]);
    
    // handlers
    const handleSeeMore = useCallback(async (course: AcademyCourse) => {
        if(courseToShow !== null) return;
        setCourseToShow(course);
    },[courseToShow]);
    
    // Lógica de renderizado

    if(loadingPage) {
        return (
            <div className="gap-8 px-4 sm:px-6 lg:px-12 py-8">
                Cargando...
            </div>
        )
    }

    if(!academy) {
        return (
            <div className="gap-8 px-4 sm:px-6 lg:px-12 py-8">
                Ups! Academia no encontrada
            </div>
        )
    }

    /* RENDERIZADO */

    return (
        <div className="flex flex-col items-center justify-center gap-8 px-4 sm:px-6 lg:px-12 py-8">
            {/* Botón Regresar */}
            <div className="relative w-full max-w-[1343px] ">
                <Button
                    onClick={() => navigate("/academias")}
                    variant="ghost"
                    className="navigate-custom"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="font-normal text-base">Regresar</span>
                </Button>
            </div>

            {/* Titulo */}
            <div className="relative w-full max-w-[1343px] dark:text-[var(--primary)]">
                    <h1 className="font-bold text-5xl leading-[48px] mb-2">
                        Cursos disponibles
                    </h1>
                    <h2 className="text-2xl mb-1">
                        {academy.name} - {academy.sport || "Deporte no definido"}
                    </h2>
                    <p>
                        {academy.description}
                    </p>
            </div>

            <Separator className="mb-4"/>

            {/* Número de cursos y filtros (a futuro) */}
            <div className="ml-auto text-right">
                { loadingCourses ? "?" : courses.length} curso(s) disponible(s)
            </div>

            {/* Lista de cursos */}
            <div className="w-4/5 flex flex-col items-center gap-5 mb-4">
                { loadingCourses || loadingMemberType ? (
                    <>
                        {Array.from({ length: 9 }).map((_, index) => (
                            <Skeleton
                                key={`skeleton-course-${index}`}
                                className="w-full h-32 rounded-md bg-amber-100/70 dark:bg-gray-700"
                            />
                        ))}
                    </>
                ) : (
                    <>
                        { !memberType || !courses || courses.length === 0 ? <div>Sin cursos disponibles</div> :
                            courses.map((course) => (
                                <CourseCard
                                    key={`course-${course.id}`}
                                    course={course}
                                    onSeeMore={() => handleSeeMore(course)}
                                />
                        ))}
                    </>
                )}
            </div>

            { courseToShow && 
                <CourseDetails
                    course={courseToShow}
                    canInscribeAndPay={canInscribeAndPay}
                    onGoToInscription={navigateToCourseInscription}
                    onClose={() => setCourseToShow(null)}
                />
            }
        </div>
    )
}
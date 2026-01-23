import { type Academy, type AcademyCourse } from "@/shared/types/Activities";
import { type AcademyCourseInscription, type AcademyPageState } from "../../utils/Academies";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useMembershipMembers from "@/shared/hooks/UseMembershipMembers";
import useCourseInitialInscriptions from "./hooks/useCourseInitialInscriptions";
import { Separator } from "@/components/ui/separator";
import NewCourseInscriptionsPanel from "./components/NewCourseInscriptionsPanel";
import PrevCourseInscriptionsPanel from "./components/PrevCourseInscriptionsPanel";
import { dayMap } from "../../utils/utils";
import CourseInscriptionButtonPanel from "./components/CourseInscriptionButtonPanel";
import { CourseInscriptionContext } from "./components/CourseInscriptionContext";
import EmptyInscriptionsPanel from "../../../../../shared/components/EmptyInscriptionsPanel";
import CancelOperationModal from "@/shared/modals/CancelOperationModal";
import { transformDate } from "@/shared/utils/utils";

export default function AcademyInscription() {
    const navigate = useNavigate();
    const location = useLocation();
    
    // STATES

    // Carga de la página
    const [loading, setLoading] = useState(true);

    // Datos de la academia y el curso (traídos del nav state)
    const [academy, setAcademy] = useState<Academy | null>(null);
    const [course, setCourse] = useState<AcademyCourse | null>(null);

    // Miembros de la membresía e inscripciones iniciales (hooks)
    const { membershipMembers, loadingMembers } = useMembershipMembers();
    const { initialInscriptions, loadingInitialInscriptions } = useCourseInitialInscriptions(membershipMembers, course);

    // Modificaciones que se estarán realizando a la inscripción (permitirá detectar cambios y similitudes para determinar
    // acciones)
    const [newInscriptions, setNewInscriptions] = useState<AcademyCourseInscription[]>([]);
    const [cancelledInscriptions, setCancelledInscriptions] = useState<AcademyCourseInscription[]>([]);
    // Para mostrar el modal de cancelación de operación
    const [showCancelModal, setShowCancelModal] = useState(false);

    
    // MEMOS DE VALORES ÚTILES

    // Miembros que se pueden inscribir
    const availableMembers = useMemo(() => {
        if(!initialInscriptions || !membershipMembers) return [];
        const inscritosInicialesActivos = initialInscriptions
        .filter(ins => !cancelledInscriptions.some(cancelled => cancelled.member.id === ins.member.id))
        .map(ins => ins.member);
        
        const nuevosInscritos = newInscriptions.map(ins => ins.member);
        
        return membershipMembers.filter(member =>
            !inscritosInicialesActivos.some(m => m.id === member.id) &&
            !nuevosInscritos.some(m => m.id === member.id)
        );
    }, [membershipMembers, initialInscriptions, newInscriptions, cancelledInscriptions]);
    
    // Inscripciones antiguas que siguen vigentes
    const oldInscriptions = useMemo(() => {
        if(!initialInscriptions) return [];
        return initialInscriptions.filter(ins => !cancelledInscriptions.includes(ins));
    }, [initialInscriptions, cancelledInscriptions]);
    
    // Costo total de nuevas inscripciones
    const newInscriptionsTotalCost = useMemo(() => {
        return newInscriptions
        .map(ins => Number(ins.pricingToApply.inscriptionPriceMember))
        .reduce((sum, curr) => sum + curr, 0.0);
    }, [newInscriptions]);
    
    // Detectar si ha habido cambios en la inscripción
    const inscriptionsHaveNotChanged = useMemo(() => {
        return (newInscriptions.length === 0 && cancelledInscriptions.length === 0);
    }, [cancelledInscriptions.length, newInscriptions.length]);


    // CARGA DE PÁGINA

    // Carga de PageState
    const loadPageState = useCallback(async () => {
        const state = location.state as AcademyPageState | null;

        if (!state || !state.hasCourseInfo) {
            setAcademy(null);
            setCourse(null);
            return;
        }

        setAcademy(state.selectedAcademy);
        setCourse(state.selectedCourse);
    }, [location.state]);
    

    useEffect(() => {
        const loadData = async () => {
            setLoading(true)
            await loadPageState();
            setLoading(false)
        }

        loadData();
    }, [loadPageState]);


    // HANDLERS

    // Agregar un socio a las nuevas inscripciones
    const handleAddNewInscription = useCallback((inscription: AcademyCourseInscription) => {
        // si se verifica que no se anulo una igual...
        setNewInscriptions(prev => [...prev, inscription]);
    }, []);

    // Quitar un socio de las nuevas inscripciones
    const handleRemoveNewInscription = useCallback((memberIdToRemove: number) => {
        setNewInscriptions(prev => prev.filter((inscription) => inscription.member.id !== memberIdToRemove));
    }, []);

    // Dar de baja de una inscripción
    const handleCancelOldInscription = useCallback((oldInscription: AcademyCourseInscription) => {
        setCancelledInscriptions(prev => [...prev, oldInscription]);
    }, []);

    // Devolver una inscripción cancelada
    const handleRecoverOldInscription = useCallback((oldInscription: AcademyCourseInscription) => {
        setCancelledInscriptions(prev => prev.filter(ins => ins !== oldInscription));
    }, []);

    // Ir a cursos de la academia
    const navigateToAcademyCourses = useCallback(() => {
        navigate(-1);
    }, [navigate]);
    
    
    // Regresar / cancelar operación
    const handleReturnClick = useCallback(() => {
        if(inscriptionsHaveNotChanged) {
            navigateToAcademyCourses();
        }
        else {
            setShowCancelModal(true);
        }
    }, [inscriptionsHaveNotChanged, navigateToAcademyCourses]);

    // Restaurar cambios en inscripción (si no se confirma aún)
    const handleInscriptionRestore = useCallback(() => {
        setNewInscriptions([]);
        setCancelledInscriptions([]);
    }, []);

    const isNewInscriptionValid = useCallback((newInscription: AcademyCourseInscription) => {
        const cancelledInscriptionWithSameMember = cancelledInscriptions.find(
            cancelledIns => cancelledIns.member.id === newInscription.member.id
        );

        if(!cancelledInscriptionWithSameMember) return true; // si los miembros no coinciden (no se encontro coincidencias), es válido
        if(course.courseType === 'FIXED') return false; // si tiene el mismo miembro y es 'FIXED', no es válido

        const cancelledSlots = cancelledInscriptionWithSameMember.timeSlotsSelected;
        const newSlots = newInscription.timeSlotsSelected;
        if(cancelledSlots.length !== newSlots.length) return true; // si los horarios no son de la misma longitud, es válido

        // si todos los horarios coinciden exactamente, es inválido
        return !newSlots.every(
            newSlot => cancelledSlots.some(cancelledSlot => cancelledSlot.day === newSlot.day)
        );

    }, [cancelledInscriptions, course?.courseType]);


    // RENDERIZADO

    if(loading || loadingInitialInscriptions || loadingMembers) {
        return (
            <div className="max-w-7xl mx-auto p-4">
                    <h1 className="text-2xl font-bold">Cargando...</h1>
            </div>
        );
    }
    
    if(!academy || !course) {
        return (
            <div className="max-w-7xl mx-auto p-4">
                <h1 className="text-2xl font-bold">Ups! Curso no encontrado</h1>
            </div>
        );
    }

    if(!membershipMembers) {
        return (
            <div className="max-w-7xl mx-auto p-4">
                <h1 className="text-2xl font-bold">Ups! Miembros de membresía no encontrados</h1>
            </div>
        );
    }

    if(initialInscriptions === null) {
        return (
            <div className="max-w-7xl mx-auto p-4">
                <h1 className="text-2xl font-bold">Ups! Hubo un error encontrando las inscripciones previas</h1>
            </div>
        );
    }

    // Si todo está bien ...
    return (
        <CourseInscriptionContext.Provider value={{
            course,
            newInscriptions,
            cancelledInscriptions,
            newInscriptionsTotalCost
        }}>
            <div className="flex flex-col items-center justify-center gap-8 px-4 sm:px-6 lg:px-12 py-8">
                {/* Botón Regresar */}
                <div className="relative w-full max-w-[1343px] ">
                    <Button
                        onClick={handleReturnClick}
                        variant="ghost"
                        className="navigate-custom"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="font-normal text-base ">Regresar</span>
                    </Button>
                </div>

                {/* Título y subtítulos */}
                <div className="relative w-full max-w-[1343px] dark:text-[var(--primary)]">
                    <h1 className="font-bold text-5xl leading-[48px] ">
                        Inscripción a academias
                    </h1>
                    <h2 className="text-2xl my-1">
                        {course.name} - {academy.sport || "Deporte no definido"}
                    </h2>
                    <p>
                        {`Duración del curso: ${transformDate(course.startDate)} > ${transformDate(course.endDate)}`}
                    </p>
                    <p>
                        {course.courseType === "FIXED" ? "Horario fijo: " : "Horario flexible: "}
                        {course.schedule
                            .map((timeSlot) => {
                                return `${dayMap[timeSlot.day]} ${timeSlot.startTime.slice(0, 5)} - ${timeSlot.endTime.slice(0, 5)}`
                            })
                            .join(', ')
                        }
                    </p>
                </div>

                <Separator />

                {/* Paneles de inscripción */}
                <div className="flex flex-wrap justify-center gap-10 mt-6 w-full">
                
                    <NewCourseInscriptionsPanel
                        availableMembers={availableMembers}
                        isInscriptionValid={isNewInscriptionValid}
                        onAddInscription={handleAddNewInscription}
                        onRemoveInscription={handleRemoveNewInscription}
                    />

                    { initialInscriptions.length > 0 ? (
                        <PrevCourseInscriptionsPanel
                            oldInscriptions={oldInscriptions}
                            onCancelInscription={handleCancelOldInscription}
                            onRecoverInscription={handleRecoverOldInscription}
                        />
                    ) : (
                        <EmptyInscriptionsPanel />
                    )}

                </div>

                {/* Botonera */}
                <CourseInscriptionButtonPanel
                    isOnlyInscription={initialInscriptions.length === 0}
                    inscriptionsHaveNotChanged={inscriptionsHaveNotChanged}
                    onRestore={handleInscriptionRestore}
                />

                {/* Modal de cancelación */}
                { showCancelModal &&
                    <CancelOperationModal
                        onConfirm={navigateToAcademyCourses}
                        onCancel={() => setShowCancelModal(false)}
                    />
                }
            </div>
        </CourseInscriptionContext.Provider>
    )
}
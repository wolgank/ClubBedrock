import useMembershipMembers from "@/shared/hooks/UseMembershipMembers";
import { EventInfo } from "@/shared/types/Activities";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useEventInitialInscriptions from "./hooks/UseEventInitialInscriptions";
import { Member } from "@/shared/types/Person";
import { EventPageState } from "../../utils/Events";
import { EventInscriptionContext } from "./components/EventInscriptionContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import EmptyCourseInscriptionsPanel from "@/shared/components/EmptyInscriptionsPanel";
import CancelOperationModal from "@/shared/modals/CancelOperationModal";
import NewEventInscriptionsPanel from "./components/NewEventInscriptionsPanel";
import PrevEventInscriptionsPanel from "./components/PrevEventInscriptionsPanel";
import EventInscriptionButtonPanel from "./components/EventInscriptionButtonPanel";
import NoInscriptionsAllowedPanel from "@/shared/components/ui/NoInscriptionsAllowedPanel";
import { transformDate, transformHour } from "@/shared/utils/utils";

export default function EventInscription() {
     const navigate = useNavigate();
    const location = useLocation();
    
    // STATES

    // Carga de la página
    const [loading, setLoading] = useState(true);

    // Datos de la academia y el curso (traídos del nav state)
    const [event, setEvent] = useState<EventInfo | null>(null);

    // Miembros de la membresía e inscripciones iniciales (hooks)
    const { membershipMembers, loadingMembers } = useMembershipMembers();
    const { initialInscriptions, loadingInitialInscriptions } = useEventInitialInscriptions(membershipMembers, event);

    // Modificaciones que se estarán realizando a la inscripción (permitirá detectar cambios y similitudes para determinar
    // acciones)
    const [newInscriptions, setNewInscriptions] = useState<Member[]>([]);
    const [cancelledInscriptions, setCancelledInscriptions] = useState<Member[]>([]);
    // Para mostrar el modal de cancelación de operación
    const [showCancelModal, setShowCancelModal] = useState(false);

    
    // MEMOS DE VALORES ÚTILES

    // Miembros que se pueden inscribir
    const availableMembers = useMemo(() => {
        if(!initialInscriptions || !membershipMembers) return [];
        const inscritosInicialesActivos = initialInscriptions
        .filter(initialMember => !cancelledInscriptions.some(cancelledMember => cancelledMember.id === initialMember.id));
        
        return membershipMembers.filter(member =>
            !inscritosInicialesActivos.some(m => m.id === member.id) &&
            !newInscriptions.some(m => m.id === member.id)
        );
    }, [membershipMembers, initialInscriptions, newInscriptions, cancelledInscriptions]);
    
    // Inscripciones antiguas que siguen vigentes
    const oldInscriptions = useMemo(() => {
        if(!initialInscriptions) return [];
        return initialInscriptions.filter(initialMember => !cancelledInscriptions.includes(initialMember));
    }, [initialInscriptions, cancelledInscriptions]);
    
    // Costo total de nuevas inscripciones
    const newInscriptionsTotalCost = useMemo(() => {
        if(!newInscriptions || !event) return 0;
        return newInscriptions.length * event.ticketPriceMember;
    }, [event, newInscriptions]);
    
    // Detectar si ha habido cambios en la inscripción
    const inscriptionsHaveNotChanged = useMemo(() => {
        return (newInscriptions.length === 0 && cancelledInscriptions.length === 0);
    }, [cancelledInscriptions.length, newInscriptions.length]);

    // Otros memos
    const isFull = useMemo(() => {
        if(!event?.capacity || !event?.registerCount) return false;
        return event.registerCount >= event.capacity;
    }, [event?.capacity, event?.registerCount]);

    // CARGA DE PÁGINA

    // Carga de PageState
    const loadPageState = useCallback(async () => {
        const state = location.state as EventPageState | null;

        if (!state) {
            setEvent(null);
            return;
        }

        setEvent(state.stateEvent);
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
    const handleAddNewInscription = useCallback((inscription: Member) => {
        // si se verifica que no se anulo una igual...
        setNewInscriptions(prev => [...prev, inscription]);
    }, []);

    // Quitar un socio de las nuevas inscripciones
    const handleRemoveNewInscription = useCallback((memberIdToRemove: number) => {
        setNewInscriptions(prev => prev.filter((inscription) => inscription.id !== memberIdToRemove));
    }, []);

    // Dar de baja de una inscripción
    const handleCancelOldInscription = useCallback((oldInscription: Member) => {
        setCancelledInscriptions(prev => [...prev, oldInscription]);
    }, []);

    // Devolver una inscripción cancelada
    const handleRecoverOldInscription = useCallback((oldInscription: Member) => {
        setCancelledInscriptions(prev => prev.filter(ins => ins !== oldInscription));
    }, []);

    // Ir a cursos de la academia
    const navigateToEventList = useCallback(() => {
        navigate(-1);
    }, [navigate]);
    
    
    // Regresar / cancelar operación
    const handleReturnClick = useCallback(() => {
        if(inscriptionsHaveNotChanged) {
            navigateToEventList();
        }
        else {
            setShowCancelModal(true);
        }
    }, [inscriptionsHaveNotChanged, navigateToEventList]);

    // Restaurar cambios en inscripción (si no se confirma aún)
    const handleInscriptionRestore = useCallback(() => {
        setNewInscriptions([]);
        setCancelledInscriptions([]);
    }, []);

    const isNewInscriptionValid = useCallback((newInscription: Member) => {
        return !cancelledInscriptions.some(
            cancelledMember => cancelledMember.id === newInscription.id
        );
    }, [cancelledInscriptions]);


    // RENDERIZADO

    if(loading || loadingInitialInscriptions || loadingMembers) {
        return (
            <div className="max-w-7xl mx-auto p-4">
                    <h1 className="text-2xl font-bold">Cargando...</h1>
            </div>
        );
    }
    
    if(!event) {
        return (
            <div className="max-w-7xl mx-auto p-4">
                <h1 className="text-2xl font-bold">Ups! Evento no encontrado</h1>
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
        <EventInscriptionContext.Provider value={{
            event,
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
                        Inscripción a eventos
                    </h1>
                    <h2 className="text-2xl my-1">
                        {event.name}
                    </h2>
                    <p>
                        {`Fecha y hora: ${transformDate(event.date)} - ${transformHour(event.startHour)} > ${transformHour(event.endHour)}`}
                    </p>
                </div>

                <Separator />

                {/* Paneles de inscripción */}
                <div className="flex flex-wrap justify-center gap-10 mt-6 w-full">

                    { isFull ? (
                        <NoInscriptionsAllowedPanel />
                    ) : (
                        <NewEventInscriptionsPanel
                            availableMembers={availableMembers}
                            isInscriptionValid={isNewInscriptionValid}
                            onAddInscription={handleAddNewInscription}
                            onRemoveInscription={handleRemoveNewInscription}
                        />
                    )}
                    

                    { initialInscriptions.length > 0 ? (
                        <PrevEventInscriptionsPanel
                            oldInscriptions={oldInscriptions}
                            onCancelInscription={handleCancelOldInscription}
                            onRecoverInscription={handleRecoverOldInscription}
                        />
                    ) : (
                        <EmptyCourseInscriptionsPanel />
                    )}

                </div>

                {/* Botonera */}
                <EventInscriptionButtonPanel
                    isOnlyInscription={initialInscriptions.length === 0}
                    inscriptionsHaveNotChanged={inscriptionsHaveNotChanged}
                    onRestore={handleInscriptionRestore}
                />

                {/* Modal de cancelación */}
                { showCancelModal &&
                    <CancelOperationModal
                        onConfirm={navigateToEventList}
                        onCancel={() => setShowCancelModal(false)}
                    />
                }
            </div>
        </EventInscriptionContext.Provider>
    )
}